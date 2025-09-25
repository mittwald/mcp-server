import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { userAccountStore } from '../services/user-account-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';
import { createHash } from 'crypto';
import {
  getMittwaldMetadata,
  resolveAuthorizationScope,
  recordScopeResolution,
  extractScopeString,
  type ScopeResolutionSource,
} from '../services/mittwald-metadata.js';

// Simple callback state store (replaces complex interaction store)
interface CallbackState {
  state: string;
  codeVerifier: string;
  interactionUid: string;
  createdAt: number;
  requestedScope?: string;
  scopeSource: ScopeResolutionSource;
}

interface InteractionState {
  accountId: string;
  loginCompleted: boolean;
  requestedScope?: string;
  scopeSource?: ScopeResolutionSource;
  mittwaldScope?: string;
  updatedAt: number;
}

const mittwaldCallbackState = new Map<string, CallbackState>();
const mittwaldInteractionState = new Map<string, InteractionState>();

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
  const expiredCallbackStates: string[] = [];

  for (const [state, callbackState] of mittwaldCallbackState.entries()) {
    if (now - callbackState.createdAt > 15 * 60 * 1000) {
      expiredCallbackStates.push(state);
    }
  }

  for (const state of expiredCallbackStates) {
    mittwaldCallbackState.delete(state);
  }

  if (expiredCallbackStates.length > 0) {
    logger.info('CALLBACK STATE: Cleaned up expired states', { count: expiredCallbackStates.length });
  }

  const expiredInteractionStates: string[] = [];
  for (const [uid, interaction] of mittwaldInteractionState.entries()) {
    const ttl = interaction.loginCompleted ? 10 * 60 * 1000 : 20 * 60 * 1000;
    if (now - interaction.updatedAt > ttl) {
      expiredInteractionStates.push(uid);
    }
  }

  for (const uid of expiredInteractionStates) {
    mittwaldInteractionState.delete(uid);
  }

  if (expiredInteractionStates.length > 0) {
    logger.info('INTERACTION STATE: Cleaned up expired entries', { count: expiredInteractionStates.length });
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
      const interactionState = mittwaldInteractionState.get(details.uid) || null;
      const sessionAccountId = interactionState?.accountId
        ?? details.session?.accountId
        ?? null;

      const consentPromptRequested =
        prompt === 'consent'
        || details.prompt?.details?.missingOIDCScope
        || details.prompt?.details?.missingOAuth2Scope;

      if (interactionState && !interactionState.loginCompleted) {
        logger.info('INTERACTION: Completing login stage after Mittwald authentication', {
          uid: details.uid,
          accountId: interactionState.accountId.substring(0, 16) + '...',
        });

        interactionState.loginCompleted = true;
        interactionState.updatedAt = Date.now();
        mittwaldInteractionState.set(details.uid, interactionState);

        await (provider as any).interactionFinished(ctx.req, ctx.res, {
          login: {
            accountId: interactionState.accountId,
            remember: false,
            ts: Math.floor(Date.now() / 1000)
          }
        });

        ctx.respond = false;
        return;
      }

      if (consentPromptRequested && sessionAccountId) {
        const account = userAccountStore.get(sessionAccountId);

        if (account) {
          const scopeString = interactionState?.mittwaldScope
            || account.mittwaldScope
            || interactionState?.requestedScope
            || extractScopeString(details.params?.scope);

          const scopeSource = interactionState?.mittwaldScope
            ? 'mittwald'
            : account.mittwaldScope
              ? 'mittwald'
              : interactionState?.scopeSource
                ?? account.scopeSource
                ?? 'request';

          const grantedScopes = scopeString ? scopeString.split(' ').filter(Boolean) : [];

          logger.info('INTERACTION: Auto-granting consent based on Mittwald authorization', {
            uid: details.uid,
            clientId,
            accountId: sessionAccountId.substring(0, 16) + '...',
            scopeSource,
            scopeString,
            grantedScopesCount: grantedScopes.length,
          });

          await (provider as any).interactionFinished(ctx.req, ctx.res, {
            consent: {
              grantedScopes,
              rejectedScopes: []
            }
          }, { mergeWithLastSubmission: true });

          ctx.respond = false;
          if (interactionState) {
            mittwaldInteractionState.delete(details.uid);
          }
          return;
        }

        logger.info('INTERACTION: Consent requested but Mittwald account missing, redirecting to Mittwald login', {
          uid: details.uid,
          clientId,
          prompt,
        });
      }

      // Login prompt - redirect to Mittwald for authentication
      logger.info('INTERACTION: Login prompt - redirecting to Mittwald', {
        uid: details.uid,
        clientId,
        prompt
      });

      // Initialize Mittwald OAuth client
      const { client, config } = await getMittwaldClient();
      const metadata = await getMittwaldMetadata();
      const state = nanoid(24);
      const nonce = nanoid(24);
      const { codeVerifier, codeChallenge } = createPkce();

      const clientRequestedScope = extractScopeString(details.params?.scope);
      const scopeResolution = resolveAuthorizationScope(metadata, clientRequestedScope);
      recordScopeResolution(scopeResolution, {
        phase: 'interaction-login',
        interactionUid: details.uid,
        clientId,
      });

      // Store minimal state for callback (just PKCE verifier)
      const callbackState = {
        state,
        codeVerifier,
        interactionUid: details.uid,
        createdAt: Date.now(),
        requestedScope: scopeResolution.scope,
        scopeSource: scopeResolution.source,
      };

      // Store in simple Map for callback retrieval
      mittwaldCallbackState.set(state, callbackState);

      logger.info('INTERACTION: Stored callback state', {
        uid: details.uid,
        state: state.substring(0, 8) + '...',
        hasCodeVerifier: !!codeVerifier
      });

      const authParams: Record<string, any> = {
        redirect_uri: config.redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        nonce,
      };

      if (scopeResolution.scope) {
        authParams.scope = scopeResolution.scope;
      }

      const authorizationUrl = client.authorizationUrl(authParams as any);

      logger.info('INTERACTION: Redirecting to Mittwald authorize', {
        uid: details.uid,
        authorizationUrl: authorizationUrl.substring(0, 100) + '...',
        scopeSource: scopeResolution.source,
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

      const mittwaldScope = extractScopeString(tokenSet.scope);
      recordScopeResolution({ scope: mittwaldScope, source: 'mittwald' }, {
        phase: 'mittwald-callback',
        interactionUid: callbackState.interactionUid,
        accountId: accountId.substring(0, 16) + '...',
      });

      logger.info('MITTWALD CALLBACK: Storing user account', {
        accountId: accountId.substring(0, 16) + '...',
        hasAccessToken: !!tokenSet.access_token,
        hasRefreshToken: !!tokenSet.refresh_token,
        interactionUid: callbackState.interactionUid,
        mittwaldScope,
        scopeSource: callbackState.scopeSource,
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
        mittwaldScope,
        scopeSource: mittwaldScope ? 'mittwald' : callbackState.scopeSource,
        requestedScope: callbackState.requestedScope,
      });

      logger.info('MITTWALD CALLBACK: Redirecting back to interaction (research-based pattern)', {
        accountId: accountId.substring(0, 16) + '...',
        interactionUid: callbackState.interactionUid,
        method: 'redirect-to-interaction-route'
      });

      mittwaldInteractionState.set(callbackState.interactionUid, {
        accountId,
        loginCompleted: false,
        requestedScope: callbackState.requestedScope,
        scopeSource: callbackState.scopeSource,
        mittwaldScope,
        updatedAt: Date.now(),
      });

      // Clean up original callback state
      mittwaldCallbackState.delete(state);

      // Redirect back to interaction route - let oidc-provider + loadExistingGrant handle completion
      ctx.redirect(`/interaction/${callbackState.interactionUid}`);

      logger.info('MITTWALD CALLBACK: Login completed successfully', {
        accountId: accountId.substring(0, 16) + '...',
        interactionUid: callbackState.interactionUid,
        mittwaldScope,
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

}

// REMOVED: showConsentScreen function
// Mittwald handles all consent - no consent screen needed from our server
