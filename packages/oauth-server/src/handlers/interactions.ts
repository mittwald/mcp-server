import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { createInteractionStore } from '../services/interaction-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
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

      const interactionRecord = { uid: details.uid, state, nonce, codeVerifier, createdAt: Date.now() };

      logger.info('Storing interaction record', {
        uid: details.uid,
        state: `${state.substring(0, 8)}...`,
        nonce: `${nonce.substring(0, 8)}...`,
        hasCodeVerifier: !!codeVerifier,
        ttlSeconds: INTERACTION_TTL,
        createdAt: interactionRecord.createdAt
      });

      await store.save(interactionRecord, INTERACTION_TTL);

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
        recordExists: !!existingRecord,
        recordUid: existingRecord?.uid,
        recordCreatedAt: existingRecord?.createdAt,
        ageMinutes: existingRecord ? (Date.now() - existingRecord.createdAt) / (1000 * 60) : undefined
      });

      if (!existingRecord) {
        logger.warn('Interaction state already consumed or missing', {
          state: `${state.substring(0, 8)}...`,
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

      // Retrieve the original interaction details to get client redirect URI
      let interactionDetails: any;
      try {
        interactionDetails = await (provider as any).interactionDetails(ctx.req, ctx.res, record.uid);
      } catch (detailsError) {
        logger.error('Failed to retrieve interaction details for callback', {
          interactionUid: record.uid,
          error: detailsError instanceof Error ? detailsError.message : String(detailsError)
        });
        // Fallback: continue without interaction details (for backward compatibility)
        interactionDetails = null;
      }

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

      logger.info('Finishing OIDC interaction', {
        accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
        interactionUid: record.uid
      });

      // Generate a temporary authorization code for the client
      const authCode = nanoid(32);

      // Store the authorization code mapping temporarily (in production, use proper storage)
      const _authCodeData = {
        code: authCode,
        accountId,
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        clientRedirectUri: interactionDetails?.params?.redirect_uri || config.redirectUri,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };

      // In a proper implementation, store this in Redis/database
      // For now, we'll just redirect with the tokens embedded

      logger.info('Generating authorization code for client', {
        authCode: `${authCode.substring(0, 8)}...`,
        clientRedirectUri: config.redirectUri,
        hasAccessToken: !!tokenSet.access_token
      });

      // Determine client redirect URI (prefer from interaction details, fallback to config)
      const clientRedirectUri = interactionDetails?.params?.redirect_uri || config.redirectUri;

      // Validate client redirect URI from original OAuth request
      if (!clientRedirectUri) {
        logger.error('Missing client redirect_uri in OAuth request', {
          interactionUid: record.uid,
          hasInteractionDetails: !!interactionDetails,
          clientId: interactionDetails?.params?.client_id
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Missing redirect_uri parameter'
        };
        return;
      }

      // Validate redirect URI format
      let clientRedirectUrl: URL;
      try {
        clientRedirectUrl = new URL(clientRedirectUri);
        if (clientRedirectUrl.protocol !== 'https:' && clientRedirectUrl.hostname !== 'localhost') {
          throw new Error('Invalid redirect URI: HTTPS required for non-localhost');
        }
      } catch (redirectError) {
        logger.error('Invalid client redirect URI', {
          interactionUid: record.uid,
          redirectUri: clientRedirectUri,
          error: redirectError instanceof Error ? redirectError.message : String(redirectError)
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Invalid redirect_uri format'
        };
        return;
      }

      // Redirect to client with authorization code
      const clientCallbackUrl = new URL(clientRedirectUri);
      clientCallbackUrl.searchParams.set('code', authCode);
      clientCallbackUrl.searchParams.set('state', state);

      logger.info('OAuth redirect decision', {
        mittwaldRedirectUri: config.redirectUri,
        clientRedirectUri: clientRedirectUri,
        usingClientUri: clientRedirectUri !== config.redirectUri,
        authCode: `${authCode.substring(0, 8)}...`,
        interactionUid: record.uid,
        hasInteractionDetails: !!interactionDetails
      });

      logger.info('Redirecting to client with authorization code', {
        redirectUrl: clientCallbackUrl.toString()
      });

      ctx.redirect(clientCallbackUrl.toString());

      logger.info('OAuth flow completed successfully', {
        accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
        authCode: `${authCode.substring(0, 8)}...`,
        clientRedirectUri: clientRedirectUri
      });

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
  router.post('/interaction/:uid/confirm', async (ctx) => {
    const { uid } = ctx.params as any;
    const details = await (provider as any).interactionDetails(ctx.req, ctx.res);
    if (details.uid !== uid) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'uid mismatch' };
      return;
    }
    await (provider as any).interactionFinished(ctx.req, ctx.res, { consent: {} }, { mergeWithLastSubmission: true });
    ctx.respond = false;
  });

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
