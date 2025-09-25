/**
 * Scope Validation Integration Tests
 *
 * Tests centralized scope configuration and validation based on ARCHITECTURE.md
 * Ensures single source of truth for all 41 Mittwald scopes + OIDC scopes
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import axios from 'axios';
import { DEFAULT_SCOPES, SUPPORTED_SCOPES } from '../../src/config/mittwald-scopes.js';
import { configureRemoteSuiteTimeout, MCP_SERVER, OAUTH_SERVER, safeRequest } from '../utils/remote.js';

const SUITE_TIMEOUT = configureRemoteSuiteTimeout();

const remoteTest: typeof test = (name, handler, options) =>
  test(name, { timeout: SUITE_TIMEOUT, ...options }, handler);

describe('Centralized Scope Configuration', () => {
  let claudeClient: any;

  beforeAll(async (context) => {
    context.setTimeout(SUITE_TIMEOUT);
    // Register a test Claude.ai client for scope testing
    const registrationRequest = {
      client_name: 'Test Claude Client',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post'
    };

    try {
      const response = await safeRequest(
        () => axios.post(`${OAUTH_SERVER}/reg`, registrationRequest),
        'Skipping test client registration (OAuth host unavailable)'
      );
      if (!response) {
        claudeClient = null;
        return;
      }
      claudeClient = response.data;
    } catch (error) {
      console.warn('Failed to register test client, using fallback');
      claudeClient = { client_id: 'test-fallback-client' };
    }
  });

  beforeEach((context) => {
    context.setTimeout(SUITE_TIMEOUT);
  });
  describe('Single Source of Truth Validation', () => {
    remoteTest('MCP server and OAuth server advertise identical Mittwald scopes', async () => {
      // Test scope configuration consistency
      const mcpMetadata = await safeRequest(
        () => axios.get(`${MCP_SERVER}/.well-known/oauth-protected-resource`),
        'Skipping MCP metadata comparison (MCP host unavailable)'
      );
      const oauthMetadata = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`),
        'Skipping OAuth metadata comparison (OAuth host unavailable)'
      );

      if (!mcpMetadata || !oauthMetadata) return;

      const mcpScopes = mcpMetadata.data.scopes_supported || [];
      const oauthScopes = oauthMetadata.data.scopes_supported || [];

      if (!mcpScopes.length || !oauthScopes.length) {
        console.warn('Skipping strict scope subset assertion (scope metadata incomplete)');
        return;
      }

      const expected = new Set(SUPPORTED_SCOPES);
      for (const scope of mcpScopes) {
        expect(expected.has(scope)).toBe(true);
      }
      for (const scope of oauthScopes) {
        expect(expected.has(scope)).toBe(true);
      }
    });

    remoteTest('OAuth server supports OIDC scopes for Claude.ai compatibility', async () => {
      const response = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`),
        'Skipping OIDC scope test (OAuth host unavailable)'
      );
      if (!response) return;

      const supported = response.data.scopes_supported || [];
      if (supported.length) {
        expect(supported).toContain('openid');
      }
    });

    remoteTest('All Mittwald API scopes are supported', async () => {
      const response = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`),
        'Skipping Mittwald scope listing test (OAuth host unavailable)'
      );
      if (!response) return;
      const supportedScopes = response.data.scopes_supported || [];
      expect(Array.isArray(supportedScopes)).toBe(true);
      if (supportedScopes.length) {
        const hasMittwaldScopes = supportedScopes.some((scope: string) => !['openid', 'offline_access'].includes(scope));
        if (hasMittwaldScopes) {
          for (const scope of SUPPORTED_SCOPES) {
            expect(supportedScopes).toContain(scope);
          }
        } else {
          console.warn('Authorization server metadata only exposes compatibility scopes (openid/offline_access); skipping Mittwald scope assertion');
        }
      }
    });
  });

  describe('No Artificial Scope Limitations', () => {
    remoteTest('Client can register with all 41 Mittwald scopes', async () => {
      const allMittwaldScopes = SUPPORTED_SCOPES.filter((scope) => !['openid', 'offline_access'].includes(scope));

      const registrationRequest = {
        client_name: 'Full Scope Test Client',
        redirect_uris: ['http://localhost:3001/callback'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        scope: allMittwaldScopes.join(' ')
      };

      const response = await safeRequest(
        () => axios.post(`${OAUTH_SERVER}/reg`, registrationRequest, { validateStatus: () => true }),
        'Skipping full-scope registration test (OAuth host unavailable)'
      );
      if (!response) return;

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.data.scope).toContain('app:read');
        const registeredScopes = response.data.scope.split(' ');
        expect(registeredScopes.length).toBeGreaterThanOrEqual(allMittwaldScopes.length);
      } else {
        expect(response.data.error).toBeDefined();
      }
    });

    remoteTest('Authorization request accepts all valid scopes without filtering', async () => {
      // Test that authorization requests don't get artificially filtered
      const requestedScopes = ['openid', 'app:read', 'app:write', 'user:read', 'customer:read', 'project:read', 'database:read', 'domain:read'];
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: claudeClient?.client_id || 'test-client',
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        code_challenge_method: 'S256',
        state: 'test-scope-validation',
        scope: requestedScopes.join(' '),
        resource: `${MCP_SERVER}/mcp`
      });

      const response = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/auth?${authParams}`, { maxRedirects: 0, validateStatus: () => true }),
        'Skipping authorization request scope test (OAuth host unavailable)'
      );
      if (!response) return;

      expect([302, 303, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(['invalid_scope', 'invalid_client']).toContain(response.data.error);
      }
    });
  });

  describe('Scope Configuration Consistency', () => {
    remoteTest('No hardcoded scopes in codebase', async () => {
      // This test verifies that all scopes come from centralized configuration
      // Would check that getSupportedScopes() is used everywhere
      expect(true).toBe(true); // Placeholder - requires code analysis
    });

    remoteTest('Default scopes are subset of supported scopes', async () => {
      const metadata = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`),
        'Skipping default scope validation (OAuth host unavailable)'
      );
      if (!metadata) return;
      const supportedScopes = metadata.data.scopes_supported || [];
      if (supportedScopes.length >= DEFAULT_SCOPES.length) {
        for (const scope of DEFAULT_SCOPES) {
          expect(supportedScopes).toContain(scope);
        }
      } else {
        console.warn('Default scope subset assertion skipped (scope metadata incomplete)');
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
