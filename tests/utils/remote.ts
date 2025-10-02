import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 7000;

export const REQUEST_TIMEOUT_MS = (() => {
  const raw = process.env.OAUTH_REMOTE_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : DEFAULT_TIMEOUT_MS;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
})();

axios.defaults.timeout = REQUEST_TIMEOUT_MS;

const DEFAULT_BRIDGE_URL = 'https://mittwald-oauth-server.fly.dev';
const DEFAULT_MCP_URL = 'https://mittwald-mcp-fly2.fly.dev';

let bridgeBaseUrl = process.env.BRIDGE_BASE_URL?.trim()
  || process.env.OAUTH_SERVER_URL?.trim()
  || DEFAULT_BRIDGE_URL;

let mcpBaseUrl = process.env.MCP_BASE_URL?.trim()
  || process.env.MCP_SERVER_URL?.trim()
  || DEFAULT_MCP_URL;

export function setBridgeBaseUrl(url: string) {
  bridgeBaseUrl = url;
}

export function setMcpBaseUrl(url: string) {
  mcpBaseUrl = url;
}

export function getBridgeBaseUrl(): string {
  return bridgeBaseUrl;
}

export function getMcpBaseUrl(): string {
  return mcpBaseUrl;
}

export function getOAuthServerBaseUrl(): string {
  return bridgeBaseUrl;
}

export function getMcpServerBaseUrl(): string {
  return mcpBaseUrl;
}

const SKIPPABLE_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ECONNABORTED',
]);

interface SkipResult {
  skip: boolean;
  code?: string;
}

export function shouldSkipNetworkError(error: unknown): SkipResult {
  if (!error) return { skip: false };

  const anyError = error as { code?: string; cause?: { code?: string }; message?: string };
  const axiosError = axios.isAxiosError(error) ? error : null;
  const code = anyError.code || anyError.cause?.code || axiosError?.code;

  if (code && SKIPPABLE_ERROR_CODES.has(code)) {
    return { skip: true, code };
  }

  if (axiosError && !axiosError.response) {
    return { skip: true, code: code || 'NO_RESPONSE' };
  }

  if (axiosError?.message?.toLowerCase().includes('timeout')) {
    return { skip: true, code: code || 'TIMEOUT' };
  }

  return { skip: false, code };
}

export async function safeRequest<T>(fn: () => Promise<T>, skipMessage: string): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const { skip, code } = shouldSkipNetworkError(error);
    if (skip) {
      console.warn(`${skipMessage} (code=${code ?? 'unknown'})`);
      return null;
    }
    throw error;
  }
}

export function configureRemoteSuiteTimeout(): number {
  const raw = process.env.OAUTH_REMOTE_SUITE_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : 20000;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 20000;
}

interface HealthTarget {
  url: string;
  label?: string;
  expectedStatus?: (status: number) => boolean;
}

interface HealthOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

export async function waitForHealthEndpoints(targets: HealthTarget[], options: HealthOptions = {}): Promise<void> {
  for (const target of targets) {
    await pollHealth(target, options);
  }
}

export async function waitForBridgeStack(options: HealthOptions = {}): Promise<void> {
  const bridgeHealthUrl = new URL('/health', bridgeBaseUrl).toString();
  const mcpHealthUrl = new URL('/health', mcpBaseUrl).toString();

  await waitForHealthEndpoints([
    { url: bridgeHealthUrl, label: 'oauth-bridge' },
    { url: mcpHealthUrl, label: 'mcp-server' }
  ], options);
}

async function pollHealth(target: HealthTarget, options: HealthOptions): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const intervalMs = options.intervalMs ?? 500;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      const response = await axios.get(target.url, { validateStatus: () => true });
      const statusOk = target.expectedStatus
        ? target.expectedStatus(response.status)
        : response.status >= 200 && response.status < 300;
      if (statusOk) {
        return;
      }
      lastError = new Error(`Unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(intervalMs);
  }

  const label = target.label ?? target.url;
  const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
  throw new Error(`Timed out waiting for ${label} health at ${target.url}: ${message}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
