import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createApp } from '../src/app.js';
import { loadConfigFromEnv } from '../src/config.js';
import { MemoryStateStore } from '../src/state/memory-state-store.js';

const BASE_URL = 'https://bridge.example.com';

function setupEnv() {
  process.env.BRIDGE_ISSUER = 'https://bridge.example.com';
  process.env.BRIDGE_BASE_URL = BASE_URL;
  process.env.BRIDGE_JWT_SECRET = 'super-secret';
  process.env.MITTWALD_AUTHORIZATION_URL = 'https://mittwald.example.com/oauth/authorize';
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'mittwald-client';
  process.env.MITTWALD_CLIENT_SECRET = 'mittwald-secret';
  process.env.BRIDGE_REDIRECT_URIS = 'https://chatgpt.com/connector_platform_oauth_redirect';
  process.env.BRIDGE_ACCESS_TOKEN_TTL_SECONDS = '3600';
  process.env.BRIDGE_REFRESH_TOKEN_TTL_SECONDS = '86400';
}

describe('OAuth bridge flow', () => {
  beforeEach(() => {
    setupEnv();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('completes authorization code flow', async () => {
    const config = loadConfigFromEnv();
    const stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    const app = createApp(config, stateStore);

    const codeVerifier = 'verifier-123';
    const codeChallenge = pkceChallenge(codeVerifier);

    const authorizeResponse = await request(app.callback())
      .get('/authorize')
      .query({
        response_type: 'code',
        client_id: 'chatgpt-client',
        redirect_uri: 'https://chatgpt.com/connector_platform_oauth_redirect',
        scope: 'openid profile',
        state: 'external-state',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      .expect(303);

    const mittwaldLocation = new URL(authorizeResponse.headers.location);
    expect(mittwaldLocation.origin + mittwaldLocation.pathname).toEqual('https://mittwald.example.com/oauth/authorize');
    const internalState = mittwaldLocation.searchParams.get('state');
    expect(internalState).toBeTruthy();

    const callbackResponse = await request(app.callback())
      .get('/mittwald/callback')
      .query({
        state: internalState!,
        code: 'mittwald-auth-code'
      })
      .expect(303);

    const redirectToClient = new URL(callbackResponse.headers.location);
    expect(redirectToClient.origin + redirectToClient.pathname).toEqual('https://chatgpt.com/connector_platform_oauth_redirect');
    expect(redirectToClient.searchParams.get('state')).toEqual('external-state');
    const bridgeAuthCode = redirectToClient.searchParams.get('code');
    expect(bridgeAuthCode).toBeTruthy();

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(
      JSON.stringify({
        access_token: 'mittwald-access',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mittwald-refresh',
        scope: 'openid profile'
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    ));

    const tokenResponse = await request(app.callback())
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code: bridgeAuthCode!,
        redirect_uri: 'https://chatgpt.com/connector_platform_oauth_redirect',
        client_id: 'chatgpt-client',
        code_verifier: codeVerifier
      })
      .expect(200);

    expect(tokenResponse.body).toMatchObject({
      token_type: 'Bearer',
      scope: 'openid profile'
    });
    expect(typeof tokenResponse.body.access_token).toBe('string');
    expect(typeof tokenResponse.body.refresh_token).toBe('string');
  });
});

function pkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest().toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
