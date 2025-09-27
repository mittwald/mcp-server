#!/usr/bin/env tsx

/**
 * End-to-end MCP + OAuth (Mittwald) test runner
 *
 * What it does
 * - Hits MCP /mcp unauthenticated to fetch OAuth metadata
 * - Registers a public client via Dynamic Client Registration (DCR)
 *   (requires AS DCR initial access token)
 * - Spins up a localhost redirect listener and runs auth code + PKCE
 * - Exchanges code for tokens at our OAuth server (which redirects to Mittwald for login)
 * - Uses the access token to connect to MCP via Streamable HTTP and list tools
 *
 * Usage
 *   MCP_BASE=https://your-mcp-server.com \
 *   AS_BASE=https://mittwald-oauth-bridge.fly.dev \
 *   AS_DCR_TOKEN=YOUR_INITIAL_ACCESS_TOKEN \
 *   tsx scripts/e2e-mcp-oauth.ts
 *
 * Notes
 * - This script opens a browser URL for you to log in at Mittwald via our AS.
 * - Loopback redirect must be allowed by the AS (we enabled localhost/127.0.0.1/[::1]).
 */

import http from 'http';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
import { setTimeout as delay } from 'timers/promises';

// Lazy import to avoid hard dependency if user only wants to test OAuth
async function importMcpClient() {
  const clientMod = await import('@modelcontextprotocol/sdk/client/index.js');
  const httpClientMod = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  return { Client: clientMod.Client, StreamableHTTPClientTransport: httpClientMod.StreamableHTTPClientTransport };
}

type OAuthMetadata = {
  authorization_url: string;
  token_url: string;
  client_id?: string;
  redirect_uri?: string;
  scopes?: string[];
};

const MCP_BASE = process.env.MCP_BASE || process.env.MCP_PUBLIC_BASE || 'https://localhost:3000';
const AS_BASE = process.env.AS_BASE || process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-bridge.fly.dev';
const AS_DCR_TOKEN = process.env.AS_DCR_TOKEN || process.env.INITIAL_ACCESS_TOKEN;
const SCOPES = process.env.MCP_SCOPES || 'openid profile email mcp:tools mcp:resources mcp:prompts';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest();
}

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function genPkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(sha256(verifier));
  return { verifier, challenge };
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log(`🔧 E2E MCP+OAuth test starting`);
  console.log(`   MCP_BASE=${MCP_BASE}`);
  console.log(`   AS_BASE=${AS_BASE}`);

  // 1) Probe MCP without auth to get OAuth metadata
  console.log('📡 Probing MCP without auth to get OAuth metadata...');
  const probe = await fetch(`${MCP_BASE}/mcp`, { method: 'GET' });
  if (probe.status !== 401) {
    const text = await probe.text();
    throw new Error(`Expected 401 from MCP, got ${probe.status}. Body: ${text}`);
  }
  const challenge = await probe.json();
  const oauth: OAuthMetadata = challenge.oauth;
  if (!oauth || !oauth.authorization_url || !oauth.token_url) {
    throw new Error(`MCP did not return OAuth metadata. Response: ${JSON.stringify(challenge)}`);
  }
  console.log('   ✅ Got OAuth metadata from MCP');

  // 2) Prepare loopback redirect listener
  const redirectPort = await getFreePort();
  const redirectUri = `http://127.0.0.1:${redirectPort}/callback`;
  const { server, waitForCode } = createRedirectListener(redirectPort);
  console.log(`🔁 Loopback redirect listening at ${redirectUri}`);

  // 3) Dynamic Client Registration
  if (!AS_DCR_TOKEN) {
    console.log('⚠️  AS_DCR_TOKEN not set; if registration is protected, DCR will fail.');
  }
  console.log('🪪 Registering client via DCR...');
  const regRes = await fetch(`${AS_BASE}/reg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AS_DCR_TOKEN ? { Authorization: `Bearer ${AS_DCR_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      client_name: 'E2E-MCP-CLI',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code'],
      token_endpoint_auth_method: 'none',
      application_type: 'native',
    }),
  });
  if (!regRes.ok) {
    const body = await regRes.text();
    throw new Error(`DCR failed: HTTP ${regRes.status}: ${body}`);
  }
  const reg = await regRes.json();
  const clientId: string = reg.client_id;
  if (!clientId) throw new Error(`DCR response missing client_id: ${JSON.stringify(reg)}`);
  console.log(`   ✅ Registered client_id=${clientId}`);

  // 4) Authorization Code + PKCE
  const state = base64url(crypto.randomBytes(16));
  const nonce = base64url(crypto.randomBytes(16));
  const { verifier, challenge: codeChallenge } = genPkce();
  const authUrl = new URL(`${AS_BASE}/auth`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  console.log('\n🌐 Open this URL to authenticate via Mittwald:');
  console.log(authUrl.toString());
  console.log('(The script will wait for the redirect on your localhost)\n');

  const { code, returnedState } = await waitForCode;
  if (returnedState !== state) {
    throw new Error(`State mismatch: expected ${state}, got ${returnedState}`);
  }
  console.log('   ✅ Authorization code received');

  // 5) Token exchange
  console.log('🔑 Exchanging code for tokens...');
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });
  const tokenRes = await fetch(`${AS_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenBody.toString(),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed: HTTP ${tokenRes.status}: ${body}`);
  }
  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token as string;
  if (!accessToken) throw new Error(`No access_token in token response: ${JSON.stringify(tokens)}`);
  console.log('   ✅ Access token obtained');

  // 6) Connect to MCP and list tools
  console.log('🔗 Connecting to MCP with Streamable HTTP...');
  const { Client, StreamableHTTPClientTransport } = await importMcpClient();
  const client = new Client({ name: 'e2e-mcp-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_BASE), {
    headers: { Authorization: `Bearer ${accessToken}` },
  } as any);
  await client.connect(transport);
  console.log('   ✅ Connected');

  console.log('🧰 Listing tools...');
  const tools = await client.listTools();
  console.log(`   Found ${tools.tools.length} tools`);

  // Cleanup
  server.close();
  await delay(100);
  console.log('\n🎉 E2E MCP + OAuth (Mittwald) flow succeeded');
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (typeof addr === 'object' && addr && 'port' in addr) {
        const port = (addr as any).port as number;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error('Failed to allocate port')));
      }
    });
    srv.on('error', reject);
  });
}

function createRedirectListener(port: number) {
  let resolver: (value: { code: string; returnedState: string }) => void;
  const waitForCode = new Promise<{ code: string; returnedState: string }>((resolve) => (resolver = resolve));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    if (url.pathname !== '/callback') {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h2>Login complete. You can close this window.</h2></body></html>');
    // Resolve after response flush
    setTimeout(() => resolver!({ code, returnedState: state }), 10);
  });
  server.listen(port, '127.0.0.1');
  return { server, waitForCode };
}

main().catch((err) => {
  console.error('❌ E2E test failed:', err?.message || err);
  process.exit(1);
});
