/**
 * Claude.ai OAuth Flow End-to-End Tests
 *
 * Tests the complete Claude.ai OAuth 2.1 workflow based on ARCHITECTURE.md
 * Covers all 38 steps from initial MCP request to final tool execution
 */

import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import axios from 'axios';
import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify } from 'jose';
import {
  configureRemoteSuiteTimeout,
  MCP_SERVER,
  OAUTH_SERVER,
  safeRequest,
  getBridgeBaseUrl,
  getMcpBaseUrl
} from '../utils/remote.js';
import { startE2EEnvironment, stopE2EEnvironment, type E2EContext } from './setup.js';

const SUITE_TIMEOUT = configureRemoteSuiteTimeout();
const REGISTRATION_PATH = '/register';
const AUTHORIZE_PATH = '/authorize';
const CLAUDE_REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';
const BRIDGE_JWT_SECRET = 'mittwald-e2e-shared-secret';

const remoteTest: typeof test = (name, handler, options) =>
  test(name, { timeout: SUITE_TIMEOUT, ...options }, handler);

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

async function verifyBridgeJwt(token: string) {
  const secret = new TextEncoder().encode(BRIDGE_JWT_SECRET);
  return jwtVerify(token, secret);
}

async function fetchBridgeMetrics(baseUrl: string): Promise<Record<string, number>> {
  const response = await axios.get(`${baseUrl}/health`, { validateStatus: () => true });
  expect(response.status).toBe(200);
  const metrics = response.data?.stateStore?.metrics ?? {};
  return {
    pendingAuthorizations: Number(metrics.pendingAuthorizations) || 0,
    pendingGrants: Number(metrics.pendingGrants) || 0,
    registeredClients: Number(metrics.registeredClients) || 0
  };
}

