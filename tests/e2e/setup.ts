import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer, Server as NetServer } from 'node:net';
import axios from 'axios';
import { MittwaldStubServer, type StubMode } from './mittwald-stub-server.js';
import { waitForHealthEndpoints, setBridgeBaseUrl, setMcpBaseUrl } from '../utils/remote.js';

export interface E2EContext {
  projectName: string;
  bridgeBaseUrl: string;
  mcpBaseUrl: string;
  composeEnv: Record<string, string>;
  stub: MittwaldStubServer;
}

const COMPOSE_FILE = 'tests/e2e/docker-compose.test.yml';
const DEFAULT_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'http://localhost:6274/oauth/callback/debug',
  'https://chat.openai.com/aip/auth/callback'
].join(',');

export async function startE2EEnvironment(): Promise<E2EContext> {
  const projectName = `mittwald-e2e-${randomUUID().slice(0, 8)}`;
  const stub = new MittwaldStubServer();
  const stubPort = await stub.start();

  // Seed discovery endpoints once to prime responses
  await axios.get(`http://127.0.0.1:${stubPort}/.well-known/oauth-authorization-server`).catch(() => undefined);
  await axios.get(`http://127.0.0.1:${stubPort}/.well-known/oauth-protected-resource`).catch(() => undefined);

  const bridgeHostPort = await findAvailablePort();
  const mcpHostPort = await findAvailablePort();
  const bridgeInternalPort = 4000;
  const mcpInternalPort = 3000;

  const composeEnv: Record<string, string> = {
    BRIDGE_INTERNAL_PORT: String(bridgeInternalPort),
    BRIDGE_HOST_PORT: String(bridgeHostPort),
    MCP_INTERNAL_PORT: String(mcpInternalPort),
    MCP_HOST_PORT: String(mcpHostPort),
    MITTWALD_STUB_PORT: String(stubPort),
    OAUTH_BRIDGE_JWT_SECRET: 'mittwald-e2e-shared-secret',
    BRIDGE_REDIRECT_URIS: DEFAULT_REDIRECT_URIS
  };

  console.info(`🔧 mittwald-e2e env: ${JSON.stringify({
    bridgeHostPort,
    bridgeInternalPort,
    mcpHostPort,
    mcpInternalPort,
    stubPort
  })}`);

  try {
    await runDockerCompose(projectName, ['up', '--build', '--detach'], composeEnv);

    const resolvedBridge = await resolveHostPort(projectName, composeEnv, 'oauth-bridge', bridgeInternalPort);
    const resolvedMcp = await resolveHostPort(projectName, composeEnv, 'mcp-server', mcpInternalPort);

    const bridgeBaseUrl = `http://${resolvedBridge.host}:${resolvedBridge.port}`;
    const mcpBaseUrl = `http://${resolvedMcp.host}:${resolvedMcp.port}`;

    console.info(`🔌 mittwald-e2e: bridge at ${bridgeBaseUrl}, mcp at ${mcpBaseUrl}`);

    process.env.BRIDGE_BASE_URL = bridgeBaseUrl;
    process.env.OAUTH_SERVER_URL = bridgeBaseUrl;
    process.env.MCP_BASE_URL = mcpBaseUrl;
    process.env.MCP_SERVER_URL = mcpBaseUrl;

    setBridgeBaseUrl(bridgeBaseUrl);
    setMcpBaseUrl(mcpBaseUrl);

    await waitForHealthEndpoints([
      { url: `http://127.0.0.1:${stubPort}/health`, label: 'mittwald-stub' },
      { url: `${bridgeBaseUrl}/health`, label: 'oauth-bridge' },
      { url: `${mcpBaseUrl}/health`, label: 'mcp-server' }
    ], { timeoutMs: 90_000, intervalMs: 500 });

    return {
      projectName,
      bridgeBaseUrl,
      mcpBaseUrl,
      composeEnv,
      stub
    };
  } catch (error) {
    await runDockerCompose(projectName, ['down', '--volumes', '--remove-orphans'], composeEnv).catch(() => undefined);
    await stub.stop().catch(() => undefined);
    throw error;
  }
}

export async function stopE2EEnvironment(context?: E2EContext): Promise<void> {
  if (!context) {
    return;
  }

  await runDockerCompose(context.projectName, ['logs'], context.composeEnv).catch((error) => {
    console.warn(`Failed to fetch docker logs for project ${context.projectName}:`, error);
  });

  await runDockerCompose(context.projectName, ['down', '--volumes', '--remove-orphans'], context.composeEnv).catch((error) => {
    console.warn(`Failed to stop docker compose project ${context.projectName}:`, error);
  });

  await context.stub.stop().catch((error) => {
    console.warn('Failed to stop Mittwald stub server', error);
  });
}

export function setMittwaldMode(context: E2EContext, mode: StubMode) {
  context.stub.setMode(mode);
}

async function findAvailablePort(): Promise<number> {
  const server = await new Promise<NetServer>((resolve, reject) => {
    const srv = createServer();
    srv.on('error', (error: unknown) => {
      srv.close();
      reject(error);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });

  const address = server.address();
  if (!address || typeof address !== 'object') {
    server.close();
    throw new Error('Failed to allocate port');
  }
  const port = address.port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

async function runDockerCompose(projectName: string, args: string[], env: Record<string, string>): Promise<void> {
  const commandArgs = ['compose', '-f', COMPOSE_FILE, '--project-name', projectName, ...args];
  await executeDockerCompose(commandArgs, env, { captureOutput: false });
}

async function resolveHostPort(
  projectName: string,
  env: Record<string, string>,
  service: string,
  internalPort: number
): Promise<{ host: string; port: number }> {
  const commandArgs = ['compose', '-f', COMPOSE_FILE, '--project-name', projectName, 'port', service, String(internalPort)];
  const result = await executeDockerCompose(commandArgs, env, { captureOutput: true });
  if (!result.stdout.trim()) {
    throw new Error(`Failed to resolve host port for ${service}`);
  }
  const line = result.stdout.trim().split('\n')[0] ?? '';
  const match = line.match(/^(.*):(\d+)$/);
  if (!match) {
    throw new Error(`Unexpected docker compose port output for ${service}: ${line}`);
  }
  let host = match[1];
  const port = Number(match[2]);
  if (!Number.isFinite(port)) {
    throw new Error(`Invalid port resolved for ${service}: ${line}`);
  }
  if (host === '0.0.0.0' || host === '::' || host === ':::') {
    host = '127.0.0.1';
  }
  host = host.replace(/^\[(.*)\]$/, '$1');
  return { host, port };
}

async function executeDockerCompose(
  commandArgs: string[],
  env: Record<string, string>,
  options: { captureOutput: boolean }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const stdio: any = options.captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit';
    const child = spawn('docker', commandArgs, {
      env: { ...process.env, ...env, COMPOSE_DOCKER_CLI_BUILD: '1', DOCKER_BUILDKIT: '1' },
      stdio
    });

    let stdout = '';
    let stderr = '';

    if (options.captureOutput) {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (error) => reject(error));
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const message = options.captureOutput ? `${stderr || stdout}` : '';
        reject(new Error(`docker compose exited with code ${code}${message ? `: ${message}` : ''}`));
      }
    });
  });
}
