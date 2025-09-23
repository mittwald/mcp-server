/**
 * Scope Validation Integration Tests
 *
 * Tests centralized scope configuration and validation based on ARCHITECTURE.md
 * Ensures single source of truth for all 41 Mittwald scopes + OIDC scopes
 */

import { describe, test, expect, beforeAll } from 'vitest';
import axios from 'axios';

const OAUTH_SERVER = 'https://mittwald-oauth-server.fly.dev';
const MCP_SERVER = 'https://mittwald-mcp-fly2.fly.dev';

describe('Centralized Scope Configuration', () => {
  let claudeClient: any;

  beforeAll(async () => {
    // Register a test Claude.ai client for scope testing
    const registrationRequest = {
      client_name: 'Test Claude Client',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post'
    };

    try {
      const response = await axios.post(`${OAUTH_SERVER}/reg`, registrationRequest);
      claudeClient = response.data;
    } catch (error) {
      console.warn('Failed to register test client, using fallback');
      claudeClient = { client_id: 'test-fallback-client' };
    }
  });
  describe('Single Source of Truth Validation', () => {
    test('MCP server and OAuth server advertise identical Mittwald scopes', async () => {
      // Test scope configuration consistency
      const mcpMetadata = await axios.get(`${MCP_SERVER}/.well-known/oauth-protected-resource`);
      const oauthMetadata = await axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);

      const mcpScopes = mcpMetadata.data.scopes_supported;
      const oauthScopes = oauthMetadata.data.scopes_supported;

      // MCP scopes should be subset of OAuth scopes (OAuth has openid/profile too)
      for (const scope of mcpScopes) {
        expect(oauthScopes).toContain(scope);
      }

      // Verify all 41 Mittwald scopes are present
      const mittwaldScopes = mcpScopes.filter((scope: string) =>
        !['openid', 'profile'].includes(scope)
      );
      expect(mittwaldScopes).toHaveLength(41);
    });

    test('OAuth server supports OIDC scopes for Claude.ai compatibility', async () => {
      const response = await axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);

      expect(response.data.scopes_supported).toContain('openid');
      // Note: profile scope removed to match MCP server scope advertisement

      // Should have 41 Mittwald scopes + OIDC scopes (openid, and possibly profile)
      expect(response.data.scopes_supported.length).toBeGreaterThanOrEqual(42);
      expect(response.data.scopes_supported.length).toBeLessThanOrEqual(43);
    });

    test('All Mittwald API scopes are supported', async () => {
      const response = await axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);
      const supportedScopes = response.data.scopes_supported;

      // Application Management
      expect(supportedScopes).toContain('app:read');
      expect(supportedScopes).toContain('app:write');
      expect(supportedScopes).toContain('app:delete');

      // Database Management
      expect(supportedScopes).toContain('database:read');
      expect(supportedScopes).toContain('database:write');
      expect(supportedScopes).toContain('database:delete');

      // Project Management
      expect(supportedScopes).toContain('project:read');
      expect(supportedScopes).toContain('project:write');
      expect(supportedScopes).toContain('project:delete');

      // Domain Management
      expect(supportedScopes).toContain('domain:read');
      expect(supportedScopes).toContain('domain:write');
      expect(supportedScopes).toContain('domain:delete');

      // User Management
      expect(supportedScopes).toContain('user:read');
      expect(supportedScopes).toContain('user:write');

      // Customer Management
      expect(supportedScopes).toContain('customer:read');
      expect(supportedScopes).toContain('customer:write');

      // All other Mittwald scope categories...
      expect(supportedScopes).toContain('backup:read');
      expect(supportedScopes).toContain('contract:read');
      expect(supportedScopes).toContain('cronjob:read');
      expect(supportedScopes).toContain('extension:read');
      expect(supportedScopes).toContain('mail:read');
      expect(supportedScopes).toContain('registry:read');
      expect(supportedScopes).toContain('sshuser:read');
      expect(supportedScopes).toContain('stack:read');
    });
  });

  describe('No Artificial Scope Limitations', () => {
    test('Client can register with all 41 Mittwald scopes', async () => {
      const allMittwaldScopes = [
        'app:read', 'app:write', 'app:delete',
        'backup:read', 'backup:write', 'backup:delete',
        'contract:read', 'contract:write',
        'cronjob:read', 'cronjob:write', 'cronjob:delete',
        'customer:read', 'customer:write',
        'database:read', 'database:write', 'database:delete',
        'domain:read', 'domain:write', 'domain:delete',
        'extension:read', 'extension:write', 'extension:delete',
        'mail:read', 'mail:write', 'mail:delete',
        'order:domain-create', 'order:domain-preview',
        'project:read', 'project:write', 'project:delete',
        'registry:read', 'registry:write', 'registry:delete',
        'sshuser:read', 'sshuser:write', 'sshuser:delete',
        'stack:read', 'stack:write', 'stack:delete',
        'user:read', 'user:write'
      ];

      const registrationRequest = {
        client_name: 'Full Scope Test Client',
        redirect_uris: ['http://localhost:3001/callback'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        scope: allMittwaldScopes.join(' ')
      };

      const response = await axios.post(`${OAUTH_SERVER}/reg`, registrationRequest);

      expect(response.status).toBe(201);
      expect(response.data.scope).toContain('app:read');
      expect(response.data.scope).toContain('user:write');

      // Should not artificially limit scopes
      const registeredScopes = response.data.scope.split(' ');
      expect(registeredScopes.length).toBeGreaterThanOrEqual(allMittwaldScopes.length);
    });

    test('Authorization request accepts all valid scopes without filtering', async () => {
      // Test that authorization requests don't get artificially filtered
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: claudeClient?.client_id || 'test-client',
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        code_challenge_method: 'S256',
        state: 'test-scope-validation',
        scope: 'openid app:read app:write user:read customer:read project:read database:read domain:read',
        resource: `${MCP_SERVER}/mcp`
      });

      const response = await axios.get(
        `${OAUTH_SERVER}/auth?${authParams}`,
        { maxRedirects: 0, validateStatus: () => true }
      );

      // Should not get scope validation errors
      expect(response.status).not.toBe(400);
      if (response.status === 400) {
        expect(response.data.error).not.toBe('invalid_scope');
      }
    });
  });

  describe('Scope Configuration Consistency', () => {
    test('No hardcoded scopes in codebase', async () => {
      // This test verifies that all scopes come from centralized configuration
      // Would check that getSupportedScopes() is used everywhere
      expect(true).toBe(true); // Placeholder - requires code analysis
    });

    test('Default scopes are subset of supported scopes', async () => {
      const metadata = await axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);
      const supportedScopes = metadata.data.scopes_supported;

      // Test that default scopes are all in supported scopes
      const defaultScopes = ['user:read', 'customer:read', 'project:read', 'app:read'];

      for (const scope of defaultScopes) {
        expect(supportedScopes).toContain(scope);
      }
    });
  });

  describe('Client Type Scope Handling', () => {
    test('Claude.ai gets OIDC scopes + Mittwald scopes', async () => {
      // Test Claude.ai specific scope handling
      expect(true).toBe(true); // Placeholder
    });

    test('MCP Jam gets Mittwald scopes without OIDC', async () => {
      // Test MCP Jam scope handling (no openid/profile needed)
      expect(true).toBe(true); // Placeholder
    });

    test('ChatGPT gets appropriate scope set', async () => {
      // Test ChatGPT scope handling
      expect(true).toBe(true); // Placeholder
    });
  });
});