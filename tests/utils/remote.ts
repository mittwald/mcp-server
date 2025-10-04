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

const DEFAULT_OAUTH_BASE = 'https://mittwald-oauth-server.fly.dev';
const DEFAULT_MCP_BASE = 'https://mittwald-mcp-fly2.fly.dev';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

let bridgeBaseUrl = normalizeBaseUrl(process.env.OAUTH_SERVER_URL?.trim() || DEFAULT_OAUTH_BASE);
let mcpBaseUrl = normalizeBaseUrl(process.env.MCP_SERVER_URL?.trim() || DEFAULT_MCP_BASE);

export let OAUTH_SERVER = bridgeBaseUrl;
export let MCP_SERVER = mcpBaseUrl;

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

export function setBridgeBaseUrl(url: string | undefined): void {
  if (!url) {
    return;
  }
  bridgeBaseUrl = normalizeBaseUrl(url);
  OAUTH_SERVER = bridgeBaseUrl;
  process.env.OAUTH_SERVER_URL = bridgeBaseUrl;
}

export function setMcpBaseUrl(url: string | undefined): void {
  if (!url) {
    return;
  }
  mcpBaseUrl = normalizeBaseUrl(url);
  MCP_SERVER = mcpBaseUrl;
  process.env.MCP_SERVER_URL = mcpBaseUrl;
}

export function getBridgeBaseUrl(): string {
  return bridgeBaseUrl;
}

export function getMcpBaseUrl(): string {
  return mcpBaseUrl;
}

interface HealthEndpoint {
  url: string;
  label: string;
}

interface HealthWaitOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

export async function waitForHealthEndpoints(
  endpoints: HealthEndpoint[],
  options: HealthWaitOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const intervalMs = options.intervalMs ?? 500;
  const deadline = Date.now() + timeoutMs;
  const pending = new Set(endpoints.map((endpoint) => endpoint.url));

  while (pending.size > 0) {
    for (const endpoint of endpoints) {
      if (!pending.has(endpoint.url)) {
        continue;
      }

      try {
        const response = await axios.get(endpoint.url, {
          validateStatus: () => true
        });
        const healthy = response.status >= 200 && response.status < 300;
        const bodyStatus = (response.data && typeof response.data === 'object' && 'status' in response.data)
          ? String(response.data.status).toLowerCase()
          : null;
        const bodyHealthy = !bodyStatus || bodyStatus === 'ok' || bodyStatus === 'healthy' || bodyStatus === 'ready';
        if (healthy && bodyHealthy) {
          pending.delete(endpoint.url);
          continue;
        }
        // Keep retrying until endpoint becomes healthy
      } catch (error) {
        const { skip, code } = shouldSkipNetworkError(error);
        if (!skip) {
          console.warn(`⚠️ Healthcheck request failed for ${endpoint.label}: ${String(code ?? error)}`);
        }
      }
    }

    if (pending.size === 0) {
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for health endpoints: ${[...pending].join(', ')}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
