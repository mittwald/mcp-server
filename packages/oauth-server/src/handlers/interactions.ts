import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { userAccountStore } from '../services/user-account-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { mittwaldTokenStore } from '../services/mittwald-token-store.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';
import { getDefaultScopeString } from '../config/oauth-scopes.js';

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

        // User is authenticated and consented via Mittwald - no additional consent needed
        // Mittwald IdP handles consent, we just complete the OAuth flow
        logger.info('INTERACTION: User authenticated via Mittwald - completing OAuth flow', {
          uid: details.uid,
          accountId: authResult.accountId.substring(0, 16) + '...',
          method: 'auto-complete-oauth-flow'
        });

        // Complete the interaction properly - user is authenticated and consented via Mittwald
        // Use interactionFinished to signal authentication completion to oidc-provider
        try {
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

        } catch (interactionError) {
          logger.error('INTERACTION: Failed to complete authenticated interaction', {
            uid: details.uid,
            error: interactionError instanceof Error ? interactionError.message : String(interactionError)
          });

          // Fallback: let oidc-provider handle normally
        }
      }

      // Check if this is a consent prompt (user already authenticated)
      if (prompt === 'consent' || details.prompt?.details?.missingOIDCScope || details.prompt?.details?.missingOAuth2Scope) {
        logger.info('INTERACTION: Consent prompt detected - showing consent screen', {
          uid: details.uid,
          prompt,
          clientId,
          requestedScopes: details.params?.scope
        });

        // Show consent screen for already authenticated user
        return await showConsentScreen(ctx, details);
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

      // Generate stable account ID from access token
      const accountId = `mittwald:${tokenSet.access_token.substring(0, 16)}`;

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
        expiresAt: tokenSet.expires_in ? Date.now() + (tokenSet.expires_in * 1000) : undefined
      });

      // Also store in mittwaldTokenStore for backward compatibility
      mittwaldTokenStore.store(accountId, {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        accountId,
        email: undefined,
        name: undefined,
        issuedAt: Date.now(),
        expiresAt: tokenSet.expires_in ? Date.now() + (tokenSet.expires_in * 1000) : undefined
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

/**
 * Show OAuth consent screen to user
 * This renders a proper consent form where users can see and approve requested scopes
 */
async function showConsentScreen(ctx: any, details: any): Promise<void> {
  const { clientId } = details.params;
  const requestedScopes = details.params?.scope?.split(' ') || [];

  logger.info('CONSENT SCREEN: Rendering consent form', {
    clientId,
    requestedScopes: requestedScopes.length,
    uid: details.uid
  });

  // Render consent screen HTML
  const consentHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authorize Application</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .consent-form { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .scopes { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .scope-item { margin: 5px 0; padding: 5px; background: white; border-radius: 3px; }
        .buttons { margin-top: 20px; text-align: center; }
        .allow-btn { background: #007cba; color: white; padding: 12px 24px; border: none; border-radius: 4px; margin: 0 10px; cursor: pointer; }
        .deny-btn { background: #ccc; color: black; padding: 12px 24px; border: none; border-radius: 4px; margin: 0 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="consent-form">
        <h2>🔐 Authorization Request</h2>
        <p><strong>Client:</strong> ${clientId}</p>
        <p>This application is requesting access to your Mittwald account with the following permissions:</p>

        <div class="scopes">
          <h3>📋 Requested Permissions:</h3>
          ${requestedScopes.map((scope: string) => `<div class="scope-item">🔹 ${scope}</div>`).join('')}
        </div>

        <p>⚠️ <strong>Only grant access if you trust this application.</strong></p>

        <div class="buttons">
          <form method="POST" action="/interaction/${details.uid}/confirm" style="display: inline;">
            <button type="submit" class="allow-btn">✅ Allow Access</button>
          </form>
          <form method="POST" action="/interaction/${details.uid}/abort" style="display: inline;">
            <button type="submit" class="deny-btn">❌ Deny Access</button>
          </form>
        </div>
      </div>
    </body>
    </html>
  `;

  ctx.type = 'text/html';
  ctx.body = consentHtml;
}