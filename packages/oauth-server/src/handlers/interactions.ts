import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { createInteractionStore } from '../services/interaction-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';
import { getDefaultScopeString } from '../config/oauth-scopes.js';

const INTERACTION_TTL = parseInt(process.env.INTERACTION_TTL_SECONDS || '900'); // 15min

export function registerInteractionRoutes(router: Router, provider: Provider, redisClient?: any) {
  const store = createInteractionStore(redisClient);

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
        authorizationUrl: (authorizationUrl || '').toString().split('?')[0],
        redirectUri: config.redirectUri,
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

      const record = await store.consumeByState(state);
      if (!record) {
        logger.error('Interaction record not found or expired', {
          state: `${state.substring(0, 8)}...`,
          existingRecord: !!existingRecord,
          message: existingRecord ? 'Record existed but could not be consumed' : 'No record found for state'
        });
        ctx.status = 400;
        ctx.body = { error: 'invalid_request', error_description: 'interaction expired or already used' };
        return;
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

      try {
        // Create a new interaction session context for oidc-provider
        // This reconstructs the session context that was lost during the external redirect
        const interactionSession = {
          uid: record.uid,
          session: {
            accountId,
            loginTs: Math.floor(Date.now() / 1000)
          }
        };

        // Set all necessary cookies for oidc-provider
        ctx.cookies.set('_interaction', record.uid, {
          signed: true,
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 10 * 60 * 1000
        });

        ctx.cookies.set('_session', record.uid, {
          signed: true,
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 14 * 24 * 60 * 60 * 1000
        });

        // Finish OIDC interaction (login)
        await (provider as any).interactionFinished(ctx.req, ctx.res, { login: { accountId } }, { mergeWithLastSubmission: false });
        // oidc-provider will handle the response
        ctx.respond = false;

        logger.info('OIDC interaction completed successfully', {
          accountId: accountId ? `${accountId.substring(0, 8)}...` : 'none',
          interactionUid: record.uid
        });
      } catch (interactionError) {
        const errorMsg = interactionError instanceof Error ? interactionError.message : String(interactionError);
        const errorType = interactionError?.constructor?.name || 'Unknown';

        logger.error(`OIDC interaction completion failed: ${errorType} - ${errorMsg}`);
        logger.error(`Account ID: ${accountId ? `${accountId.substring(0, 8)}...` : 'none'}`);
        logger.error(`Interaction UID: ${record.uid}`);

        if (interactionError instanceof Error && interactionError.stack) {
          logger.error(`OIDC completion stack trace: ${interactionError.stack}`);
        }

        // Log the full error object for debugging
        try {
          logger.error(`OIDC completion full error: ${JSON.stringify(interactionError, Object.getOwnPropertyNames(interactionError), 2)}`);
        } catch (e) {
          logger.error(`Could not stringify OIDC error: ${e}`);
        }

        throw interactionError;
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
