/**
 * Security Validation E2E Tests
 *
 * End-to-end tests for security hardening features per FR-015 through FR-018.
 * Tests run against the oauth-bridge package to validate:
 * - PKCE enforcement and validation
 * - Authorization code replay prevention
 * - Token validation edge cases
 *
 * These tests complement the unit tests by validating full request flows.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';
import { createApp } from '../../packages/oauth-bridge/src/app.js';
import { loadConfigFromEnv } from '../../packages/oauth-bridge/src/config.js';
import { MemoryStateStore } from '../../packages/oauth-bridge/src/state/memory-state-store.js';
import { createMockTokenStore, type MockRegistrationTokenStore } from '../../packages/oauth-bridge/tests/helpers/mock-token-store.js';

const BASE_URL = 'https://bridge.example.com';

function setupEnv() {
  process.env.BRIDGE_ISSUER = BASE_URL;
  process.env.BRIDGE_BASE_URL = BASE_URL;
  process.env.BRIDGE_JWT_SECRET = 'test-secret-for-e2e-security-tests';
  process.env.MITTWALD_AUTHORIZATION_URL = 'https://mittwald.example.com/oauth/authorize';
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'mittwald-client';
  process.env.BRIDGE_REDIRECT_URIS = 'https://example.com/callback';
  process.env.DCR_TOKEN_TTL_DAYS = '30';
}

function base64UrlEncode(input: Buffer | Uint8Array | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

describe('PKCE Security E2E Tests', () => {
  let stateStore: MemoryStateStore;
  let tokenStore: MockRegistrationTokenStore;

  beforeAll(() => {
    setupEnv();
  });

  beforeEach(() => {
    stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    tokenStore = createMockTokenStore({ defaultTtlDays: 30 });
  });

  afterEach(() => {
    tokenStore.clear();
  });

  describe('FR-015: OAuth + PKCE Flow Validation', () => {
    it('completes full OAuth flow with valid PKCE', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeVerifier, codeChallenge } = generatePkcePair();

      // Step 1: Register a client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'E2E Test Client',
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;
      expect(clientId).toBeDefined();

      // Step 2: Store an authorization grant (simulating authorization flow)
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Step 3: Mock Mittwald token exchange
      const { vi } = await import('vitest');
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          access_token: 'mittwald-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mittwald-refresh-token',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      // Step 4: Exchange code for tokens with correct PKCE
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: codeVerifier,
        })
        .expect(200);

      expect(tokenResponse.body.access_token).toBeDefined();
      expect(tokenResponse.body.token_type).toBe('Bearer');

      vi.restoreAllMocks();
    });
  });

  describe('FR-016: Negative PKCE Cases', () => {
    it('rejects token exchange with wrong code_verifier', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeChallenge } = generatePkcePair(); // Original pair
      const wrongVerifier = base64UrlEncode(randomBytes(32)); // Different verifier

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Store grant with original challenge
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Try to exchange with wrong verifier
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: wrongVerifier, // Wrong verifier!
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_grant');
      expect(tokenResponse.body.error_description).toContain('PKCE');
    });

    it('rejects token exchange with missing code_verifier', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeChallenge } = generatePkcePair();

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Store grant
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Try to exchange without verifier
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          // code_verifier missing!
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_request');
      expect(tokenResponse.body.error_description).toContain('code_verifier');
    });

    it('rejects code_verifier that is too short (< 43 chars)', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const shortVerifier = 'a'.repeat(42); // 42 chars, below minimum
      const codeChallenge = base64UrlEncode(createHash('sha256').update(shortVerifier).digest());

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Store grant
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Try to exchange with short verifier
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: shortVerifier,
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_request');
      expect(tokenResponse.body.error_description).toContain('43 and 128');
    });

    it('rejects code_verifier that is too long (> 128 chars)', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const longVerifier = 'a'.repeat(129); // 129 chars, above maximum
      const codeChallenge = base64UrlEncode(createHash('sha256').update(longVerifier).digest());

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Store grant
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Try to exchange with long verifier
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: longVerifier,
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_request');
      expect(tokenResponse.body.error_description).toContain('43 and 128');
    });
  });

  describe('FR-016: Authorization Code Replay Prevention', () => {
    it('rejects reuse of authorization code', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeVerifier, codeChallenge } = generatePkcePair();

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Store grant
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Mock Mittwald for first exchange
      const { vi } = await import('vitest');
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          access_token: 'mittwald-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mittwald-refresh-token',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      // First exchange - should succeed
      const firstResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: codeVerifier,
        })
        .expect(200);

      expect(firstResponse.body.access_token).toBeDefined();

      // Second exchange with same code - should fail
      const secondResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: codeVerifier,
        })
        .expect(400);

      expect(secondResponse.body.error).toBe('invalid_grant');
      expect(secondResponse.body.error_description).toContain('already been used');

      vi.restoreAllMocks();
    });

    it('rejects use of unknown authorization code', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeVerifier } = generatePkcePair();

      // Register client
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Try to exchange with made-up code
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: 'made-up-invalid-code',
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: codeVerifier,
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_grant');
      expect(tokenResponse.body.error_description).toContain('Unknown authorization code');
    });

    it('rejects authorization code from different client', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);
      const { codeVerifier, codeChallenge } = generatePkcePair();

      // Register first client
      const client1Response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Client 1',
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const client1Id = client1Response.body.client_id;

      // Register second client
      const client2Response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Client 2',
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const client2Id = client2Response.body.client_id;

      // Store grant for client 1
      const authCode = `auth-code-${randomBytes(16).toString('hex')}`;
      await stateStore.storeAuthorizationGrant({
        authorizationCode: authCode,
        clientId: client1Id, // Grant is for client 1
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-auth-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      // Try to exchange using client 2
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: 'https://example.com/callback',
          client_id: client2Id, // Wrong client!
          code_verifier: codeVerifier,
        })
        .expect(400);

      expect(tokenResponse.body.error).toBe('invalid_grant');
      expect(tokenResponse.body.error_description).toContain('different client');
    });
  });

  describe('FR-018: Session/State Error Handling', () => {
    it('handles state store errors gracefully', async () => {
      const config = loadConfigFromEnv();

      // Create a failing state store
      const failingStateStore = {
        ...stateStore,
        getAuthorizationGrant: async () => {
          throw new Error('Simulated state store failure');
        },
        getClientRegistration: stateStore.getClientRegistration.bind(stateStore),
        storeClientRegistration: stateStore.storeClientRegistration.bind(stateStore),
      };

      const app = createApp(config, failingStateStore as any, tokenStore);
      const { codeVerifier } = generatePkcePair();

      // Register client (uses different store method)
      const registerResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const clientId = registerResponse.body.client_id;

      // Try to exchange - should return server error, not crash
      const tokenResponse = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: 'any-code',
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: codeVerifier,
        })
        .expect(500);

      expect(tokenResponse.body.error).toBe('server_error');
    });
  });
});
