import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import axios from 'axios';
import { createHash, randomBytes } from 'node:crypto';
import { startE2EEnvironment, stopE2EEnvironment, setMittwaldMode, type E2EContext } from './setup.js';
import { getBridgeBaseUrl, getMcpBaseUrl, waitForBridgeStack } from '../utils/remote.js';

describe.sequential('All client compatibility against bridge stack', () => {
  let context: E2EContext;

  beforeAll(async () => {
    context = await startE2EEnvironment();
    await waitForBridgeStack({ timeoutMs: 90_000 });
  }, 120_000);

  afterAll(async () => {
    await stopE2EEnvironment(context);
  }, 120_000);

  afterEach(() => {
    setMittwaldMode(context, 'online');
  });

  test('public client completes OAuth flow without client secret', async () => {
    const bridgeBaseUrl = getBridgeBaseUrl();
    const registration = await axios.post(`${bridgeBaseUrl}/register`, {
      client_name: 'MCP Jam Inspector',
      redirect_uris: ['http://localhost:6274/oauth/callback/debug'],
      token_endpoint_auth_method: 'none'
    });
    expect(registration.data.client_secret).toBeUndefined();

    const flow = await runAuthorizationFlow({
      clientId: registration.data.client_id,
      redirectUri: 'http://localhost:6274/oauth/callback/debug',
      scope: 'openid offline_access'
    });

    const token = await axios.post(
      `${bridgeBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: flow.authorizationCode,
        redirect_uri: 'http://localhost:6274/oauth/callback/debug',
        client_id: registration.data.client_id,
        code_verifier: flow.codeVerifier
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    );

    expect(token.status).toBe(200);
    expect(typeof token.data.access_token).toBe('string');

    const sessionId = await initializeMcpSession(token.data.access_token);
    const tools = await listTools(token.data.access_token, sessionId);
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  }, 120_000);

  test('confidential client rejects missing secret but succeeds with correct credentials', async () => {
    const bridgeBaseUrl = getBridgeBaseUrl();
    const registration = await axios.post(`${bridgeBaseUrl}/register`, {
      client_name: 'ChatGPT',
      redirect_uris: ['https://chat.openai.com/aip/auth/callback'],
      token_endpoint_auth_method: 'client_secret_post'
    });
    expect(registration.data.client_secret).toBeDefined();

    const flow = await runAuthorizationFlow({
      clientId: registration.data.client_id,
      redirectUri: 'https://chat.openai.com/aip/auth/callback',
      scope: 'openid offline_access'
    });

    const missingSecret = await axios.post(
      `${bridgeBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: flow.authorizationCode,
        redirect_uri: 'https://chat.openai.com/aip/auth/callback',
        client_id: registration.data.client_id,
        code_verifier: flow.codeVerifier
      }),
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        validateStatus: () => true
      }
    );
    expect(missingSecret.status).toBe(401);
    expect(missingSecret.data.error).toBe('invalid_client');

    const validSecret = await axios.post(
      `${bridgeBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: flow.authorizationCode,
        redirect_uri: 'https://chat.openai.com/aip/auth/callback',
        client_id: registration.data.client_id,
        client_secret: registration.data.client_secret,
        code_verifier: flow.codeVerifier
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    );

    expect(validSecret.status).toBe(200);
    const sessionId = await initializeMcpSession(validSecret.data.access_token);
    const tools = await listTools(validSecret.data.access_token, sessionId);
    expect(tools.length).toBeGreaterThan(0);
  }, 120_000);

  test('mittwald downtime pauses all client flows', async () => {
    const bridgeBaseUrl = getBridgeBaseUrl();
    const registration = await axios.post(`${bridgeBaseUrl}/register`, {
      client_name: 'Maintenance Scenario',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      token_endpoint_auth_method: 'client_secret_post'
    });

    const flow = await runAuthorizationFlow({
      clientId: registration.data.client_id,
      redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      scope: 'openid offline_access'
    });

    setMittwaldMode(context, 'offline');

    const response = await axios.post(
      `${bridgeBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: flow.authorizationCode,
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        client_id: registration.data.client_id,
        client_secret: registration.data.client_secret,
        code_verifier: flow.codeVerifier
      }),
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        validateStatus: () => true
      }
    );

    expect(response.status).toBe(502);
    expect(response.data.error).toBe('temporarily_unavailable');
  }, 120_000);
});

async function runAuthorizationFlow(options: { clientId: string; redirectUri: string; scope: string }) {
  const bridgeBaseUrl = getBridgeBaseUrl();
  const { codeVerifier, codeChallenge } = createPkcePair();
  const clientState = `state-${randomBytes(4).toString('hex')}`;

  const authorize = await axios.get(`${bridgeBaseUrl}/authorize`, {
    params: {
      response_type: 'code',
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      scope: options.scope,
      state: clientState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    },
    maxRedirects: 0,
    validateStatus: () => true
  });

  expect(authorize.status).toBe(303);
  const redirectUrl = new URL(authorize.headers.location);
  const internalState = redirectUrl.searchParams.get('state');
  expect(internalState).toBeTruthy();

  const mittwaldCode = `mittwald-${randomBytes(4).toString('hex')}`;

  const callback = await axios.get(`${bridgeBaseUrl}/mittwald/callback`, {
    params: { state: internalState, code: mittwaldCode },
    maxRedirects: 0,
    validateStatus: () => true
  });

  expect(callback.status).toBe(303);
  const clientRedirect = new URL(callback.headers.location);
  const authorizationCode = clientRedirect.searchParams.get('code');
  expect(authorizationCode).toBeTruthy();

  return {
    authorizationCode: authorizationCode!,
    codeVerifier
  };
}

async function initializeMcpSession(accessToken: string): Promise<string> {
  const mcpBaseUrl = getMcpBaseUrl();
  const response = await axios.post(
    `${mcpBaseUrl}/mcp`,
    {
      jsonrpc: '2.0',
      id: 'init',
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {
          name: 'Compatibility Test Client',
          version: '1.0.0'
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'mcp-protocol-version': '2025-06-18',
        Accept: 'application/json, text/event-stream'
      }
    }
  );

  expect(response.status).toBe(200);
  const sessionId = response.headers['mcp-session-id'] || response.headers['x-session-id'];
  expect(sessionId).toBeTruthy();
  return Array.isArray(sessionId) ? sessionId[0] : sessionId as string;
}

async function listTools(accessToken: string, sessionId: string) {
  const mcpBaseUrl = getMcpBaseUrl();
  const response = await axios.post(
    `${mcpBaseUrl}/mcp`,
    {
      jsonrpc: '2.0',
      id: 'tools-list',
      method: 'tools/list',
      params: {}
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'mcp-session-id': sessionId,
        'mcp-protocol-version': '2025-06-18',
        Accept: 'application/json, text/event-stream'
      }
    }
  );

  expect(response.status).toBe(200);
  const payload = normalizeSseJson(response.data);
  return payload.result?.tools ?? [];
}

function normalizeSseJson<T = any>(payload: unknown): T {
  if (typeof payload === 'string') {
    const dataLine = payload
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('data:'));
    if (dataLine) {
      const json = dataLine.replace(/^data:\s*/, '');
      return JSON.parse(json) as T;
    }
    return JSON.parse(payload) as T;
  }
  return payload as T;
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { codeVerifier: verifier, codeChallenge: challenge };
}
