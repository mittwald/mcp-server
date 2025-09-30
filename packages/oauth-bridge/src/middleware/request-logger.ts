import type pino from 'pino';
import type Koa from 'koa';

const SENSITIVE_KEYS = new Set([
  'authorization',
  'client_secret',
  'code',
  'code_verifier',
  'registration_access_token',
  'refresh_token',
  'access_token',
  'token',
  'password'
]);

export function requestLogger(logger: pino.Logger) {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const start = Date.now();

    const requestLog = {
      method: ctx.method,
      path: ctx.path,
      query: sanitizeValue(ctx.query),
      headers: pickHeaders(ctx.headers),
      body: sanitizeValue(ctx.request.body)
    };

    logger.info(requestLog, 'incoming request');

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      logger.info({
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        duration,
        responseHeaders: pickHeaders(ctx.response.headers),
        responseBody: sanitizeValue(ctx.body)
      }, 'request completed');
    }
  };
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Buffer) {
    return '[Buffer]';
  }

  if (value && typeof (value as NodeJS.ReadableStream).pipe === 'function') {
    return '[Stream]';
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeValue(entry);
    }
  }
  return result;
}

function pickHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const allowList = [
    'user-agent',
    'content-type',
    'content-length',
    'x-forwarded-for',
    'x-real-ip',
    'fly-client-ip'
  ];

  const result: Record<string, unknown> = {};
  for (const header of allowList) {
    const value = headers[header];
    if (value) {
      result[header] = Array.isArray(value) ? value.join(',') : value;
    }
  }

  const authorization = headers['authorization'];
  if (authorization) {
    result.authorization = '[PRESENT]';
  }

  return result;
}
