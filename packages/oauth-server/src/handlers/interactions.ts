import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { userAccountStore } from '../services/user-account-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';
import { getDefaultScopeString } from '../config/oauth-scopes.js';
import { createHash } from 'crypto';

// Simple callback state store (replaces complex interaction store)
interface CallbackState {
  state: string;
  codeVerifier: string;
  interactionUid: string;
  createdAt: number;
}

interface AuthResult {
  accountId: string;
  authenticated: boolean;
  timestamp: number;
}

const mittwaldCallbackState = new Map<string, CallbackState>();
const mittwaldAuthResults = new Map<string, AuthResult>();

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderConsentHtml(details: any, scopes: string[]): string {
  const clientName = details?.params?.client_name || details?.client?.clientName || 'OAuth Client';
  const clientId = details?.params?.client_id || details?.client?.clientId || 'unknown-client';
  const scopeList = scopes.map((scope) => `<li><code>${escapeHtml(scope)}</code></li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorize ${escapeHtml(clientName)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; color: #1d1c1d; }
      h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      ul { list-style: disc; margin-left: 1.5rem; }
      .actions { margin-top: 1.5rem; display: flex; gap: 1rem; }
      button { font-size: 1rem; padding: 0.6rem 1.6rem; border-radius: 6px; border: none; cursor: pointer; }
      .approve { background-color: #0b8bff; color: #fff; }
      .deny { background-color: transparent; color: #b00020; border: 1px solid #b00020; }
      code { background: #f2f2f2; padding: 0.15rem 0.35rem; border-radius: 4px; }
      .client-meta { color: #555; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <h1>Authorize ${escapeHtml(clientName)}</h1>
    <p class="client-meta">Client ID: <code>${escapeHtml(clientId)}</code></p>
    <p>The application is requesting access to the following Mittwald permissions:</p>
    <ul>${scopeList}</ul>
    <p>You can allow or deny this access. You may revoke it later from within Mittwald Studio.</p>
    <div class="actions">
      <form method="post" action="/interaction/${escapeHtml(details.uid)}/confirm">
        <button type="submit" class="approve">Allow Access</button>
      </form>
      <form method="post" action="/interaction/${escapeHtml(details.uid)}/abort">
        <button type="submit" class="deny">Deny</button>
      </form>
    </div>
  </body>
</html>`;
}

function deriveMittwaldAccountId(tokenSet: any, fallbackKey: string): {
  accountId: string;
  subject?: string;
  email?: string;
  name?: string;
} {
  try {
    if (typeof tokenSet?.claims === 'function') {
      const claims = tokenSet.claims();
      const subject = claims?.sub || claims?.user_id || claims?.email;
      if (subject) {
        return {
          accountId: `mittwald:${subject}`,
          subject,
          email: claims?.email,
          name: claims?.name || claims?.preferred_username,
        };
      }
    }
  } catch (error) {
    logger.warn('MITTWALD ACCOUNT: Failed to extract claims from tokenSet', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const hashed = createHash('sha256').update(fallbackKey).digest('hex').slice(0, 40);
  return {
    accountId: `mittwald:anon:${hashed}`,
  };
}

// Clean up expired callback states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expired: string[] = [];

  for (const [state, callbackState] of mittwaldCallbackState.entries()) {
    if (now - callbackState.createdAt > 15 * 60 * 1000) { // 15 minutes
      expired.push(state);
    }
  }

  for (const state of expired) {
    mittwaldCallbackState.delete(state);
  }

  if (expired.length > 0) {
    logger.info('CALLBACK STATE: Cleaned up expired states', { count: expired.length });
  }
}, 5 * 60 * 1000);

export function registerInteractionRoutes(router: Router, provider: Provider) {
  // Pure oidc-provider interaction handler
  router.get('/interaction/:uid', async (ctx) => {
    try {
      const { uid } = ctx.params as any;

      logger.info('INTERACTION: Starting oidc-provider interaction', {
        uid,
        path: ctx.path
      });

      // Get oidc-provider interaction details
      const details = await (provider as any).interactionDetails(ctx.req, ctx.res);
      const { clientId } = details.params;
      const prompt = details.prompt?.name;

      logger.info('INTERACTION: Details retrieved', {
        uid: details.uid,
        prompt,
        clientId,
        scopes: details.params?.scope
      });

      // Check if user has been authenticated via Mittwald callback
      const authResult = mittwaldAuthResults.get(`auth_${details.uid}`);
      if (authResult && authResult.authenticated) {
        logger.info('INTERACTION: User authenticated via Mittwald - using loadExistingGrant pattern', {
          uid: details.uid,
          accountId: authResult.accountId.substring(0, 16) + '...',
          method: 'loadExistingGrant-will-handle'
        });

        // Clean up auth state
        mittwaldAuthResults.delete(`auth_${details.uid}`);

        // Complete the authentication step and allow oidc-provider to continue to consent handling
        logger.info('INTERACTION: User authenticated via Mittwald - completing oauth login stage', {
          uid: details.uid,
          accountId: authResult.accountId.substring(0, 16) + '...',
          method: 'interactionFinished-login-only'
        });

        // Complete the interaction login stage - consent will trigger a follow-up prompt
        await (provider as any).interactionFinished(ctx.req, ctx.res, {
          login: {
            accountId: authResult.accountId,
            remember: false,
            ts: Math.floor(Date.now() / 1000)
          }
        });

        // Let oidc-provider handle the response
        ctx.respond = false;
        return;
      }

      // Check if this is a consent prompt (user already authenticated)
      if (prompt === 'consent' || details.prompt?.details?.missingOIDCScope || details.prompt?.details?.missingOAuth2Scope) {
        const requestedScopes = (details.params?.scope as string | undefined)?.split(' ').filter(Boolean) || getDefaultScopeString().split(' ');

        logger.info('INTERACTION: Consent prompt detected - rendering approval screen', {
          uid: details.uid,
          prompt,
          clientId,
          requestedScopes,
        });

        ctx.type = 'text/html; charset=utf-8';
        ctx.body = renderConsentHtml(details, requestedScopes);
        return;
      }

      // Login prompt - redirect to Mittwald for authentication
      logger.info('INTERACTION: Login prompt - redirecting to Mittwald', {
        uid: details.uid,
        clientId,
        prompt
      });

      // Check required Mittwald OAuth configuration
      const missing: string[] = [];
      if (!process.env.MITTWALD_AUTHORIZATION_URL) missing.push('MITTWALD_AUTHORIZATION_URL');
      if (!process.env.MITTWALD_TOKEN_URL) missing.push('MITTWALD_TOKEN_URL');
      if (!process.env.MITTWALD_CLIENT_ID) missing.push('MITTWALD_CLIENT_ID');
      if (!process.env.MITTWALD_REDIRECT_URI) missing.push('MITTWALD_REDIRECT_URI');

      if (missing.length) {
        const msg = `Missing Mittwald OAuth env: ${missing.join(', ')}`;
        logger.error('INTERACTION: Configuration error', { uid: details.uid, missing });
        ctx.status = 500;
        ctx.body = { error: 'server_error', error_description: msg };
        return;
      }

      // Initialize Mittwald OAuth client
      const { client, config } = await getMittwaldClient();
      const state = nanoid(24);
      const nonce = nanoid(24);
      const { codeVerifier, codeChallenge } = createPkce();

      // Store minimal state for callback (just PKCE verifier)
      const callbackState = {
        state,
        codeVerifier,
        interactionUid: details.uid,
        createdAt: Date.now()
      };

      // Store in simple Map for callback retrieval
      mittwaldCallbackState.set(state, callbackState);

      logger.info('INTERACTION: Stored callback state', {
        uid: details.uid,
        state: state.substring(0, 8) + '...',
        hasCodeVerifier: !!codeVerifier
      });

      // Redirect to Mittwald OAuth
      const authorizationUrl = client.authorizationUrl({
        scope: config.scope || getDefaultScopeString(),
        redirect_uri: 'https://mittwald-oauth-server.fly.dev/mittwald/callback',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        nonce,
      } as any);

      logger.info('INTERACTION: Redirecting to Mittwald authorize', {
        uid: details.uid,
        authorizationUrl: authorizationUrl.substring(0, 100) + '...'
      });

      ctx.redirect(authorizationUrl);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('INTERACTION: Error', {
        uid: ctx.params?.uid,
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });

      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: errorMsg };
    }
  });

  // Streamlined Mittwald callback: Pure oidc-provider approach
  async function handleMittwaldCallback(ctx: any) {
    try {
      logger.info('MITTWALD CALLBACK: Starting pure oidc-provider flow', {
        path: ctx.path,
        query: ctx.querystring
      });

      const { client, config } = await getMittwaldClient();
      const params = client.callbackParams(ctx.req);
      const { state, code } = params as any;

      if (!state || !code) {
        logger.error('MITTWALD CALLBACK: Missing required parameters', {
          hasState: !!state,
          hasCode: !!code
        });
        ctx.status = 400;
        ctx.body = { error: 'invalid_request', error_description: 'Missing state or code' };
        return;
      }

      // Retrieve callback state (PKCE verifier)
      const callbackState = mittwaldCallbackState.get(state);
      if (!callbackState) {
        logger.error('MITTWALD CALLBACK: State not found', {
          state: state.substring(0, 8) + '...',
          storeSize: mittwaldCallbackState.size
        });
        ctx.status = 400;
        ctx.body = { error: 'invalid_request', error_description: 'Invalid state parameter' };
        return;
      }

      logger.info('MITTWALD CALLBACK: Exchanging code for tokens', {
        state: state.substring(0, 8) + '...',
        code: code.substring(0, 8) + '...',
        interactionUid: callbackState.interactionUid
      });

      // Exchange Mittwald code for tokens
      const tokenSet = await (client as any).oauthCallback(config.redirectUri, params as any, {
        code_verifier: callbackState.codeVerifier,
        state: callbackState.state
      });

      let subjectInfo: { accountId: string; subject?: string; email?: string; name?: string } | undefined;

      if ((client as any).issuer?.userinfo_endpoint) {
        try {
          const userinfo = await (client as any).userinfo(tokenSet);
          const subject = userinfo?.sub || userinfo?.user_id || userinfo?.email;
          if (subject) {
            subjectInfo = {
              accountId: `mittwald:${subject}`,
              subject,
              email: userinfo?.email,
              name: userinfo?.name || userinfo?.preferred_username,
            };
          }
        } catch (error) {
          logger.warn('MITTWALD CALLBACK: Failed to fetch userinfo, falling back to token claims', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (!subjectInfo) {
        const fallbackKey = tokenSet.refresh_token || tokenSet.access_token || `${callbackState.interactionUid}:${state}`;
        subjectInfo = deriveMittwaldAccountId(tokenSet, fallbackKey);
      }

      const accountId = subjectInfo.accountId;

      logger.info('MITTWALD CALLBACK: Storing user account', {
        accountId: accountId.substring(0, 16) + '...',
        hasAccessToken: !!tokenSet.access_token,
        hasRefreshToken: !!tokenSet.refresh_token,
        interactionUid: callbackState.interactionUid
      });

      // Store user account with Mittwald tokens (for findAccount function)
      userAccountStore.store(accountId, {
        accountId,
        mittwaldAccessToken: tokenSet.access_token,
        mittwaldRefreshToken: tokenSet.refresh_token,
        createdAt: Date.now(),
        expiresAt: tokenSet.expires_in ? Date.now() + (tokenSet.expires_in * 1000) : undefined,
        subject: subjectInfo.subject,
        email: subjectInfo.email,
        name: subjectInfo.name,
      });

      logger.info('MITTWALD CALLBACK: Redirecting back to interaction (research-based pattern)', {
        accountId: accountId.substring(0, 16) + '...',
        interactionUid: callbackState.interactionUid,
        method: 'redirect-to-interaction-route'
      });

      // Store authentication result for interaction route to detect
      const authResult = {
        accountId,
        authenticated: true,
        timestamp: Date.now()
      };

      // Use interaction UID as key for authentication state
      mittwaldAuthResults.set(`auth_${callbackState.interactionUid}`, authResult);

      // Clean up original callback state
      mittwaldCallbackState.delete(state);

      // Redirect back to interaction route - let oidc-provider + loadExistingGrant handle completion
      ctx.redirect(`/interaction/${callbackState.interactionUid}`);

      logger.info('MITTWALD CALLBACK: Login completed successfully', {
        accountId: accountId.substring(0, 16) + '...',
        interactionUid: callbackState.interactionUid
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('MITTWALD CALLBACK: Error', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });

      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Mittwald callback processing failed'
      };
    }
  }

  // Register callback routes
  router.get('/mittwald/callback', handleMittwaldCallback);
  router.get('/oauth/callback', handleMittwaldCallback);
  router.get('/auth/callback', handleMittwaldCallback);

  // Standard OAuth consent confirmation (POST only - user must explicitly consent)
  router.post('/interaction/:uid/confirm', async (ctx) => {
    const { uid } = ctx.params as any;

    logger.info('INTERACTION CONFIRM: Processing consent confirmation', {
      uid,
      method: ctx.method
    });

    const details = await (provider as any).interactionDetails(ctx.req, ctx.res);
    if (details.uid !== uid) {
      logger.error('INTERACTION CONFIRM: UID mismatch', {
        requestUid: uid,
        detailsUid: details.uid
      });
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'uid mismatch' };
      return;
    }

    logger.info('INTERACTION CONFIRM: Granting consent', {
      uid,
      requestedScopes: details.params?.scope,
      clientId: details.params?.client_id
    });

    // Grant consent for all requested scopes (user authenticated via Mittwald)
    const grantedScopes = details.params?.scope?.split(' ') || getDefaultScopeString().split(' ');

    await (provider as any).interactionFinished(ctx.req, ctx.res, {
      consent: {
        grantedScopes: grantedScopes,
        rejectedScopes: []
      }
    }, { mergeWithLastSubmission: true });

    ctx.respond = false;

    logger.info('INTERACTION CONFIRM: Consent granted successfully', {
      uid,
      grantedScopes: grantedScopes.length
    });
  });

  // Abort interaction
  router.post('/interaction/:uid/abort', async (ctx) => {
    const { uid } = ctx.params as any;

    logger.info('INTERACTION ABORT: User denied consent', { uid });

    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction',
    };

    await (provider as any).interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
    ctx.respond = false;
  });
}

// REMOVED: showConsentScreen function
// Mittwald handles all consent - no consent screen needed from our server
