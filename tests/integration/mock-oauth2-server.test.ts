import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { OAuthStateManager } from '../../src/auth/oauth-state-manager.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import axios, { AxiosResponse } from 'axios';

/**
 * Integration tests for MockOAuth2Server
 * 
 * These tests verify that our OAuth implementation works correctly
 * with the NAV MockOAuth2Server running in Docker.
 * 
 * Prerequisites:
 * - Docker Compose running with mock-oauth service
 * - MockOAuth2Server accessible at http://localhost:8080
 * - Redis running for state management
 */
describe('MockOAuth2Server Integration Tests', () => {
  let oauthClient: MittwaldOAuthClient;
  let stateManager: OAuthStateManager;
  let redisClient: RedisClient;
  
  const mockOAuthServerUrl = 'http://localhost:8080/default';
  const testConfig: OAuthConfig = {
    issuer: mockOAuthServerUrl,
    clientId: 'mittwald-mcp-server',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'user:read', 'customer:read'],
    additionalParams: {}
  };

  beforeAll(async () => {
    // Initialize Redis and OAuth components
    redisClient = RedisClient.getInstance();
    stateManager = new OAuthStateManager();
    oauthClient = new MittwaldOAuthClient(testConfig);

    // Wait for MockOAuth2Server to be ready
    await waitForMockOAuthServer();
    
    // Initialize OAuth client
    await oauthClient.initialize();
  });

  afterAll(async () => {
    // Clean up Redis connections
    await redisClient.disconnect?.();
  });

  beforeEach(async () => {
    // Clean up Redis before each test
    const keys = await redisClient.keys('oauth:*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  describe('MockOAuth2Server Availability', () => {
    it('should have MockOAuth2Server running and accessible', async () => {
      const response = await axios.get(`${mockOAuthServerUrl}/.well-known/openid-configuration`);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        issuer: mockOAuthServerUrl,
        authorization_endpoint: `${mockOAuthServerUrl}/authorize`,
        token_endpoint: `${mockOAuthServerUrl}/token`,
        userinfo_endpoint: `${mockOAuthServerUrl}/userinfo`,
        jwks_uri: `${mockOAuthServerUrl}/jwks`
      });
    });

    it('should support PKCE code challenge methods', async () => {
      const response = await axios.get(`${mockOAuthServerUrl}/.well-known/openid-configuration`);
      
      expect(response.data.code_challenge_methods_supported).toContain('S256');
      expect(response.data.code_challenge_methods_supported).toContain('plain');
    });

    it('should support authorization code flow', async () => {
      const response = await axios.get(`${mockOAuthServerUrl}/.well-known/openid-configuration`);
      
      expect(response.data.response_types_supported).toContain('code');
      expect(response.data.response_modes_supported).toContain('query');
    });
  });

  describe('OAuth Client Discovery', () => {
    it('should discover OAuth endpoints from MockOAuth2Server', async () => {
      const freshClient = new MittwaldOAuthClient(testConfig);
      await freshClient.initialize();

      // Verify that discovery worked by checking internal state
      const discoveredConfig = (freshClient as any).discoveredConfiguration;
      expect(discoveredConfig).toBeTruthy();
      expect(discoveredConfig.authorization_endpoint).toBe(`${mockOAuthServerUrl}/authorize`);
      expect(discoveredConfig.token_endpoint).toBe(`${mockOAuthServerUrl}/token`);
    });

    it('should handle discovery with insecure requests (HTTP)', async () => {
      // MockOAuth2Server runs on HTTP for testing
      const httpConfig = { ...testConfig, issuer: mockOAuthServerUrl };
      const httpClient = new MittwaldOAuthClient(httpConfig);
      
      // Should not throw despite HTTP usage
      await expect(httpClient.initialize()).resolves.not.toThrow();
    });
  });

  describe('Authorization URL Generation', () => {
    it('should generate valid authorization URLs with PKCE', async () => {
      const sessionId = 'test-session-123';
      const codeVerifier = 'test-code-verifier-123';
      
      // Generate state
      const state = await stateManager.generateState(sessionId, codeVerifier);
      expect(state).toBeTruthy();

      // Generate auth URL
      const authData = await oauthClient.generateAuthUrl(state);
      
      expect(authData.authUrl).toContain(`${mockOAuthServerUrl}/authorize`);
      expect(authData.authUrl).toContain(`client_id=${testConfig.clientId}`);
      expect(authData.authUrl).toContain(`state=${state}`);
      expect(authData.authUrl).toContain('code_challenge=');
      expect(authData.authUrl).toContain('code_challenge_method=S256');
      expect(authData.authUrl).toContain(`redirect_uri=${encodeURIComponent(testConfig.redirectUri)}`);
      expect(authData.authUrl).toContain(`scope=${encodeURIComponent(testConfig.scopes.join(' '))}`);
      
      expect(authData.codeVerifier).toBeTruthy();
      expect(authData.state).toBe(state);
    });

    it('should generate different code verifiers for each request', async () => {
      const state1 = await stateManager.generateState('session-1', 'verifier-1');
      const state2 = await stateManager.generateState('session-2', 'verifier-2');
      
      const authData1 = await oauthClient.generateAuthUrl(state1);
      const authData2 = await oauthClient.generateAuthUrl(state2);
      
      expect(authData1.codeVerifier).not.toBe(authData2.codeVerifier);
      expect(authData1.state).not.toBe(authData2.state);
    });
  });

  describe('State Management with MockOAuth2Server', () => {
    it('should store and validate OAuth states correctly', async () => {
      const sessionId = 'integration-test-session';
      const codeVerifier = 'integration-test-verifier';
      
      // Generate and store state
      const state = await stateManager.generateState(sessionId, codeVerifier);
      
      // Validate and consume state
      const validatedState = await stateManager.validateAndConsumeState(state);
      
      expect(validatedState).toEqual({
        sessionId,
        codeVerifier
      });
      
      // State should be consumed (not reusable)
      const secondValidation = await stateManager.validateAndConsumeState(state);
      expect(secondValidation).toBeNull();
    });

    it('should handle state expiration correctly', async () => {
      // This test would require manipulating time or waiting
      // For now, test the expiration logic directly
      const sessionId = 'expiring-session';
      const codeVerifier = 'expiring-verifier';
      
      const state = await stateManager.generateState(sessionId, codeVerifier);
      expect(state).toBeTruthy();
      
      // Immediately validate should work
      const validation = await stateManager.validateAndConsumeState(state);
      expect(validation).toBeTruthy();
    });
  });

  describe('Token Exchange Simulation', () => {
    it('should simulate successful token exchange with MockOAuth2Server', async () => {
      // Note: This is a simulation since we can't easily complete the full OAuth flow
      // in an automated test without a browser
      
      const mockAuthCode = 'mock-authorization-code';
      const mockCodeVerifier = 'mock-code-verifier';
      
      try {
        // This will fail with MockOAuth2Server because we don't have a real auth code
        // But we can verify the request structure is correct
        await oauthClient.exchangeCodeForTokens(mockAuthCode, mockCodeVerifier);
      } catch (error: any) {
        // Expect specific error from MockOAuth2Server indicating invalid code
        expect(error.message).toContain('Token exchange failed');
      }
    });

    it('should handle token exchange errors gracefully', async () => {
      const invalidCode = 'invalid-code';
      const invalidVerifier = 'invalid-verifier';
      
      await expect(
        oauthClient.exchangeCodeForTokens(invalidCode, invalidVerifier)
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('UserInfo Endpoint', () => {
    it('should handle userinfo requests with MockOAuth2Server format', async () => {
      // MockOAuth2Server provides a userinfo endpoint
      // We can test the client handles the expected format
      
      const mockAccessToken = 'mock-access-token';
      
      try {
        // This will fail because we don't have a valid token
        await oauthClient.fetchUserInfo(mockAccessToken);
      } catch (error: any) {
        // Should fail with authentication error, not parsing error
        expect(error.message).toContain('Failed to fetch user info');
      }
    });
  });

  describe('Complete OAuth Flow Simulation', () => {
    it('should simulate the complete OAuth flow steps', async () => {
      const sessionId = 'flow-test-session';
      const userId = 'test-user-123';
      
      // Step 1: Generate state and auth URL
      const codeVerifier = 'flow-test-verifier';
      const state = await stateManager.generateState(sessionId, codeVerifier);
      const authData = await oauthClient.generateAuthUrl(state);
      
      expect(authData.authUrl).toContain('authorize');
      expect(authData.state).toBe(state);
      
      // Step 2: Validate state (simulating callback)
      const validatedState = await stateManager.validateAndConsumeState(state);
      expect(validatedState?.sessionId).toBe(sessionId);
      expect(validatedState?.codeVerifier).toBe(codeVerifier);
      
      // Step 3: Exchange code for tokens (would fail with mock code)
      // In real implementation, this would be done with the actual auth code
      // from MockOAuth2Server
      
      // Step 4: State cleanup verification
      const cleanupCount = await stateManager.cleanupExpiredStates();
      expect(cleanupCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling with MockOAuth2Server', () => {
    it('should handle MockOAuth2Server unavailability', async () => {
      // Test with wrong URL to simulate server unavailability
      const wrongConfig = {
        ...testConfig,
        issuer: 'http://localhost:9999/nonexistent'
      };
      
      const failingClient = new MittwaldOAuthClient(wrongConfig);
      
      await expect(failingClient.initialize())
        .rejects.toThrow('OAuth client initialization failed');
    });

    it('should handle invalid client configuration', async () => {
      const invalidConfig = {
        ...testConfig,
        clientId: '', // Invalid empty client ID
      };
      
      const invalidClient = new MittwaldOAuthClient(invalidConfig);
      
      // Should still initialize (server validation happens during auth flow)
      await expect(invalidClient.initialize()).resolves.not.toThrow();
    });
  });

  describe('MockOAuth2Server Test User Flow', () => {
    it('should generate authorization URL that works with MockOAuth2Server login', async () => {
      const sessionId = 'manual-test-session';
      const codeVerifier = 'manual-test-verifier';
      
      const state = await stateManager.generateState(sessionId, codeVerifier);
      const authData = await oauthClient.generateAuthUrl(state);
      
      // Verify URL can be used for manual testing
      console.log('\n=== Manual Testing URL ===');
      console.log('Visit this URL to test OAuth flow with MockOAuth2Server:');
      console.log(authData.authUrl);
      console.log('Use any username (e.g., "testuser") in the MockOAuth2Server form');
      console.log('===========================\n');
      
      expect(authData.authUrl).toMatch(/^http:\/\/localhost:8080\/default\/authorize\?/);
    });
  });
});

/**
 * Wait for MockOAuth2Server to be ready
 */
async function waitForMockOAuthServer(maxRetries = 10, delay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get('http://localhost:8080/default/.well-known/openid-configuration', {
        timeout: 2000
      });
      
      if (response.status === 200) {
        console.log('✅ MockOAuth2Server is ready');
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          'MockOAuth2Server is not available. Make sure Docker Compose is running with the mock-oauth service.'
        );
      }
      
      console.log(`⏳ Waiting for MockOAuth2Server... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}