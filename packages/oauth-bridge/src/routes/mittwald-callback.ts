import Router from '@koa/router';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';

interface MittwaldCallbackDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

export function createMittwaldCallbackRouter({ config, stateStore }: MittwaldCallbackDeps) {
  const router = new Router();

  router.get('/mittwald/callback', async (ctx) => {
    const { state, code, error, error_description: errorDescription } = ctx.query as Record<string, string | undefined>;

    if (error) {
      ctx.logger.warn({ error, errorDescription }, 'Mittwald callback returned an error');
      ctx.status = 400;
      ctx.body = { error, error_description: errorDescription ?? 'Mittwald authorization failed' };
      return;
    }

    if (!state || !code) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'state and code are required' };
      return;
    }

    const storedRequest = await stateStore.getAuthorizationRequestByInternalState(state);

    if (!storedRequest) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'Unknown or expired authorization request' };
      return;
    }

    await stateStore.deleteAuthorizationRequestByInternalState(state);

    const authorizationCode = randomUUID();

    await stateStore.storeAuthorizationGrant({
      authorizationCode,
      clientId: storedRequest.clientId,
      redirectUri: storedRequest.redirectUri,
      codeChallenge: storedRequest.codeChallenge,
      codeChallengeMethod: storedRequest.codeChallengeMethod,
      scope: storedRequest.scope,
      resource: storedRequest.resource,
      mittwaldAuthorizationCode: code,
      createdAt: 0,
      expiresAt: 0,
      used: false
    });

    const redirect = new URL(storedRequest.redirectUri);
    redirect.searchParams.set('code', authorizationCode);
    redirect.searchParams.set('state', storedRequest.state);

    ctx.status = 303;
    ctx.redirect(redirect.toString());
  });

  return router;
}
