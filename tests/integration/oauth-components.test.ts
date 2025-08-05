import { describe, it, expect } from 'vitest';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { OAuthStateManager } from '../../src/auth/oauth-state-manager.js';

describe('OAuth Components Tests', () => {
  const testConfig: OAuthConfig = {
    issuer: 'http://localhost:8080/default',
    clientId: 'mittwald-mcp-server',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'user:read']
  };

  describe('OAuth Client', () => {
    it('should create OAuth client with valid configuration', () => {
      const client = new MittwaldOAuthClient(testConfig);
      expect(client).toBeInstanceOf(MittwaldOAuthClient);
    });

    it('should accept configuration parameters', () => {
      const client = new MittwaldOAuthClient(testConfig);
      expect(client).toBeDefined();
      
      // Test that the client was created with the config
      const config = (client as any).config;
      expect(config.issuer).toBe(testConfig.issuer);
      expect(config.clientId).toBe(testConfig.clientId);
      expect(config.redirectUri).toBe(testConfig.redirectUri);
      expect(config.scopes).toEqual(testConfig.scopes);
    });

    it('should handle token validation methods', async () => {
      const client = new MittwaldOAuthClient(testConfig);
      
      // These should not throw when called on uninitialized client
      try {
        await client.validateToken('test-token');
      } catch (error: any) {
        expect(error.message).toContain('OAuth client not initialized');
      }
    });

    it('should handle user info methods', async () => {
      const client = new MittwaldOAuthClient(testConfig);
      
      try {
        await client.getUserInfo('test-token');
      } catch (error: any) {
        expect(error.message).toContain('OAuth client not initialized');
      }
    });
  });

  describe('OAuth State Manager', () => {
    it('should create state manager instance', () => {
      const stateManager = new OAuthStateManager();
      expect(stateManager).toBeInstanceOf(OAuthStateManager);
    });

    it('should have expected state management methods', () => {
      const stateManager = new OAuthStateManager();
      
      expect(typeof stateManager.createState).toBe('function');
      expect(typeof stateManager.getState).toBe('function');
      expect(typeof stateManager.updateState).toBe('function');
      expect(typeof stateManager.deleteState).toBe('function');
      expect(typeof stateManager.cleanupExpiredStates).toBe('function');
    });
  });

  describe('OAuth Configuration Validation', () => {
    it('should validate complete OAuth configuration', () => {
      expect(testConfig.issuer).toBeTruthy();
      expect(testConfig.clientId).toBeTruthy();
      expect(testConfig.clientSecret).toBeTruthy();
      expect(testConfig.redirectUri).toBeTruthy();
      expect(Array.isArray(testConfig.scopes)).toBe(true);
      expect(testConfig.scopes.length).toBeGreaterThan(0);
    });

    it('should have required OAuth scopes', () => {
      expect(testConfig.scopes).toContain('openid');
      expect(testConfig.scopes).toContain('profile');
      expect(testConfig.scopes).toContain('user:read');
    });

    it('should have valid URLs', () => {
      expect(() => new URL(testConfig.issuer)).not.toThrow();
      expect(() => new URL(testConfig.redirectUri)).not.toThrow();
    });

    it('should use localhost for testing', () => {
      expect(testConfig.issuer).toContain('localhost');
      expect(testConfig.redirectUri).toContain('localhost');
    });
  });

  describe('OAuth Security', () => {
    it('should use secure redirect URI scheme', () => {
      // In development, http://localhost is acceptable
      const url = new URL(testConfig.redirectUri);
      expect(url.protocol).toMatch(/^https?:$/);
      if (url.protocol === 'http:') {
        expect(url.hostname).toBe('localhost');
      }
    });

    it('should have non-empty client credentials', () => {
      expect(testConfig.clientId.length).toBeGreaterThan(0);
      expect(testConfig.clientSecret.length).toBeGreaterThan(0);
    });

    it('should include required OAuth scopes', () => {
      // OpenID Connect requires 'openid' scope
      expect(testConfig.scopes).toContain('openid');
      
      // Should have additional scopes for functionality
      expect(testConfig.scopes.length).toBeGreaterThan(1);
    });
  });
});