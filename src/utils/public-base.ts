const DEFAULT_LOCAL_PORT = process.env.PORT || '3000';

function getLocalBaseUrl(): string {
  const enableHttps = process.env.ENABLE_HTTPS;
  if (enableHttps === 'true') {
    return `https://localhost:${DEFAULT_LOCAL_PORT}`;
  }
  if (enableHttps === 'false') {
    return `http://localhost:${DEFAULT_LOCAL_PORT}`;
  }
  // default to https for parity with historical behaviour
  return `https://localhost:${DEFAULT_LOCAL_PORT}`;
}

function normalize(base: string): string {
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

/**
 * Resolve the public base URL for the MCP server.
 *
 * In production environments this must be provided via MCP_PUBLIC_BASE.
 * Development environments fallback to localhost respecting ENABLE_HTTPS.
 *
 * @throws if MCP_PUBLIC_BASE is missing in production
 */
export function getPublicBaseUrl(): string {
  const explicitRaw = process.env.MCP_PUBLIC_BASE;
  const explicit = explicitRaw?.trim();
  if (explicitRaw === 'undefined') {
    throw new Error('MCP_PUBLIC_BASE env is the string "undefined". Unset it or provide a real URL.');
  }
  if (explicit && explicit.toLowerCase() !== 'undefined' && explicit.toLowerCase() !== 'null') {
    return normalize(explicit);
  }

  const environment = process.env.NODE_ENV ?? 'development';
  if (environment !== 'production') {
    return normalize(getLocalBaseUrl());
  }

  throw new Error('MCP_PUBLIC_BASE must be set when NODE_ENV=\'production\'');
}
