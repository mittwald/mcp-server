/**
 * Renewing a bridge token does not require renewing Mittwald's.
 *
 * Mittwald access tokens are long lived (a week in production) while the bridge token wrapping one
 * expires in an hour. The bridge used to call Mittwald's token endpoint on every client refresh and
 * treat failure as fatal, so a client whose Mittwald token had days left was still pushed back
 * through a browser sign-in whenever ours lapsed.
 */

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { decodeJwt } from 'jose';
import { createApp } from '../src/app.js';
import { loadConfigFromEnv } from '../src/config.js';
import { MemoryStateStore } from '../src/state/memory-state-store.js';
import { createMockTokenStore, type MockRegistrationTokenStore } from './helpers/mock-token-store.js';

const BASE_URL = 'https://bridge.example.com';
const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';
const CODE_VERIFIER = 'verifier-123-must-be-at-least-43-characters-long';

/** Mittwald's production access token lifetime. */
const MITTWALD_TOKEN_LIFETIME = 604800;

function pkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url');
}

function setupEnv() {
  process.env.BRIDGE_ISSUER = BASE_URL;
  process.env.BRIDGE_BASE_URL = BASE_URL;
  process.env.BRIDGE_JWT_SECRET = 'super-secret-value-long-enough-for-hs256';
  process.env.MITTWALD_AUTHORIZATION_URL = 'https://mittwald.example.com/oauth/authorize';
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'mittwald-client';
  process.env.BRIDGE_REDIRECT_URIS = REDIRECT_URI;
  process.env.BRIDGE_ACCESS_TOKEN_TTL_SECONDS = '3600';
  process.env.BRIDGE_REFRESH_TOKEN_TTL_SECONDS = '604800';
}

async function seedClient(stateStore: MemoryStateStore, tokenStore: MockRegistrationTokenStore) {
  await stateStore.storeClientRegistration({
    clientId: 'claude-client',
    tokenEndpointAuthMethod: 'none',
    redirectUris: [REDIRECT_URI],
    registrationAccessToken: '[HASHED]',
    registrationClientUri: `${BASE_URL}/register/claude-client`,
    clientIdIssuedAt: Math.floor(Date.now() / 1000),
    clientName: 'Claude'
  });
  await tokenStore.createToken('claude-client');
}

/** Runs authorize → callback → token and returns the bridge refresh token. */
async function completeAuthorizationCodeFlow(app: ReturnType<typeof createApp>) {
  const authorizeResponse = await request(app.callback())
    .get('/authorize')
    .query({
      response_type: 'code',
      client_id: 'claude-client',
      redirect_uri: REDIRECT_URI,
      scope: 'user:read',
      state: 'external-state',
      code_challenge: pkceChallenge(CODE_VERIFIER),
      code_challenge_method: 'S256'
    })
    .expect(303);

  const internalState = new URL(authorizeResponse.headers.location).searchParams.get('state');

  const callbackResponse = await request(app.callback())
    .get('/mittwald/callback')
    .query({ state: internalState!, code: 'mittwald-auth-code' })
    .expect(303);

  const bridgeAuthCode = new URL(callbackResponse.headers.location).searchParams.get('code');

  // The one upstream call the flow legitimately makes: exchanging the authorization code.
  const exchange = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        access_token: 'mittwald-access',
        token_type: 'Bearer',
        expires_in: MITTWALD_TOKEN_LIFETIME,
        refresh_token: 'mittwald-refresh',
        scope: 'user:read'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  );

  const tokenResponse = await request(app.callback())
    .post('/token')
    .type('form')
    .send({
      grant_type: 'authorization_code',
      code: bridgeAuthCode!,
      redirect_uri: REDIRECT_URI,
      client_id: 'claude-client',
      code_verifier: CODE_VERIFIER
    })
    .expect(200);

  exchange.mockRestore();

  return {
    refreshToken: tokenResponse.body.refresh_token as string,
    accessToken: tokenResponse.body.access_token as string
  };
}

