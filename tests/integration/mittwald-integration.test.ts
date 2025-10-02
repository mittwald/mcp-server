import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';
import { createApp } from '../../packages/oauth-bridge/src/app.js';
import type { BridgeConfig } from '../../packages/oauth-bridge/src/config.js';
import { MemoryStateStore } from '../../packages/oauth-bridge/src/state/memory-state-store.js';
import type { MittwaldTokenResponse } from '../../packages/oauth-bridge/src/state/state-store.js';
import { createMittwaldStub, MittwaldStub } from '../utils/mittwald-stub.js';

const CLIENT_REDIRECT_URI = 'https://client.example/callback';
const DEFAULT_SCOPE = 'openid offline_access';

type KoaCallbackFn = ReturnType<ReturnType<typeof createApp>['callback']>;

interface AuthorizationContext {
  bridgeAuthorizationCode: string;
  codeVerifier: string;
  clientState: string;
  mittwaldAuthorizationCode: string;
}

describe('Mittwald OAuth bridge integration', () => {
  let config: BridgeConfig;
  let stateStore: MemoryStateStore;
  let mittwaldStub: MittwaldStub;
  let server: KoaCallbackFn;

  beforeEach(() => {
    config = createTestBridgeConfig();
    stateStore = new MemoryStateStore({ ttlMs: 60_000 });
    const app = createApp(config, stateStore);
    server = app.callback();
    mittwaldStub = createMittwaldStub({ tokenUrl: config.mittwald.tokenUrl });
  });

  afterEach(() => {
    mittwaldStub.restore();
  });

  test('performs PKCE authorization and token exchange', async () => {
    const registration = await registerConfidentialClient();
    mittwaldStub.enqueueTokenSuccess(simulateMittwaldSuccess());

    const flow = await completeAuthorizationFlow(registration.client_id, {
      requestedScope: DEFAULT_SCOPE
    });

    const tokenResponse = await request(server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code: flow.bridgeAuthorizationCode,
        redirect_uri: CLIENT_REDIRECT_URI,
        client_id: registration.client_id,
        client_secret: registration.client_secret,
        code_verifier: flow.codeVerifier
      });

    expect(tokenResponse.status).toBe(200);
    expect(tokenResponse.body).toMatchObject({
      token_type: 'Bearer',
      scope: DEFAULT_SCOPE
    });
    expect(typeof tokenResponse.body.access_token).toBe('string');
    expect(typeof tokenResponse.body.refresh_token).toBe('string');

    const mittwaldRequest = mittwaldStub.getLastTokenRequest();
    expect(mittwaldRequest?.body.code).toBe(flow.mittwaldAuthorizationCode);
    expect(mittwaldRequest?.body.code_verifier).toBe(flow.codeVerifier);

    const jwtPayload = decodeJwtPayload(tokenResponse.body.access_token);
    expect(jwtPayload.scope).toBe(DEFAULT_SCOPE);
    expect(jwtPayload.mittwald?.access_token).toBe('mittwald-access-token');

    const persistedGrant = await stateStore.getAuthorizationGrant(flow.bridgeAuthorizationCode);
    expect(persistedGrant?.used).toBe(true);
    expect(persistedGrant?.mittwaldTokens?.access_token).toBe('mittwald-access-token');
  });

  test('surfaces Mittwald upstream outages as temporarily_unavailable', async () => {
    const registration = await registerConfidentialClient();
    const flow = await completeAuthorizationFlow(registration.client_id, {});

    mittwaldStub.enqueueTokenError(502, {
      error: 'bad_gateway',
      error_description: 'Mittwald unavailable'
    });

    const response = await request(server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code: flow.bridgeAuthorizationCode,
        redirect_uri: CLIENT_REDIRECT_URI,
        client_id: registration.client_id,
        client_secret: registration.client_secret,
        code_verifier: flow.codeVerifier
      });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      error: 'temporarily_unavailable'
    });
  });

  test('rejects authorization requests with unregistered redirect URIs', async () => {
    const registration = await registerConfidentialClient();
    expect(registration.client_id).toBeDefined();

    const { codeVerifier, codeChallenge } = createPkcePair();
    const response = await request(server)
      .get('/authorize')
      .query({
        response_type: 'code',
        client_id: registration.client_id,
        redirect_uri: 'https://rogue.example/callback',
        state: 'invalid-state',
        scope: DEFAULT_SCOPE,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      .redirects(0);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invalid_request');
    expect(response.body.error_description).toContain('redirect_uri');
    expect(codeVerifier).toBeDefined();
  });

  test('enforces confidential client authentication on token endpoint', async () => {
    const registration = await registerConfidentialClient();
    const flow = await completeAuthorizationFlow(registration.client_id, {});

    const response = await request(server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code: flow.bridgeAuthorizationCode,
        redirect_uri: CLIENT_REDIRECT_URI,
        client_id: registration.client_id,
        client_secret: 'wrong-secret',
        code_verifier: flow.codeVerifier
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('invalid_client');
    expect(mittwaldStub.getAllTokenRequests()).toHaveLength(0);
  });

  async function registerConfidentialClient() {
    const response = await request(server)
      .post('/register')
      .send({
        client_name: 'Integration Client',
        redirect_uris: [CLIENT_REDIRECT_URI],
        token_endpoint_auth_method: 'client_secret_post',
        scope: DEFAULT_SCOPE
      });

    expect(response.status).toBe(201);
    expect(typeof response.body.client_id).toBe('string');
    expect(typeof response.body.client_secret).toBe('string');
    return response.body as { client_id: string; client_secret: string };
  }

  async function completeAuthorizationFlow(clientId: string, options: { requestedScope?: string }): Promise<AuthorizationContext> {
    const clientState = `state-${randomBytes(4).toString('hex')}`;
    const { codeVerifier, codeChallenge } = createPkcePair();
    const requestedScope = options.requestedScope ?? DEFAULT_SCOPE;

    const authorizeResponse = await request(server)
      .get('/authorize')
      .query({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: CLIENT_REDIRECT_URI,
        scope: requestedScope,
        state: clientState,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      .redirects(0);

    expect(authorizeResponse.status).toBe(303);
    const mittwaldRedirect = new URL(authorizeResponse.headers.location);
    const internalState = mittwaldRedirect.searchParams.get('state');
    expect(internalState).toBeDefined();

    const mittwaldAuthorizationCode = `mittwald-${randomBytes(4).toString('hex')}`;

    const callbackResponse = await request(server)
      .get('/mittwald/callback')
      .query({ state: internalState, code: mittwaldAuthorizationCode })
      .redirects(0);

    expect(callbackResponse.status).toBe(303);
    const clientRedirect = new URL(callbackResponse.headers.location);
    const bridgeAuthorizationCode = clientRedirect.searchParams.get('code');
    const returnedState = clientRedirect.searchParams.get('state');

    expect(bridgeAuthorizationCode).toBeDefined();
    expect(returnedState).toBe(clientState);

    return {
      bridgeAuthorizationCode: bridgeAuthorizationCode!,
      codeVerifier,
      clientState,
      mittwaldAuthorizationCode
    };
  }
});

function createTestBridgeConfig(): BridgeConfig {
  return {
    port: 3000,
    mittwald: {
      authorizationUrl: 'https://mittwald.example/oauth/authorize',
      tokenUrl: 'https://mittwald.example/oauth/token',
      clientId: 'mittwald-client'
    },
    bridge: {
      issuer: 'https://bridge.test',
      baseUrl: 'https://bridge.test',
      jwtSecret: 'super-secret-signing-key',
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 86_400
    },
    redirectUris: [CLIENT_REDIRECT_URI]
  };
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { codeVerifier: verifier, codeChallenge: challenge };
}

function decodeJwtPayload(jwt: string): Record<string, any> {
  const [, payload] = jwt.split('.');
  const json = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(json);
}

function simulateMittwaldSuccess(): Partial<MittwaldTokenResponse> {
  return {
    access_token: 'mittwald-access-token',
    refresh_token: 'mittwald-refresh-token',
    token_type: 'Bearer',
    expires_in: 1800,
    scope: 'openid offline_access project:read'
  };
}
