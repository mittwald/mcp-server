import Router from '@koa/router';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';

interface MittwaldCallbackDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

export function createMittwaldCallbackRouter({ config: _config, stateStore }: MittwaldCallbackDeps) {
  const router = new Router();

  router.get('/mittwald/callback', async (ctx) => {
    const { state, code, error, error_description: errorDescription } = ctx.query as Record<string, string | undefined>;

    ctx.logger.debug({
      hasState: !!state,
      hasCode: !!code,
      hasError: !!error,
      internalState: state ? `${state.substring(0, 8)}...` : undefined
    }, 'Incoming Mittwald callback');

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

    let storedRequest;
    try {
      storedRequest = await stateStore.getAuthorizationRequestByInternalState(state);

      if (storedRequest) {
        ctx.logger.debug({
          internalState: `${state.substring(0, 8)}...`,
          clientId: storedRequest.clientId,
          redirectUri: storedRequest.redirectUri,
          clientState: storedRequest.state ? `${storedRequest.state.substring(0, 8)}...` : undefined
        }, 'Authorization request found in state store');
      } else {
        ctx.logger.warn({
          internalState: `${state.substring(0, 8)}...`
        }, 'Authorization request not found or expired in state store');
      }
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), state }, 'Failed to read authorization request');
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to read authorization request' };
      return;
    }

    if (!storedRequest) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'Unknown or expired authorization request' };
      return;
    }

    try {
      await stateStore.deleteAuthorizationRequestByInternalState(state);
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), state }, 'Failed to delete authorization request');
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to delete authorization request' };
      return;
    }

    const authorizationCode = randomUUID();

    try {
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
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), state }, 'Failed to persist authorization grant');
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to persist authorization grant' };
      return;
    }

    const redirect = new URL(storedRequest.redirectUri);
    redirect.searchParams.set('code', authorizationCode);
    redirect.searchParams.set('state', storedRequest.state);

    ctx.logger.debug({
      clientId: storedRequest.clientId,
      redirectUri: storedRequest.redirectUri,
      redirectUrl: redirect.toString(),
      authCodeIssued: `${authorizationCode.substring(0, 8)}...`
    }, 'Redirecting back to client with authorization code');

    ctx.logger.info({ clientId: storedRequest.clientId, redirectUri: storedRequest.redirectUri }, 'Authorization code issued to client');

    ctx.status = 303;
    ctx.redirect(redirect.toString());
  });

  return router;
}