describe('bridge token renewal', () => {
  beforeEach(setupEnv);
  afterEach(() => vi.restoreAllMocks());

  test('re-wraps the stored Mittwald token without calling Mittwald', async () => {
    const stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    const tokenStore = createMockTokenStore();
    const app = createApp(loadConfigFromEnv(), stateStore, tokenStore);
    await seedClient(stateStore, tokenStore);

    const { refreshToken, accessToken } = await completeAuthorizationCodeFlow(app);

    // Any upstream call during the refresh is a failure — Mittwald's token is still valid.
    const upstream = vi.spyOn(global, 'fetch');

    const refreshed = await request(app.callback())
      .post('/token')
      .type('form')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'claude-client'
      })
      .expect(200);

    expect(upstream).not.toHaveBeenCalled();
    expect(refreshed.body.token_type).toBe('Bearer');

    // The renewed token carries the same Mittwald credentials, which is the whole point: the
    // client gets a fresh wrapper around a token that never needed renewing.
    const renewed = decodeJwt(refreshed.body.access_token) as { mittwald?: { access_token?: string } };
    const original = decodeJwt(accessToken) as { mittwald?: { access_token?: string } };

    expect(renewed.mittwald?.access_token).toBe('mittwald-access');
    expect(renewed.mittwald?.access_token).toBe(original.mittwald?.access_token);
  });

  test('keeps renewing across repeated refreshes', async () => {
    const stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    const tokenStore = createMockTokenStore();
    const app = createApp(loadConfigFromEnv(), stateStore, tokenStore);
    await seedClient(stateStore, tokenStore);

    let { refreshToken } = await completeAuthorizationCodeFlow(app);
    const upstream = vi.spyOn(global, 'fetch');

    // The refresh token rotates, so each round has to use the one just issued.
    for (let round = 0; round < 3; round++) {
      const response = await request(app.callback())
        .post('/token')
        .type('form')
        .send({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'claude-client'
        })
        .expect(200);

      refreshToken = response.body.refresh_token;
    }

    expect(upstream).not.toHaveBeenCalled();
  });

  test('advertises a lifetime that shrinks with the Mittwald token behind it', async () => {
    const stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    const tokenStore = createMockTokenStore();
    const app = createApp(loadConfigFromEnv(), stateStore, tokenStore);
    await seedClient(stateStore, tokenStore);

    const { refreshToken } = await completeAuthorizationCodeFlow(app);

    // Mittwald's token now has 10 minutes left. The bridge must not promise its configured hour.
    const grant = await stateStore.getAuthorizationGrantByRefreshToken(refreshToken);
    await stateStore.updateAuthorizationGrant({
      ...grant!,
      mittwaldAccessTokenExpiresAt: Math.floor(Date.now() / 1000) + 600
    });

    const refreshed = await request(app.callback())
      .post('/token')
      .type('form')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'claude-client'
      })
      .expect(200);

    expect(refreshed.body.expires_in).toBeLessThan(600);
    expect(refreshed.body.expires_in).toBeGreaterThan(0);
  });

  test('falls back to Mittwald once the stored token has lapsed', async () => {
    const stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    const tokenStore = createMockTokenStore();
    const app = createApp(loadConfigFromEnv(), stateStore, tokenStore);
    await seedClient(stateStore, tokenStore);

    const { refreshToken } = await completeAuthorizationCodeFlow(app);

    const grant = await stateStore.getAuthorizationGrantByRefreshToken(refreshToken);
    await stateStore.updateAuthorizationGrant({
      ...grant!,
      mittwaldAccessTokenExpiresAt: Math.floor(Date.now() / 1000) - 10
    });

    // Mittwald has no refresh_token grant, so this is what production actually returns.
    const upstream = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    );

    const response = await request(app.callback())
      .post('/token')
      .type('form')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'claude-client'
      })
      .expect(400);

    expect(upstream).toHaveBeenCalledTimes(1);
    expect(response.body.error).toBe('invalid_grant');
  });
});
