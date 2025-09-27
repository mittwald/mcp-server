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

export const OAUTH_SERVER = process.env.OAUTH_SERVER_URL?.trim() || 'https://mittwald-oauth-bridge.fly.dev';
export const MCP_SERVER = process.env.MCP_SERVER_URL?.trim() || 'https://mittwald-mcp-fly2.fly.dev';

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
