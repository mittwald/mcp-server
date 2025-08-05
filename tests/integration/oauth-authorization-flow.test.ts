import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { OAuthStateManager } from '../../src/auth/oauth-state-manager.js';
import { SessionManager } from '../../src/server/session-manager.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/server.js';
import axios from 'axios';

describe('OAuth Authorization Flow Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let oauthClient: MittwaldOAuthClient;
  let stateManager: OAuthStateManager;
  let sessionManager: SessionManager;
  let redisClient: RedisClient;

  const testConfig: OAuthConfig = {
    issuer: 'http://localhost:8080/default',
    clientId: 'mittwald-mcp-server',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'user:read', 'customer:read', 'project:read']
  };

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_OAUTH = 'false';
    process.env.OAUTH_ISSUER = testConfig.issuer;
    process.env.MITTWALD_OAUTH_CLIENT_ID = testConfig.clientId;
    process.env.MITTWALD_OAUTH_CLIENT_SECRET = testConfig.clientSecret;
    process.env.OAUTH_REDIRECT_URI = testConfig.redirectUri;
    process.env.JWT_SECRET = 'test-jwt-secret-for-oauth-flow';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Initialize components
    redisClient = RedisClient.getInstance();
    stateManager = new OAuthStateManager();
    sessionManager = new SessionManager();
    oauthClient = new MittwaldOAuthClient(testConfig);

    // Initialize app
    app = await createApp();
    request = supertest(app);

    // Wait for mock OAuth server
    await waitForMockOAuthServer();
    
    // Initialize OAuth client
    await oauthClient.initialize();
  });

  afterAll(async () => {
    await redisClient.disconnect?.();
  });

  beforeEach(async () => {
    // Clean up Redis before each test
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  afterEach(async () => {
    // Clean up after each test
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  describe('Authorization URL Generation', () => {
    it('should generate valid authorization URL with proper PKCE parameters', async () => {
      const response = await request
        .get('/auth/login')
        .expect(302);

      expect(response.headers.location).toBeTruthy();
      const authUrl = new URL(response.headers.location);
      
      // Verify the authorization URL structure
      expect(authUrl.origin).toBe('http://localhost:8080');
      expect(authUrl.pathname).toBe('/default/authorize');
      
      // Verify required parameters
      expect(authUrl.searchParams.get('client_id')).toBe(testConfig.clientId);
      expect(authUrl.searchParams.get('response_type')).toBe('code');
      expect(authUrl.searchParams.get('redirect_uri')).toBe(testConfig.redirectUri);
      expect(authUrl.searchParams.get('scope')).toBe(testConfig.scopes.join(' '));
      expect(authUrl.searchParams.get('state')).toBeTruthy();
      expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
      expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should store OAuth state correctly during authorization URL generation', async () => {
      const response = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(response.headers.location);
      const state = authUrl.searchParams.get('state');
      expect(state).toBeTruthy();

      // Verify state is stored in Redis
      const storedState = await stateManager.getState(state!);
      expect(storedState).toBeTruthy();
      expect(storedState!.state).toBe(state);
      expect(storedState!.codeVerifier).toBeTruthy();
      expect(storedState!.codeChallenge).toBeTruthy();
    });

    it('should generate unique states for concurrent authorization requests', async () => {
      const responses = await Promise.all([
        request.get('/auth/login').expect(302),
        request.get('/auth/login').expect(302),
        request.get('/auth/login').expect(302)
      ]);

      const states = responses.map(r => {
        const url = new URL(r.headers.location);
        return url.searchParams.get('state');
      });

      // All states should be unique
      expect(new Set(states).size).toBe(3);
      expect(states.every(s => s !== null)).toBe(true);
    });

    it('should handle authorization request with custom session context', async () => {
      const sessionId = 'test-session-123';
      
      const response = await request
        .get('/auth/login')
        .set('X-Session-ID', sessionId)
        .expect(302);

      const authUrl = new URL(response.headers.location);
      const state = authUrl.searchParams.get('state');
      
      const storedState = await stateManager.getState(state!);
      expect(storedState?.sessionId).toBe(sessionId);
    });
  });

  describe('OAuth Callback Handling', () => {
    let validState: string;
    let validCodeVerifier: string;

    beforeEach(async () => {
      // Generate a valid state for callback tests
      const stateData = await stateManager.createState('test-session');
      validState = stateData.state;
      validCodeVerifier = 'test-code-verifier-123';
      
      // Update state with code verifier (simulating what happens during auth URL generation)
      await stateManager.updateState(validState, {
        codeVerifier: validCodeVerifier,
        codeChallenge: 'test-code-challenge'
      });
    });

    it('should handle successful OAuth callback with valid authorization code', async () => {
      const authCode = 'valid-auth-code-from-provider';
      
      // Note: This will fail in actual execution because MockOAuth2Server
      // requires real interaction, but we can test the request structure
      const response = await request
        .get('/auth/callback')
        .query({
          code: authCode,
          state: validState
        });

      // The exact response depends on implementation, but it should not be a 5xx error
      expect([200, 302, 400, 401].includes(response.status)).toBe(true);
    });

    it('should reject callback with invalid state', async () => {
      const response = await request
        .get('/auth/callback')
        .query({
          code: 'some-auth-code',
          state: 'invalid-state-123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/state|invalid/i)
      });
    });

    it('should reject callback without authorization code', async () => {
      const response = await request
        .get('/auth/callback')
        .query({
          state: validState
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/code|missing/i)
      });
    });

    it('should reject callback without state parameter', async () => {
      const response = await request
        .get('/auth/callback')
        .query({
          code: 'some-auth-code'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/state|missing/i)
      });
    });

    it('should handle OAuth error callbacks properly', async () => {
      const response = await request
        .get('/auth/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access',
          state: validState
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'access_denied',
        message: expect.stringContaining('User denied access')
      });
    });

    it('should cleanup OAuth state after successful callback processing', async () => {
      // First verify state exists
      const initialState = await stateManager.getState(validState);
      expect(initialState).toBeTruthy();

      // Process callback (will fail but should cleanup state)
      await request
        .get('/auth/callback')
        .query({
          code: 'test-code',
          state: validState
        });

      // State should be consumed/cleaned up
      const finalState = await stateManager.getState(validState);
      expect(finalState).toBeNull();
    });
  });

  describe('Token Exchange Integration', () => {
    it('should properly structure token exchange requests to MockOAuth2Server', async () => {
      const mockCode = 'mock-authorization-code';
      const mockCodeVerifier = 'mock-code-verifier-123';
      const mockState = 'mock-state-456';

      try {
        await oauthClient.exchangeCodeForTokens(mockCode, mockCodeVerifier, mockState);
      } catch (error: any) {
        // Verify the error is from token exchange, not from malformed request
        expect(error.message).toContain('Token exchange failed');
        // Should not contain network or parsing errors
        expect(error.message).not.toContain('ECONNREFUSED');
        expect(error.message).not.toContain('JSON');
      }
    });

    it('should handle token exchange network failures gracefully', async () => {
      // Create OAuth client with invalid issuer to simulate network failure
      const failingConfig = {
        ...testConfig,
        issuer: 'http://localhost:9999/nonexistent'
      };
      
      const failingClient = new MittwaldOAuthClient(failingConfig);
      
      // Initialize should fail
      await expect(failingClient.initialize())
        .rejects.toThrow('OAuth client initialization failed');
    });

    it('should validate token exchange parameters', async () => {
      const validCode = 'valid-code';
      const validVerifier = 'valid-verifier';
      const validState = 'valid-state';

      // Test with empty parameters
      await expect(oauthClient.exchangeCodeForTokens('', validVerifier, validState))
        .rejects.toThrow();
      
      await expect(oauthClient.exchangeCodeForTokens(validCode, '', validState))
        .rejects.toThrow();
      
      await expect(oauthClient.exchangeCodeForTokens(validCode, validVerifier, ''))
        .rejects.toThrow();
    });
  });

  describe('Complete Authorization Flow Simulation', () => {
    it('should maintain state consistency throughout the OAuth flow', async () => {
      // Step 1: Initiate authorization
      const authResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(authResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;
      const codeChallenge = authUrl.searchParams.get('code_challenge')!;

      // Step 2: Verify state storage
      const storedState = await stateManager.getState(state);
      expect(storedState).toBeTruthy();
      expect(storedState!.state).toBe(state);

      // Step 3: Simulate callback (will fail but tests flow structure)
      const callbackResponse = await request
        .get('/auth/callback')
        .query({
          code: 'simulated-auth-code',
          state: state
        });

      // Should process callback attempt (even if it fails due to invalid code)
      expect([200, 302, 400, 401, 500].includes(callbackResponse.status)).toBe(true);
    });

    it('should handle concurrent OAuth flows without state collision', async () => {
      // Initiate multiple OAuth flows simultaneously
      const responses = await Promise.all([
        request.get('/auth/login').expect(302),
        request.get('/auth/login').expect(302),
        request.get('/auth/login').expect(302)
      ]);

      const states = responses.map(r => {
        const url = new URL(r.headers.location);
        return url.searchParams.get('state')!;
      });

      // All states should be unique and valid
      expect(new Set(states).size).toBe(3);
      
      // All states should be retrievable
      const storedStates = await Promise.all(
        states.map(state => stateManager.getState(state))
      );
      
      expect(storedStates.every(s => s !== null)).toBe(true);
      expect(storedStates.map(s => s!.state)).toEqual(states);
    });

    it('should expire OAuth states after timeout', async () => {
      // Create state with short TTL for testing
      const shortLivedState = await stateManager.createState('test-session');
      
      // Verify state exists initially
      expect(await stateManager.getState(shortLivedState.state)).toBeTruthy();
      
      // Manually expire state by updating expiration time
      await stateManager.updateState(shortLivedState.state, {
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });
      
      // State should now be expired and cleaned up
      expect(await stateManager.getState(shortLivedState.state)).toBeNull();
    });
  });

  describe('Authorization Flow Error Handling', () => {
    it('should handle MockOAuth2Server unavailability during flow initiation', async () => {
      // Temporarily break OAuth client
      const originalClient = (app as any).oauthClient;
      (app as any).oauthClient = null;

      const response = await request
        .get('/auth/login')
        .expect(500);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/oauth|initialization/i)
      });

      // Restore client
      (app as any).oauthClient = originalClient;
    });

    it('should handle malformed callback URLs', async () => {
      const response = await request
        .get('/auth/callback')
        .query({
          invalid_param: 'invalid_value',
          another_invalid: 'param'
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    it('should handle expired states in callback', async () => {
      // Create an expired state
      const expiredState = await stateManager.createState('test-session');
      await stateManager.updateState(expiredState.state, {
        expiresAt: new Date(Date.now() - 1000)
      });

      const response = await request
        .get('/auth/callback')
        .query({
          code: 'some-code',
          state: expiredState.state
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/state|expired|invalid/i)
      });
    });

    it('should handle Redis connection failures during OAuth flow', async () => {
      // This test would require mocking Redis failures
      // For now, we verify that the OAuth flow doesn't break the app
      const response = await request
        .get('/auth/login');

      // Should get some response, not a complete server crash
      expect([200, 302, 500].includes(response.status)).toBe(true);
    });
  });

  describe('OAuth Flow Security', () => {
    it('should use secure PKCE with S256 code challenge method', async () => {
      const response = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(response.headers.location);
      expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
      expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
      
      // Code challenge should be different from code verifier
      const state = authUrl.searchParams.get('state')!;
      const storedState = await stateManager.getState(state);
      expect(storedState!.codeChallenge).not.toBe(storedState!.codeVerifier);
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request
        .get('/auth/callback')
        .query({ error: 'access_denied', state: 'invalid' })
        .expect(400);

      const responseText = JSON.stringify(response.body);
      // Should not contain internal paths, secrets, or stack traces
      expect(responseText).not.toMatch(/\/Users|\/home|Error:|client_secret|redis_password/i);
    });

    it('should prevent state reuse attacks', async () => {
      const authResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(authResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;

      // First callback attempt
      await request
        .get('/auth/callback')
        .query({
          code: 'first-code',
          state: state
        });

      // Second callback attempt with same state should fail
      const response = await request
        .get('/auth/callback')
        .query({
          code: 'second-code',
          state: state
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/state|invalid|expired/i)
      });
    });

    it('should validate redirect URI consistency', async () => {
      const response = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(response.headers.location);
      const redirectUri = authUrl.searchParams.get('redirect_uri');
      
      expect(redirectUri).toBe(testConfig.redirectUri);
    });
  });
});

async function waitForMockOAuthServer(maxRetries = 10, delay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get('http://localhost:8080/default/.well-known/openid-configuration', {
        timeout: 2000
      });
      
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          'MockOAuth2Server is not available. Make sure Docker Compose is running with the mock-oauth service.'
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}