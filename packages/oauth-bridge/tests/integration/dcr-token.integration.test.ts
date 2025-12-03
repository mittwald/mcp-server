/**
 * Integration tests for DCR Token Flow
 *
 * Tests the complete flow of:
 * - POST /register returns registration_access_token and expiry
 * - GET /register/:id with valid token returns 200
 * - GET /register/:id with invalid token returns 401
 * - GET /register/:id with wrong client's token returns 403 Forbidden (per RFC 7592)
 * - DELETE /register/:id with valid token succeeds
 *
 * These tests verify the security hardening per RFC 7592 requirements.
 */

import request from 'supertest';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { loadConfigFromEnv } from '../../src/config.js';
import { MemoryStateStore } from '../../src/state/memory-state-store.js';
import { createMockTokenStore, type MockRegistrationTokenStore } from '../helpers/mock-token-store.js';

const BASE_URL = 'https://bridge.example.com';

function setupEnv() {
  process.env.BRIDGE_ISSUER = BASE_URL;
  process.env.BRIDGE_BASE_URL = BASE_URL;
  process.env.BRIDGE_JWT_SECRET = 'test-secret-for-integration-tests';
  process.env.MITTWALD_AUTHORIZATION_URL = 'https://mittwald.example.com/oauth/authorize';
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'test-mittwald-client';
  process.env.BRIDGE_REDIRECT_URIS = [
    'https://example.com/callback',
    'https://test.example.com/oauth/redirect',
  ].join(',');
  process.env.DCR_TOKEN_TTL_DAYS = '30';
}

