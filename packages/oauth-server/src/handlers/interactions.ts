import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { createInteractionStore } from '../services/interaction-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { authCodeStore, type AuthCodeData } from '../services/auth-code-store.js';
import { mittwaldTokenStore } from '../services/mittwald-token-store.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';
import { getDefaultScopeString } from '../config/oauth-scopes.js';

const INTERACTION_TTL = parseInt(process.env.INTERACTION_TTL_SECONDS || '900'); // 15min

export function registerInteractionRoutes(router: Router, provider: Provider) {
  const store = createInteractionStore();

  // Start interaction: attempt Mittwald auth; fallback to dev auto-login/consent
  router.get('/interaction/:uid', async (ctx) => {
    try {
      logger.info('Interaction handler started', {
        uid: ctx.params.uid,
        requestId: ctx.state?.requestId
      });
      let details: any;
      try {
        // Use ctx.req and ctx.res which are the native Node.js objects
        details = await (provider as any).interactionDetails(ctx.req, ctx.res);
      } catch (detailsError) {
        const errorMsg = detailsError instanceof Error ? detailsError.message : String(detailsError);
        logger.error('Failed to get interaction details', {
          uid: ctx.params.uid,
          error: errorMsg,
          errorType: detailsError?.constructor?.name,
          cookies: ctx.cookies.get('_interaction') ? 'present' : 'missing',
          hasReq: !!ctx.req,
          hasRes: !!ctx.res,
          cookieHeader: ctx.req?.headers?.cookie
        });
        ctx.status = 500;
        ctx.body = { error: 'server_error', error_description: errorMsg };
        return;
      }
      
      const { clientId } = details.params;
      const prompt = details.prompt?.name;
      logger.info('Interaction details', { uid: details.uid, prompt, clientId });

      // Check if this is a consent prompt (user already authenticated)
      if (prompt === 'consent' || details.prompt?.details?.missingOIDCScope || details.prompt?.details?.missingOAuth2Scope) {
        logger.info('Consent prompt detected - showing consent screen', {
          uid: details.uid,
          prompt,
          clientId,
          promptDetails: details.prompt?.details
        });

        // Show consent screen for already authenticated user
        return await showConsentScreen(ctx, details, 'authenticated-user');
      }

      // Check if user has already been authenticated via Mittwald
      // If so, show consent screen instead of redirecting to Mittwald again
      const accountId = await checkIfUserAuthenticated(details);
      if (accountId) {
        logger.info('User already authenticated - showing consent screen', {
          accountId: accountId.substring(0, 8) + '...',
          uid: details.uid,
          clientId
        });

        // Show consent screen (this is what oidc-provider expects)
        return await showConsentScreen(ctx, details, accountId);
      }

    // Require Mittwald OAuth configuration to be present; if not, fail explicitly.
    const missing: string[] = [];
    if (!process.env.MITTWALD_AUTHORIZATION_URL) missing.push('MITTWALD_AUTHORIZATION_URL');
    if (!process.env.MITTWALD_TOKEN_URL) missing.push('MITTWALD_TOKEN_URL');
    if (!process.env.MITTWALD_CLIENT_ID) missing.push('MITTWALD_CLIENT_ID');
    if (!process.env.MITTWALD_REDIRECT_URI) missing.push('MITTWALD_REDIRECT_URI');
    if (missing.length) {
      const msg = `Missing Mittwald OAuth env: ${missing.join(', ')}`;
      logger.error('Interaction cannot proceed', { uid: details.uid, prompt, missing });
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: msg };
      return;
    }

      // Mittwald external flow
      const { client, config } = await getMittwaldClient();

    const state = nanoid(24);
    const nonce = nanoid(24);
    const { codeVerifier, codeChallenge } = createPkce();

      const interactionRecord = {
        uid: details.uid, // Use oidc-provider's interaction UID
        oidcInteractionUid: details.uid, // Store oidc-provider UID explicitly
        state,
        nonce,
        codeVerifier,
        clientRedirectUri: details.params.redirect_uri,
        clientId: details.params.client_id,
        createdAt: Date.now()
      };

      logger.info('Storing interaction record', {
        uid: details.uid,
        state: `${state.substring(0, 8)}...`,
        nonce: `${nonce.substring(0, 8)}...`,
        hasCodeVerifier: !!codeVerifier,
        ttlSeconds: INTERACTION_TTL,
        createdAt: interactionRecord.createdAt,
        storeInstance: store.constructor.name
      });

      await store.save(interactionRecord, INTERACTION_TTL);

      logger.info('INTERACTION STORED: Successfully saved to store', {
        uid: details.uid,
        state: `${state.substring(0, 8)}...`,
        fullState: state,
        ttlSeconds: INTERACTION_TTL,
        storeInstance: store.constructor.name
      });

      const authorizationUrl = client.authorizationUrl({
        scope: config.scope || getDefaultScopeString(),
        redirect_uri: 'https://mittwald-oauth-server.fly.dev/mittwald/callback', // Mittwald should redirect to OUR server
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        nonce,
      } as any);

      logger.info('Redirecting to Mittwald authorize', {
        authorizationUrl: authorizationUrl || '',
        redirectUri: config.redirectUri,
        scope: config.scope,
        state,
        codeChallenge: codeChallenge.substring(0, 10) + '...',
      });
      ctx.redirect(authorizationUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Interaction handler error', { 
        uid: ctx.params.uid,
        error: msg,
        errorType: e?.constructor?.name,
        stack: e instanceof Error ? e.stack : undefined
      });
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: msg };
    }
  });

  // Mittwald callback: exchange code and finish login (support multiple allowed paths)
  async function handleMittwaldCallback(ctx: any) {
    try {
      logger.info('Mittwald callback handler started', {
        requestId: ctx.state?.requestId,
        path: ctx.path,
        query: ctx.querystring
      });

      const { client, config } = await getMittwaldClient();
      logger.info('Mittwald client initialized', { requestId: ctx.state?.requestId });

      const params = client.callbackParams(ctx.req);
      logger.info('Callback params parsed', {
        requestId: ctx.state?.requestId,
        paramsKeys: Object.keys(params)
      });
      const { state, code } = params as any;

      logger.info('Mittwald callback received', {
        hasState: !!state,
        hasCode: !!code,
        state: state ? `${state.substring(0, 8)}...` : 'missing',
        code: code ? `${code.substring(0, 8)}...` : 'missing',
        queryParams: ctx.query,
        requestId: ctx.state?.requestId
      });

      if (!state || !code) {
        logger.error('Missing state or code in callback', { state, code: !!code });
        ctx.status = 400;
        ctx.body = { error: 'invalid_request', error_description: 'missing state or code' };
        return;
      }

      // Try to get the record first (without consuming) to see if it exists
      const existingRecord = await store.getByState(state);
      logger.info('Checking for existing interaction record', {
        state: `${state.substring(0, 8)}...`,
        fullState: state,
        recordExists: !!existingRecord,
        recordUid: existingRecord?.uid,
        recordCreatedAt: existingRecord?.createdAt,
        ageMinutes: existingRecord ? (Date.now() - existingRecord.createdAt) / (1000 * 60) : undefined,
        storeInstance: store.constructor.name,
        storeSize: (store as any).size ? (store as any).size() : 'unknown'
      });

      if (!existingRecord) {
        // Check if this is a duplicate callback (state was already consumed)
        const consumedRecord = await (store as any).getConsumedByState?.(state);
        if (consumedRecord) {
          logger.info('Duplicate callback detected - redirecting to client again', {
            state: `${state.substring(0, 8)}...`,
            consumedRecordUid: consumedRecord.uid,
            reason: 'Handling duplicate Mittwald callback gracefully'
          });

          // Redirect to client again (duplicate callback handling)
          const clientRedirectUri = consumedRecord.clientRedirectUri;
          const clientCallbackUrl = new URL(clientRedirectUri);
          clientCallbackUrl.searchParams.set('code', code);
          clientCallbackUrl.searchParams.set('state', state);

          ctx.redirect(clientCallbackUrl.toString());
          return;
        }

        logger.warn('Interaction state already consumed or missing', {
          state: `${state.substring(0, 8)}...`,
          fullState: state,
          reason: 'No record found for state when callback received'
        });
        ctx.status = 204;
        return;
      }

      const record = await store.consumeByState(state);
      if (!record) {
        logger.warn('Interaction record could not be consumed (likely already processed)', {
          state: `${state.substring(0, 8)}...`,
          existingUid: existingRecord.uid
        });
        ctx.status = 204;
        return;
      }

      // Use stored interaction record directly (no dependency on provider.interactionDetails)
      logger.info('USING STORED INTERACTION: Retrieved from interaction store', {
        interactionUid: record.uid,
        clientId: record.clientId,
        clientRedirectUri: record.clientRedirectUri,
        method: 'stored-record'
      });

      logger.info('Exchanging authorization code for tokens', {
        state: `${state.substring(0, 8)}...`,
        code: `${code.substring(0, 8)}...`,
        redirectUri: config.redirectUri,
        hasCodeVerifier: !!record.codeVerifier,
        recordState: record.state ? `${record.state.substring(0, 8)}...` : 'missing',
        recordNonce: record.nonce ? `${record.nonce.substring(0, 8)}...` : 'missing'
      });

      let tokenSet;
      try {
        // Use oauthCallback instead of callback to skip OpenID Connect id_token validation
        // This is appropriate since we're not using openid scope and Mittwald doesn't provide id_token
        tokenSet = await (client as any).oauthCallback(config.redirectUri, params as any, { code_verifier: record.codeVerifier, state: record.state } as any);
      } catch (tokenError) {
        const errorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError);
        const errorType = tokenError?.constructor?.name || 'Unknown';
        const tokenEndpoint = (client.issuer.metadata as any).token_endpoint || 'unknown';

        logger.error(`Token exchange failed: ${errorType} - ${errorMsg}`);
        logger.error(`Token endpoint: ${tokenEndpoint}`);
        logger.error(`Redirect URI: ${config.redirectUri}`);
        logger.error(`State: ${state.substring(0, 8)}... Code: ${code.substring(0, 8)}...`);

        if (tokenError instanceof Error && tokenError.stack) {
          logger.error(`Stack trace: ${tokenError.stack}`);
        }

        // Log the full error object as JSON for debugging
        try {
          logger.error(`Full error object: ${JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError), 2)}`);
        } catch (e) {
          logger.error(`Could not stringify error object: ${e}`);
        }

        throw tokenError;
      }

      logger.info('Token exchange successful', {
        hasAccessToken: !!tokenSet.access_token,
        hasIdToken: !!tokenSet.id_token,
        hasRefreshToken: !!tokenSet.refresh_token,
        expiresIn: tokenSet.expires_in
      });

      let accountId: string | undefined;
      try {
        const claims = tokenSet.claims();
        accountId = (claims && (claims.sub || claims.email)) as string | undefined;
        logger.info('Claims extracted', { accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none' });
      } catch (e) {
        logger.warn('Failed to extract claims from tokens', { error: (e as Error).message });
      }

      if (!accountId && (client.issuer.metadata as any).userinfo_endpoint) {
        try {
          const info: any = await client.userinfo(tokenSet);
          accountId = info.sub || info.email;
          logger.info('Account ID from userinfo', { accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none' });
        } catch (e) {
          logger.warn('userinfo lookup failed', { error: (e as Error).message });
        }
      }

      if (!accountId) {
        // Fallback: derive a stable-ish id from access_token (not ideal; replace with Mittwald user id once available)
        const at = tokenSet.access_token || nanoid(16);
        accountId = `mittwald:${at.substring(0, 16)}`;
        logger.info('Using fallback account ID', { accountId: `${accountId.substring(0, 8)}...` });
      }

      logger.info('STANDARD OAUTH: Starting oidc-provider interaction completion', {
        accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
        interactionUid: record.uid,
        clientId: record.clientId,
        hasAccessToken: !!tokenSet.access_token,
        hasRefreshToken: !!tokenSet.refresh_token
      });

      // Store Mittwald tokens for this user (used by findAccount function)
      mittwaldTokenStore.store(accountId, {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        accountId,
        email: undefined, // TODO: Extract from Mittwald tokens if available
        name: undefined,  // TODO: Extract from Mittwald tokens if available
        issuedAt: Date.now(),
        expiresAt: tokenSet.expires_in ? Date.now() + (tokenSet.expires_in * 1000) : undefined
      });

      // STANDARD OAUTH 2.1: Use oidc-provider's interaction completion
      // This replaces our custom authorization code generation and manual redirects
      logger.info('STANDARD OAUTH: Calling provider.interactionFinished()', {
        accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
        interactionUid: record.uid,
        method: 'provider.interactionFinished'
      });

      try {
        // Get the current oidc-provider interaction details to get the correct UID
        const details = await (provider as any).interactionDetails(ctx.req, ctx.res);
        const oidcInteractionUid = details.uid;

        logger.info('STANDARD OAUTH: Retrieved oidc-provider interaction UID', {
          accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
          customStoredUid: record.uid,
          oidcProviderUid: oidcInteractionUid,
          confirmUrl: `/interaction/${oidcInteractionUid}/confirm`
        });

        // Use the stored oidc-provider interaction UID
        const correctUid = record.oidcInteractionUid;

        logger.info('STANDARD OAUTH: Using stored oidc-provider interaction UID', {
          accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
          storedOidcUid: correctUid,
          confirmUrl: `/interaction/${correctUid}/confirm`
        });

        // Redirect back to interaction route to show consent screen
        // User will see what permissions they're granting and can approve/deny
        ctx.redirect(`/interaction/${correctUid}`);
        return;

      } catch (detailsError) {
        logger.error('STANDARD OAUTH: Failed to get oidc-provider interaction details', {
          accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
          error: detailsError instanceof Error ? detailsError.message : String(detailsError),
          fallbackUid: record.uid
        });

        // Fallback: redirect to interaction route to show consent screen
        ctx.redirect(`/interaction/${record.oidcInteractionUid || record.uid}`);
        return;
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Mittwald callback error', {
        error: errorMsg,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: ctx.state?.requestId
      });

      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Internal server error' };
    }
  }

  router.get('/mittwald/callback', handleMittwaldCallback);
  router.get('/oauth/callback', handleMittwaldCallback);
  router.get('/auth/callback', handleMittwaldCallback);

  // Confirm consent (accept all requested by default)
  const confirmHandler = async (ctx: any) => {
    const { uid } = ctx.params as any;

    logger.info('INTERACTION CONFIRM: Processing consent confirmation', {
      uid,
      method: ctx.method,
      hasUid: !!uid
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

    logger.info('INTERACTION CONFIRM: Calling interactionFinished with consent', {
      uid,
      method: 'standard-oidc-provider',
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

    logger.info('INTERACTION CONFIRM: interactionFinished completed successfully', {
      uid
    });
  };

  // Standard OAuth consent confirmation (POST only - user must explicitly consent)
  router.post('/interaction/:uid/confirm', confirmHandler);

  // Abort interaction
  router.post('/interaction/:uid/abort', async (ctx) => {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction',
    };
    await (provider as any).interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
    ctx.respond = false;
  });
}

/**
 * Check if user has already been authenticated via Mittwald
 * by looking for stored tokens
 */
async function checkIfUserAuthenticated(details: any): Promise<string | null> {
  // For now, simple check - in a real implementation, check session/cookies
  // This could check for stored Mittwald tokens or existing user sessions
  return null; // Always require fresh Mittwald authentication for security
}

/**
 * Show OAuth consent screen to user
 * This renders a proper consent form where users can see and approve requested scopes
 */
async function showConsentScreen(ctx: any, details: any, accountId: string): Promise<void> {
  const { clientId } = details.params;
  const requestedScopes = details.params?.scope?.split(' ') || [];

  logger.info('CONSENT SCREEN: Rendering consent form', {
    accountId: accountId.substring(0, 8) + '...',
    clientId,
    requestedScopes,
    uid: details.uid
  });

  // Render consent screen HTML (in production, use proper templating)
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
