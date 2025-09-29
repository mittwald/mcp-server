import { describe, test, expect } from 'vitest';
import axios from 'axios';
import { MCP_SERVER, OAUTH_SERVER, REQUEST_TIMEOUT_MS } from '../utils/remote.js';
import { DEFAULT_SCOPES, SUPPORTED_SCOPES } from '../../src/config/mittwald-scopes.js';

const http = axios.create({ timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true });

function pickAllowedRedirect(redirectUris: unknown): string {
  if (Array.isArray(redirectUris) && redirectUris.length > 0) {
    const first = redirectUris.find((uri): uri is string => typeof uri === 'string' && uri.length > 0);
    if (first) {
      return first;
    }
  }
  // Fallback to ChatGPT production redirect which must be present in bridge config.
  return 'https://chatgpt.com/connector_platform_oauth_redirect';
}

describe('Post-deploy OAuth smoke', () => {
  describe('OAuth bridge', () => {
    test('health endpoint reports ok status', async () => {
      const response = await http.get(`${OAUTH_SERVER}/health`);
      expect(response.status).toBe(200);
      expect(response.data?.status).toBe('ok');
      expect(response.data?.issuer).toBe(OAUTH_SERVER);
    });

    test('authorization server metadata advertises expected endpoints and scopes', async () => {
      const response = await http.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);
      expect(response.status).toBe(200);
      const metadata = response.data as Record<string, any>;

      expect(metadata.issuer).toBe(OAUTH_SERVER);
      expect(metadata.authorization_endpoint).toBe(`${OAUTH_SERVER}/authorize`);
      expect(metadata.token_endpoint).toBe(`${OAUTH_SERVER}/token`);
      expect(metadata.registration_endpoint).toBe(`${OAUTH_SERVER}/register`);
      expect(metadata.code_challenge_methods_supported).toContain('S256');
      expect(metadata.grant_types_supported).toContain('authorization_code');
      expect(metadata.grant_types_supported).toContain('refresh_token');
      expect(metadata.token_endpoint_auth_methods_supported).toContain('none');

      const scopesSupported = Array.isArray(metadata.scopes_supported) ? metadata.scopes_supported : [];
      expect(scopesSupported.length).toBeGreaterThanOrEqual(DEFAULT_SCOPES.length);
      for (const scope of DEFAULT_SCOPES) {
        expect(scopesSupported).toContain(scope);
      }

      const mcpMetadata = metadata.mcp as Record<string, any> | undefined;
      expect(mcpMetadata?.registration_endpoint).toBe(`${OAUTH_SERVER}/register`);
      const redirectUris = mcpMetadata?.redirect_uris;
      expect(Array.isArray(redirectUris)).toBe(true);
      if (Array.isArray(redirectUris)) {
        expect(redirectUris.length).toBeGreaterThan(0);
      }
    });

    test('protected resource metadata references the bridge and allowed redirect URIs', async () => {
      const response = await http.get(`${OAUTH_SERVER}/.well-known/oauth-protected-resource`);
      expect(response.status).toBe(200);
      const metadata = response.data as Record<string, any>;

      expect(metadata.resource).toBe(OAUTH_SERVER);
      const authorizationServers = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers : [];
      expect(authorizationServers).toContain(OAUTH_SERVER);

      const mcpMetadata = metadata.mcp as Record<string, any> | undefined;
      expect(mcpMetadata?.registration_endpoint).toBe(`${OAUTH_SERVER}/register`);
      const redirectUris = mcpMetadata?.redirect_uris;
      expect(Array.isArray(redirectUris)).toBe(true);
      if (Array.isArray(redirectUris)) {
        expect(redirectUris.length).toBeGreaterThan(0);
      }
    });

    test('dynamic client registration round-trip succeeds', async () => {
      const metadataResponse = await http.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);
      expect(metadataResponse.status).toBe(200);
      const metadata = metadataResponse.data as Record<string, any>;
      const chosenRedirectUri = pickAllowedRedirect(metadata?.mcp?.redirect_uris);

      const registrationPayload = {
        client_name: `CI Smoke ${Date.now()}`,
        redirect_uris: [chosenRedirectUri],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        scope: DEFAULT_SCOPES.join(' ')
      };

      const registerResponse = await http.post(`${OAUTH_SERVER}/register`, registrationPayload, {
        headers: {
          'content-type': 'application/json'
        }
      });
      expect(registerResponse.status).toBe(201);
      const clientId = registerResponse.data?.client_id;
      const registrationAccessToken = registerResponse.data?.registration_access_token;
      const registrationClientUri = registerResponse.data?.registration_client_uri;

      expect(typeof clientId).toBe('string');
      expect(typeof registrationAccessToken).toBe('string');
      expect(registrationClientUri).toBe(`${OAUTH_SERVER}/register/${clientId}`);

      const getResponse = await http.get(`${OAUTH_SERVER}/register/${clientId}`, {
        headers: {
          authorization: `Bearer ${registrationAccessToken}`
        }
      });
      expect(getResponse.status).toBe(200);
      expect(getResponse.data?.client_id).toBe(clientId);
      expect(getResponse.data?.redirect_uris).toContain(chosenRedirectUri);

      const deleteResponse = await http.delete(`${OAUTH_SERVER}/register/${clientId}`, {
        headers: {
          authorization: `Bearer ${registrationAccessToken}`
        }
      });
      expect(deleteResponse.status).toBe(204);

      const postDeleteResponse = await http.get(`${OAUTH_SERVER}/register/${clientId}`, {
        headers: {
          authorization: `Bearer ${registrationAccessToken}`
        }
      });
      expect(postDeleteResponse.status).toBe(404);
    });

    test('registration rejects unapproved redirect URIs', async () => {
      const registrationPayload = {
        client_name: 'CI Invalid Redirect',
        redirect_uris: ['https://example.com/not-allowed'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none'
      };

      const response = await http.post(`${OAUTH_SERVER}/register`, registrationPayload, {
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data?.error).toBe('invalid_redirect_uri');
    });
  });

  describe('MCP server', () => {
    test('/mcp unauthenticated request advertises OAuth challenge', async () => {
      const response = await http.get(`${MCP_SERVER}/mcp`);
      expect(response.status).toBe(401);
      const header = String(response.headers['www-authenticate'] ?? '');
      expect(header).toContain('Bearer realm="MCP Server"');
      expect(response.data?.oauth?.authorization_url).toContain(OAUTH_SERVER);
      expect(response.data?.oauth?.token_url).toContain(OAUTH_SERVER);
    });

    test('protected resource metadata lists bridge scopes and registration endpoint', async () => {
      const response = await http.get(`${MCP_SERVER}/.well-known/oauth-protected-resource`);
      expect(response.status).toBe(200);
      const metadata = response.data as Record<string, any>;

      expect(metadata.resource).toBe(`${MCP_SERVER}/mcp`);
      const authorizationServers = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers : [];
      expect(authorizationServers).toContain(OAUTH_SERVER);
      const scopesSupported = Array.isArray(metadata.scopes_supported) ? metadata.scopes_supported : [];
      if (scopesSupported.length) {
        for (const scope of DEFAULT_SCOPES) {
          expect(scopesSupported).toContain(scope);
        }
      }
      const mcpMetadata = metadata.mcp as Record<string, any> | undefined;
      expect(mcpMetadata?.registration_endpoint).toContain('/register');
      const redirectUris = mcpMetadata?.redirect_uris;
      if (Array.isArray(redirectUris) && redirectUris.length > 0) {
        for (const uri of redirectUris) {
          expect(typeof uri).toBe('string');
        }
      }
    });

    test('scope catalogue aligns with repository configuration', async () => {
      const bridgeMetadataResponse = await http.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`);
      expect(bridgeMetadataResponse.status).toBe(200);
      const scopesSupported = bridgeMetadataResponse.data?.scopes_supported;
      expect(Array.isArray(scopesSupported)).toBe(true);
      if (Array.isArray(scopesSupported)) {
        for (const scope of SUPPORTED_SCOPES) {
          expect(scopesSupported).toContain(scope);
        }
      }
    });
  });
});
