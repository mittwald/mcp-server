/**
 * Unit tests for PKCE validation per RFC 7636
 *
 * Tests cover:
 * - code_verifier length validation (43-128 characters)
 * - Empty code_verifier rejection
 * - Valid code_verifier acceptance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';
import { createApp } from '../../src/app.js';
import { loadConfigFromEnv } from '../../src/config.js';
import { MemoryStateStore } from '../../src/state/memory-state-store.js';
import { createMockTokenStore } from '../helpers/mock-token-store.js';

const BASE_URL = 'https://bridge.example.com';

function setupEnv() {
  process.env.BRIDGE_ISSUER = BASE_URL;
  process.env.BRIDGE_BASE_URL = BASE_URL;
  process.env.BRIDGE_JWT_SECRET = 'test-secret-for-pkce-tests';
  process.env.MITTWALD_AUTHORIZATION_URL = 'https://mittwald.example.com/oauth/authorize';
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'mittwald-client';
  process.env.BRIDGE_REDIRECT_URIS = 'https://example.com/callback';
}

function sha256ToBase64Url(input: string): string {
  return createHash('sha256')
    .update(input)
    .digest('base64url');
}

// Generate a valid code_verifier of specific length
function generateCodeVerifier(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a valid PKCE verifier for bridge->Mittwald (64 chars base64url)
function generateValidMittwaldVerifier(): string {
  return randomBytes(48)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

describe('PKCE code_verifier length validation', () => {
  let stateStore: MemoryStateStore;

  beforeEach(() => {
    setupEnv();
    stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token endpoint code_verifier validation', () => {
    async function setupGrant(codeVerifier: string) {
      const config = loadConfigFromEnv();
      const tokenStore = createMockTokenStore();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client
      const clientResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Test Client',
        })
        .expect(201);

      const clientId = clientResponse.body.client_id;
      const codeChallenge = sha256ToBase64Url(codeVerifier);

      // Store a grant with the corresponding code_challenge
      const grantCode = 'test-grant-code-' + Math.random();
      const mittwaldCodeVerifier = generateValidMittwaldVerifier();
      await stateStore.storeAuthorizationGrant({
        authorizationCode: grantCode,
        clientId,
        redirectUri: 'https://example.com/callback',
        codeChallenge,
        codeChallengeMethod: 'S256',
        mittwaldCodeVerifier, // Bridge's verifier for Mittwald
        scope: 'openid',
        mittwaldAuthorizationCode: 'mittwald-code',
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        used: false,
      });

      return { app, clientId, grantCode };
    }

    it('rejects code_verifier shorter than 43 characters', async () => {
      const shortVerifier = generateCodeVerifier(42); // Too short
      const { app, clientId, grantCode } = await setupGrant(shortVerifier);

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: shortVerifier,
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('43 and 128 characters');
    });

    it('rejects code_verifier longer than 128 characters', async () => {
      const longVerifier = generateCodeVerifier(129); // Too long
      const { app, clientId, grantCode } = await setupGrant(longVerifier);

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: longVerifier,
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('43 and 128 characters');
    });

    it('accepts code_verifier with exactly 43 characters (minimum)', async () => {
      const minVerifier = generateCodeVerifier(43);
      const { app, clientId, grantCode } = await setupGrant(minVerifier);

      // Mock the Mittwald token exchange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          access_token: 'mittwald-access',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mittwald-refresh',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: minVerifier,
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
    });

    it('accepts code_verifier with exactly 128 characters (maximum)', async () => {
      const maxVerifier = generateCodeVerifier(128);
      const { app, clientId, grantCode } = await setupGrant(maxVerifier);

      // Mock the Mittwald token exchange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          access_token: 'mittwald-access',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mittwald-refresh',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: maxVerifier,
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
    });

    it('rejects empty code_verifier', async () => {
      // Use a valid verifier for setup, but send empty at exchange time
      const validVerifier = generateCodeVerifier(64);
      const { app, clientId, grantCode } = await setupGrant(validVerifier);

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: '',
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('code_verifier');
    });

    it('rejects missing code_verifier', async () => {
      const validVerifier = generateCodeVerifier(64);
      const { app, clientId, grantCode } = await setupGrant(validVerifier);

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          // code_verifier missing
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_request');
      expect(response.body.error_description).toContain('code_verifier is required');
    });

    it('accepts typical 64-character code_verifier', async () => {
      const typicalVerifier = generateCodeVerifier(64);
      const { app, clientId, grantCode } = await setupGrant(typicalVerifier);

      // Mock the Mittwald token exchange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({
          access_token: 'mittwald-access',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mittwald-refresh',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const response = await request(app.callback())
        .post('/token')
        .send({
          grant_type: 'authorization_code',
          code: grantCode,
          redirect_uri: 'https://example.com/callback',
          client_id: clientId,
          code_verifier: typicalVerifier,
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
    });
  });
});
