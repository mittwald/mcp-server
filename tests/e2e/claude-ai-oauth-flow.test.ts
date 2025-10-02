import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import axios from 'axios';
import { createHash, randomBytes } from 'node:crypto';
import { startE2EEnvironment, stopE2EEnvironment, setMittwaldMode, type E2EContext } from './setup.js';
import { waitForBridgeStack, getBridgeBaseUrl, getMcpBaseUrl } from '../utils/remote.js';

interface AuthorizationFlowResult {
  codeVerifier: string;
  authorizationCode: string;
  clientState: string;
}

describe.sequential('Claude OAuth flow against bridge stack', () => {
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

  test('completes discovery, registration, authorization, and tool invocation', async () => {
    const bridgeBaseUrl = getBridgeBaseUrl();
    const mcpBaseUrl = getMcpBaseUrl();

    const resourceMetadata = await axios.get(`${mcpBaseUrl}/.well-known/oauth-protected-resource`);
    const authorizationServers: string[] = resourceMetadata.data.authorization_servers ?? [];
    const expectedServers = [bridgeBaseUrl, 'http://oauth-bridge:4000'];
    expect(
      authorizationServers.some((value) => expectedServers.includes(value))
    ).toBe(true);

    const authMetadata = await axios.get(`${bridgeBaseUrl}/.well-known/oauth-authorization-server`);
    const tokenEndpoint: string = authMetadata.data.token_endpoint;
    const possibleTokenEndpoints = [
      `${bridgeBaseUrl}/token`,
      'http://oauth-bridge:4000/token'
    ];
    expect(possibleTokenEndpoints).toContain(tokenEndpoint);

    const registration = await axios.post(`${bridgeBaseUrl}/register`, {
      client_name: 'Claude',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      token_endpoint_auth_method: 'client_secret_post',
      scope: 'openid offline_access'
    });
    expect(registration.status).toBe(201);

    const flow = await runAuthorizationFlow({
      clientId: registration.data.client_id,
      redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      scope: 'openid offline_access'
    });

    const tokenResponse = await axios.post(
      `${bridgeBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: flow.authorizationCode,
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        client_id: registration.data.client_id,
        client_secret: registration.data.client_secret,
        code_verifier: flow.codeVerifier
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    );

    expect(tokenResponse.status).toBe(200);
    expect(tokenResponse.data.token_type).toBe('Bearer');

    const accessToken = tokenResponse.data.access_token as string;
    expect(typeof accessToken).toBe('string');

    const unauthenticated = await axios.get(`${mcpBaseUrl}/mcp`, { validateStatus: () => true });
    expect(unauthenticated.status).toBe(401);

    const sessionId = await initializeMcpSession(accessToken);
    const toolsResponse = await axios.post(
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

    expect(toolsResponse.status).toBe(200);
    const toolsPayload = normalizeSseJson(toolsResponse.data);

    if (!Array.isArray(toolsPayload.result?.tools)) {
      throw new Error(`Unexpected tools response: ${JSON.stringify(toolsPayload)}`);
    }

    expect(toolsPayload.result.tools.length).toBeGreaterThan(0);
  }, 120_000);

  test('surfaces Mittwald downtime during token exchange', async () => {
    const bridgeBaseUrl = getBridgeBaseUrl();
    const registration = await axios.post(`${bridgeBaseUrl}/register`, {
      client_name: 'Claude (failure path)',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      token_endpoint_auth_method: 'client_secret_post'
    });

    const flow = await runAuthorizationFlow({
      clientId: registration.data.client_id,
      redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      scope: 'openid offline_access'
    });

    setMittwaldMode(context, 'error');

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
  });

  async function runAuthorizationFlow(options: { clientId: string; redirectUri: string; scope: string }): Promise<AuthorizationFlowResult> {
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
    console.info('🔁 authorize redirect', authorize.headers.location);
    const internalState = redirectUrl.searchParams.get('state');
    expect(internalState).toBeTruthy();

    const mittwaldCode = `mittwald-${randomBytes(4).toString('hex')}`;

    const callback = await axios.get(`${bridgeBaseUrl}/mittwald/callback`, {
      params: {
        state: internalState,
        code: mittwaldCode
      },
      maxRedirects: 0,
      validateStatus: () => true
    });

    expect(callback.status).toBe(303);
    const clientRedirect = new URL(callback.headers.location);
    const authorizationCode = clientRedirect.searchParams.get('code');
    const returnedState = clientRedirect.searchParams.get('state');

    expect(returnedState).toBe(clientState);
    expect(authorizationCode).toBeTruthy();

    return {
      codeVerifier,
      authorizationCode: authorizationCode!,
      clientState
    };
  }
});

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
          name: 'Claude Test Client',
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
      },
      validateStatus: () => true
    }
  );

  if (response.status !== 200) {
    throw new Error(`MCP initialize failed status=${response.status} data=${JSON.stringify(response.data)}`);
  }

  expect(response.status).toBe(200);
  const sessionId = response.headers['mcp-session-id'] || response.headers['x-session-id'];
  expect(typeof sessionId).toBe('string');
  return Array.isArray(sessionId) ? sessionId[0] : sessionId as string;
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { codeVerifier: verifier, codeChallenge: challenge };
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