describe('DCR Token Integration Tests', () => {
  let stateStore: MemoryStateStore;
  let tokenStore: MockRegistrationTokenStore;

  beforeEach(() => {
    setupEnv();
    stateStore = new MemoryStateStore({ ttlMs: 60 * 1000 });
    tokenStore = createMockTokenStore({ defaultTtlDays: 30 });
  });

  afterEach(() => {
    tokenStore.clear();
    vi.restoreAllMocks();
  });

  describe('POST /register', () => {
    test('returns registration_access_token in response', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
          client_name: 'Test Client',
        })
        .expect(201);

      expect(response.body.client_id).toBeDefined();
      expect(response.body.registration_access_token).toBeDefined();
      expect(typeof response.body.registration_access_token).toBe('string');
      // Token should be base64url encoded (43 chars for 256-bit)
      expect(response.body.registration_access_token.length).toBe(43);
    });

    test('returns registration_access_token_expires_at in response', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const beforeTime = Math.floor(Date.now() / 1000);

      const response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      const afterTime = Math.floor(Date.now() / 1000);

      expect(response.body.registration_access_token_expires_at).toBeDefined();
      expect(typeof response.body.registration_access_token_expires_at).toBe('number');

      // Should expire in approximately 30 days
      const expectedMinExpiry = beforeTime + 30 * 24 * 60 * 60;
      const expectedMaxExpiry = afterTime + 30 * 24 * 60 * 60;

      expect(response.body.registration_access_token_expires_at).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(response.body.registration_access_token_expires_at).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    test('returns registration_client_uri with client_id', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          token_endpoint_auth_method: 'none',
        })
        .expect(201);

      expect(response.body.registration_client_uri).toBe(
        `${BASE_URL}/register/${response.body.client_id}`
      );
    });
  });

  describe('GET /register/:client_id', () => {
    test('returns 200 with valid token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Test Client',
        })
        .expect(201);

      const { client_id, registration_access_token } = postResponse.body;

      // GET with valid token
      const getResponse = await request(app.callback())
        .get(`/register/${client_id}`)
        .set('Authorization', `Bearer ${registration_access_token}`)
        .expect(200);

      expect(getResponse.body.client_id).toBe(client_id);
      expect(getResponse.body.client_name).toBe('Test Client');
      expect(getResponse.body.redirect_uris).toEqual(['https://example.com/callback']);
    });

    test('returns 401 without token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id } = postResponse.body;

      // GET without token
      const getResponse = await request(app.callback())
        .get(`/register/${client_id}`)
        .expect(401);

      expect(getResponse.body.error).toBe('invalid_token');
      expect(getResponse.headers['www-authenticate']).toContain('Bearer');
    });

    test('returns 401 with invalid token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id } = postResponse.body;

      // GET with wrong token
      const getResponse = await request(app.callback())
        .get(`/register/${client_id}`)
        .set('Authorization', 'Bearer wrong-token-value')
        .expect(401);

      expect(getResponse.body.error).toBe('invalid_token');
    });

    test('returns 401 with another client\'s token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register two clients
      const client1Response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Client 1',
        })
        .expect(201);

      const client2Response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
          client_name: 'Client 2',
        })
        .expect(201);

      const { client_id: client1Id } = client1Response.body;
      const { registration_access_token: client2Token } = client2Response.body;

      // Try to GET client1 using client2's token
      // Per RFC 7592: valid token for wrong client returns 403 Forbidden
      const getResponse = await request(app.callback())
        .get(`/register/${client1Id}`)
        .set('Authorization', `Bearer ${client2Token}`)
        .expect(403);

      // Token is valid but for wrong client - 403 Forbidden
      expect(getResponse.body.error).toBe('access_denied');
      expect(getResponse.body.error_description).toContain('different client');
    });

    test('does not return registration_access_token in GET response', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id, registration_access_token } = postResponse.body;

      // GET with valid token
      const getResponse = await request(app.callback())
        .get(`/register/${client_id}`)
        .set('Authorization', `Bearer ${registration_access_token}`)
        .expect(200);

      // Per RFC 7592 Section 2.1: registration_access_token is NOT returned on GET
      expect(getResponse.body.registration_access_token).toBeUndefined();
    });
  });

  describe('DELETE /register/:client_id', () => {
    test('returns 204 with valid token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id, registration_access_token } = postResponse.body;

      // DELETE with valid token
      await request(app.callback())
        .delete(`/register/${client_id}`)
        .set('Authorization', `Bearer ${registration_access_token}`)
        .expect(204);
    });

    test('returns 401 without token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id } = postResponse.body;

      // DELETE without token
      const deleteResponse = await request(app.callback())
        .delete(`/register/${client_id}`)
        .expect(401);

      expect(deleteResponse.body.error).toBe('invalid_token');
    });

    test('returns 401 with invalid token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id } = postResponse.body;

      // DELETE with wrong token
      const deleteResponse = await request(app.callback())
        .delete(`/register/${client_id}`)
        .set('Authorization', 'Bearer wrong-token-value')
        .expect(401);

      expect(deleteResponse.body.error).toBe('invalid_token');
    });

    test('client is not accessible after deletion', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      // Register a client first
      const postResponse = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id, registration_access_token } = postResponse.body;

      // DELETE the client
      await request(app.callback())
        .delete(`/register/${client_id}`)
        .set('Authorization', `Bearer ${registration_access_token}`)
        .expect(204);

      // Try to GET the deleted client (token should also be deleted)
      await request(app.callback())
        .get(`/register/${client_id}`)
        .set('Authorization', `Bearer ${registration_access_token}`)
        .expect(401);
    });
  });

  describe('Token Security Properties', () => {
    test('tokens are not stored in plaintext in client records', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const response = await request(app.callback())
        .post('/register')
        .send({
          redirect_uris: ['https://example.com/callback'],
        })
        .expect(201);

      const { client_id, registration_access_token } = response.body;

      // Check state store - should have placeholder, not actual token
      const storedClient = await stateStore.getClientRegistration(client_id);
      expect(storedClient).not.toBeNull();
      expect(storedClient!.registrationAccessToken).toBe('[HASHED]');
      expect(storedClient!.registrationAccessToken).not.toBe(registration_access_token);
    });

    test('each client gets a unique token', async () => {
      const config = loadConfigFromEnv();
      const app = createApp(config, stateStore, tokenStore);

      const tokens = new Set<string>();

      // Register multiple clients
      for (let i = 0; i < 10; i++) {
        const response = await request(app.callback())
          .post('/register')
          .send({
            redirect_uris: ['https://example.com/callback'],
            client_name: `Client ${i}`,
          })
          .expect(201);

        expect(tokens.has(response.body.registration_access_token)).toBe(false);
        tokens.add(response.body.registration_access_token);
      }
    });
  });
});
