import type Provider from 'oidc-provider';
import Router from '@koa/router';
import { createInteractionStore } from '../services/interaction-store.js';
import { getMittwaldClient, createPkce } from '../services/mittwald-oauth-client.js';
import { nanoid } from 'nanoid';
import { logger } from '../services/logger.js';

const INTERACTION_TTL = parseInt(process.env.INTERACTION_TTL_SECONDS || '900'); // 15min

export function registerInteractionRoutes(router: Router, provider: Provider, redisClient?: any) {
  const store = createInteractionStore(redisClient);

  // Start interaction: redirect to Mittwald authorize
  router.get('/interaction/:uid', async (ctx) => {
    const details = await (provider as any).interactionDetails(ctx.req, ctx.res);
    const { clientId } = details.params;
    logger.info('Interaction details', { uid: details.uid, prompt: details.prompt?.name, clientId });

    const { client, config } = await getMittwaldClient();

    const state = nanoid(24);
    const nonce = nanoid(24);
    const { codeVerifier, codeChallenge } = createPkce();

    await store.save({ uid: details.uid, state, nonce, codeVerifier, createdAt: Date.now() }, INTERACTION_TTL);

    const authorizationUrl = client.authorizationUrl({
      scope: config.scope || 'openid profile email',
      redirect_uri: config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    } as any);

    ctx.redirect(authorizationUrl);
  });

  // Mittwald callback: exchange code and finish login
  router.get('/mittwald/callback', async (ctx) => {
    const { client, config } = await getMittwaldClient();
    const params = client.callbackParams(ctx.req);
    const { state, code } = params as any;
    if (!state || !code) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'missing state or code' };
      return;
    }

    const record = await store.consumeByState(state);
    if (!record) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'interaction expired or already used' };
      return;
    }

    const tokenSet = await client.callback(config.redirectUri, params as any, { code_verifier: record.codeVerifier, state: record.state, nonce: record.nonce } as any);
    let accountId: string | undefined;
    try {
      const claims = tokenSet.claims();
      accountId = (claims && (claims.sub || claims.email)) as string | undefined;
    } catch {}
    if (!accountId && (client.issuer.metadata as any).userinfo_endpoint) {
      try {
        const info: any = await client.userinfo(tokenSet);
        accountId = info.sub || info.email;
      } catch (e) {
        logger.warn('userinfo lookup failed', { error: (e as Error).message });
      }
    }
    if (!accountId) {
      // Fallback: derive a stable-ish id from access_token (not ideal; replace with Mittwald user id once available)
      const at = tokenSet.access_token || nanoid(16);
      accountId = `mittwald:${at.substring(0, 16)}`;
    }

    // Finish OIDC interaction (login)
    await (provider as any).interactionFinished(ctx.req, ctx.res, { login: { accountId } }, { mergeWithLastSubmission: true });
    // oidc-provider will handle the response
    ctx.respond = false;
  });

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