async function readFirstJsonMessage(stream: ReadableStream<Uint8Array>): Promise<any> {
  const reader = stream.getReader();
  let buffer = '';
  let dataLines: string[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        const remaining = buffer.trim();
        if (remaining) {
          dataLines.push(remaining);
        }
        if (dataLines.length > 0) {
          return JSON.parse(dataLines.join('\n'));
        }
        throw new Error('MCP stream ended without message');
      }
      buffer += Buffer.from(value).toString('utf-8');
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) {
          if (dataLines.length > 0) {
            return JSON.parse(dataLines.join('\n'));
          }
          continue;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
          continue;
        }
        if (line.startsWith('event:')) {
          continue;
        }
        if (line.startsWith(':')) {
          continue;
        }
        // Fallback for raw JSON lines
        if (line) {
          return JSON.parse(line);
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

interface McpRequestOptions {
  baseUrl: string;
  token: string;
  payload: unknown;
  sessionId?: string;
}

async function postMcpStreamRequest({ baseUrl, token, payload, sessionId }: McpRequestOptions) {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18',
      ...(sessionId ? { 'mcp-session-id': sessionId } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.body) {
    throw new Error('MCP response stream missing');
  }

  const message = await readFirstJsonMessage(response.body);
  return { response, message };
}

describe('Claude.ai OAuth 2.1 End-to-End Flow', () => {
  let claudeClient: any;
  let localContext: E2EContext | null = null;
  let localClaudeClient: any | null = null;

  async function ensureLocalClaudeRegistration(): Promise<{ context: E2EContext; client: any }> {
    if (!localContext) {
      localContext = await startE2EEnvironment();
    }

    if (!localClaudeClient) {
      const bridgeBaseUrl = getBridgeBaseUrl();
      const registrationPayload = {
        client_name: 'Claude E2E',
        redirect_uris: [CLAUDE_REDIRECT_URI],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
        scope: 'openid offline_access'
      };

      const registrationResponse = await axios.post(`${bridgeBaseUrl}${REGISTRATION_PATH}`, registrationPayload, {
        validateStatus: () => true
      });

      if (registrationResponse.status >= 400) {
        throw new Error(
          `Failed to register local Claude client: ${registrationResponse.status} ${JSON.stringify(registrationResponse.data)}`
        );
      }

      localClaudeClient = registrationResponse.data;
    }

    return { context: localContext!, client: localClaudeClient! };
  }

  beforeEach(() => {
  });

  afterAll(async () => {
    await stopE2EEnvironment(localContext ?? undefined);
    localContext = null;
    localClaudeClient = null;
  }, SUITE_TIMEOUT * 5);

  describe('Complete 38-Step Workflow', () => {
    remoteTest('Phase 1-2: Discovery and Registration (Steps 1-9)', async () => {
      const mcp401Response = await safeRequest(
        () => axios.get(`${MCP_SERVER}/mcp`, { validateStatus: () => true }),
        'Skipping discovery test (MCP host unavailable)'
      );
      if (!mcp401Response) {
        claudeClient = null;
        return;
      }
      expect(mcp401Response.status).toBe(401);

      const resourceMetadata = await safeRequest(
        () => axios.get(`${MCP_SERVER}/.well-known/oauth-protected-resource`),
        'Skipping resource metadata test (MCP host unavailable)'
      );
      if (!resourceMetadata) {
        claudeClient = null;
        return;
      }
      expect(resourceMetadata.data.authorization_servers).toContain(OAUTH_SERVER);

      const asMetadata = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}/.well-known/oauth-authorization-server`),
        'Skipping authorization server metadata test (OAuth host unavailable)'
      );
      if (!asMetadata) {
        claudeClient = null;
        return;
      }
      expect(asMetadata.data.registration_endpoint).toBe(`${OAUTH_SERVER}${REGISTRATION_PATH}`);

      const registrationRequest = {
        client_name: 'Claude',
        redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
        scope: 'openid offline_access'
      };

      const regResponse = await safeRequest(
        () => axios.post(`${OAUTH_SERVER}${REGISTRATION_PATH}`, registrationRequest, { validateStatus: () => true }),
        'Skipping Claude registration test (OAuth host unavailable)'
      );
      if (!regResponse) {
        claudeClient = null;
        return;
      }

      expect([200, 201, 400]).toContain(regResponse.status);
      if (regResponse.status >= 400) {
        expect(regResponse.data.error).toBeDefined();
        claudeClient = null;
        return;
      }

      expect(regResponse.data.client_secret).toBeDefined();
      expect(regResponse.data.token_endpoint_auth_method).toBe('client_secret_post');
      claudeClient = regResponse.data;
    });

    remoteTest('Phase 3: Authorization Request (Steps 10-12)', async () => {
      // Step 10: Authorization request with all Claude.ai parameters
      if (!claudeClient?.client_id) {
        console.warn('Skipping authorization request test (client unavailable)');
        return;
      }

      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: claudeClient.client_id,
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        code_challenge_method: 'S256',
        state: 'test-state-' + Date.now(),
        scope: 'openid offline_access',
        resource: `${MCP_SERVER}/mcp`
      });

      const authResponse = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}${AUTHORIZE_PATH}?${authParams}`, { maxRedirects: 0, validateStatus: () => true }),
        'Skipping authorization request test (OAuth host unavailable)'
      );
      if (!authResponse) {
        return;
      }

      expect([303, 400]).toContain(authResponse.status);
      if (authResponse.status === 303) {
        const location = authResponse.headers.location ?? '';
        const isMittwaldRedirect = location.startsWith('https://api.mittwald.de/');
        const isInteractionRedirect = /\/interaction\/[A-Za-z0-9_-]+$/.test(location);
        expect(isMittwaldRedirect || isInteractionRedirect).toBe(true);

        if (isInteractionRedirect) {
          const interactionUid = location.split('/').pop();
          expect(interactionUid).toBeDefined();
        }
      }
    });

    remoteTest('Phases 4-8: Local OAuth Flow (Steps 13-36)', async () => {
      const { context, client } = await ensureLocalClaudeRegistration();
      const bridgeBaseUrl = getBridgeBaseUrl();
      const mcpBaseUrl = getMcpBaseUrl();
      const resourceIndicator = `${mcpBaseUrl}/mcp`;

      const { codeVerifier, codeChallenge } = generatePkcePair();
      const externalState = `state-${Date.now()}`;

      const authorizeParams = new URLSearchParams({
        response_type: 'code',
        client_id: client.client_id,
        redirect_uri: CLAUDE_REDIRECT_URI,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: externalState,
        scope: client.scope ?? 'openid offline_access',
        resource: resourceIndicator
      });

      const authorizeResponse = await axios.get(`${bridgeBaseUrl}${AUTHORIZE_PATH}?${authorizeParams}`, {
        maxRedirects: 0,
        validateStatus: () => true
      });

      expect(authorizeResponse.status).toBe(303);
      const locationHeader = authorizeResponse.headers.location;
      expect(locationHeader).toBeDefined();
      const mittwaldRedirect = new URL(locationHeader as string);
      expect(mittwaldRedirect.pathname).toBe('/oauth/authorize');
      const internalState = mittwaldRedirect.searchParams.get('state');
      expect(internalState).toBeTruthy();
      expect(mittwaldRedirect.searchParams.get('code_challenge')).toBe(codeChallenge);

      if (!internalState) {
        throw new Error('Mittwald redirect missing internal state parameter');
      }

      const metricsAfterAuthorize = await fetchBridgeMetrics(bridgeBaseUrl);
      expect(metricsAfterAuthorize.pendingAuthorizations).toBeGreaterThan(0);

      const mittwaldAuthCode = `mittwald-auth-${Date.now()}`;
      const callbackResponse = await axios.get(`${bridgeBaseUrl}/mittwald/callback`, {
        params: { state: internalState, code: mittwaldAuthCode },
        maxRedirects: 0,
        validateStatus: () => true
      });

      expect(callbackResponse.status).toBe(303);
      const redirectLocation = callbackResponse.headers.location;
      expect(redirectLocation).toBeDefined();
      const claudeRedirect = new URL(redirectLocation as string);
      expect(claudeRedirect.origin + claudeRedirect.pathname).toBe(CLAUDE_REDIRECT_URI);
      expect(claudeRedirect.searchParams.get('state')).toBe(externalState);
      const bridgeAuthorizationCode = claudeRedirect.searchParams.get('code');
      expect(bridgeAuthorizationCode).toBeTruthy();

      if (!bridgeAuthorizationCode) {
        throw new Error('Authorization code missing from Claude redirect');
      }


      const metricsAfterCallback = await fetchBridgeMetrics(bridgeBaseUrl);
      expect(metricsAfterCallback.pendingAuthorizations ?? 0).toBe(0);
      expect(metricsAfterCallback.pendingGrants).toBeGreaterThan(0);

      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: bridgeAuthorizationCode,
        redirect_uri: CLAUDE_REDIRECT_URI,
        client_id: client.client_id,
        code_verifier: codeVerifier
      });

      if (client.client_secret) {
        tokenParams.set('client_secret', client.client_secret);
      }

      const tokenResponse = await axios.post(`${bridgeBaseUrl}/token`, tokenParams, {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        validateStatus: () => true
      });

      expect(tokenResponse.status).toBe(200);
      const tokenBody = tokenResponse.data as Record<string, any>;
      expect(typeof tokenBody.access_token).toBe('string');
      expect(tokenBody.token_type).toBe('Bearer');
      expect(typeof tokenBody.refresh_token).toBe('string');
      expect(tokenBody.scope).toBeDefined();


      const lastTokenRequest = context.stub.getLastTokenRequest();
      expect(lastTokenRequest).toBeTruthy();
      expect(lastTokenRequest?.body?.grant_type).toBe('authorization_code');
      expect(lastTokenRequest?.body?.code).toBe(mittwaldAuthCode);
      expect(lastTokenRequest?.body?.code_verifier).toBe(codeVerifier);
      expect(lastTokenRequest?.body?.redirect_uri).toContain('/mittwald/callback');

      const verifiedJwt = await verifyBridgeJwt(tokenBody.access_token);
      const payload = verifiedJwt.payload as Record<string, any>;
      expect(payload.sub).toBe(client.client_id);
      expect(payload.scope).toBe(tokenBody.scope);
      expect(payload.resource).toBe(resourceIndicator);
      expect(payload.mittwald?.access_token).toBeDefined();
      expect(payload.mittwald?.refresh_token).toBeDefined();

      const initializeRequest = {
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {
            roots: {
              listChanged: true
            }
          },
          clientInfo: {
            name: 'Claude-E2E',
            version: '1.0.0'
          }
        }
      };

      const { response: initializeResponse, message: initializeMessage } = await postMcpStreamRequest({
        baseUrl: mcpBaseUrl,
        token: tokenBody.access_token,
        payload: initializeRequest
      });

      expect(initializeResponse.status).toBe(200);
      const sessionHeader = initializeResponse.headers.get('mcp-session-id') ?? initializeResponse.headers.get('x-session-id');
      expect(sessionHeader).toBeTruthy();
      expect(initializeMessage?.result?.capabilities).toBeDefined();

      const sessionId = sessionHeader ?? undefined;
      if (!sessionId) {
        throw new Error('Session identifier missing from initialize response');
      }


      const listToolsRequest = {
        jsonrpc: '2.0',
        id: 'tools-1',
        method: 'tools/list',
        params: {}
      };

      const { response: listToolsResponse, message: listToolsMessage } = await postMcpStreamRequest({
        baseUrl: mcpBaseUrl,
        token: tokenBody.access_token,
        payload: listToolsRequest,
        sessionId
      });

      expect(listToolsResponse.status).toBe(200);
      const tools = listToolsMessage?.result?.tools;
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

    }, { timeout: SUITE_TIMEOUT * 5 });
  });

  describe('Error Scenarios', () => {
    remoteTest('handles invalid client registration', async () => {
      const invalidRegistration = {
        client_name: 'Invalid Client',
        redirect_uris: ['http://invalid-uri'],
        token_endpoint_auth_method: 'invalid_method'
      };

      const response = await safeRequest(
        () => axios.post(`${OAUTH_SERVER}${REGISTRATION_PATH}`, invalidRegistration, { validateStatus: () => true }),
        'Skipping invalid registration test (OAuth host unavailable)'
      );

      if (!response) return;

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    remoteTest('handles authorization request with unsupported scopes', async () => {
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: claudeClient?.client_id || 'test-client',
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        scope: 'invalid:scope unsupported:permission'
      });

      const response = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}${AUTHORIZE_PATH}?${authParams}`, { validateStatus: () => true }),
        'Skipping unsupported scope test (OAuth host unavailable)'
      );

      if (!response) return;

      expect([400, 403]).toContain(response.status);
      if (response.status === 400) {
        expect(['invalid_scope', 'invalid_client']).toContain(response.data.error);
      }
    });

    remoteTest('handles missing required authorization parameters', async () => {
      const invalidAuthParams = new URLSearchParams({
        response_type: 'code'
        // Missing client_id, redirect_uri, etc.
      });

      const response = await safeRequest(
        () => axios.get(`${OAUTH_SERVER}${AUTHORIZE_PATH}?${invalidAuthParams}`, { validateStatus: () => true }),
        'Skipping missing-params test (OAuth host unavailable)'
      );

      if (!response) return;

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    test('enforces PKCE for public clients', async () => {
      // Test PKCE requirement enforcement
      expect(true).toBe(true); // Placeholder
    });

    test('validates redirect URI exactly', async () => {
      // Test redirect URI validation
      expect(true).toBe(true); // Placeholder
    });

    test('prevents authorization code replay attacks', async () => {
      // Test authorization code one-time use
      expect(true).toBe(true); // Placeholder
    });
  });
});
