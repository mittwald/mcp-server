import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

type RateLimitKeyType = 'user' | 'client' | 'session' | 'ip' | 'unknown';

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveRateLimitKey(req: Request): { key: string; keyType: RateLimitKeyType } {
  const authInfo = (req as Request & { auth?: AuthInfo }).auth;

  const userId = authInfo?.extra && typeof authInfo.extra.userId === 'string'
    ? authInfo.extra.userId
    : undefined;
  if (userId) {
    return { key: `user:${userId}`, keyType: 'user' };
  }

  const clientId = typeof authInfo?.clientId === 'string' ? authInfo.clientId : undefined;
  if (clientId) {
    return { key: `client:${clientId}`, keyType: 'client' };
  }

  const sessionId =
    normalizeHeaderValue(req.headers['mcp-session-id'] as string | string[] | undefined) ||
    normalizeHeaderValue(req.headers['x-session-id'] as string | string[] | undefined);
  if (sessionId) {
    return { key: `session:${sessionId}`, keyType: 'session' };
  }

  const flyClientIp = normalizeHeaderValue(req.headers['fly-client-ip'] as string | string[] | undefined);
  const clientIp = flyClientIp || req.ip || req.connection.remoteAddress;
  if (clientIp) {
    return { key: `ip:${clientIp}`, keyType: 'ip' };
  }

  return { key: 'unknown', keyType: 'unknown' };
}

/**
 * Rate limiting middleware for MCP endpoints
 */
export function rateLimitMiddleware(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { key, keyType } = resolveRateLimitKey(req);
    const now = Date.now();
    
    // Get or create rate limit data
    let rateData = requestCounts.get(key);
    if (!rateData || now > rateData.resetTime) {
      rateData = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, rateData);
    }
    
    // Check rate limit
    if (rateData.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { keyType, key, count: rateData.count });
      res.setHeader('Retry-After', Math.ceil((rateData.resetTime - now) / 1000));
      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Too many requests',
          data: { retryAfter: Math.ceil((rateData.resetTime - now) / 1000) },
        },
        id: null,
      });
      return;
    }
    
    rateData.count++;
    next();
  };
}

/**
 * Validate MCP protocol version
 */
export function validateProtocolVersion(req: Request, res: Response, next: NextFunction): void {
  const version = req.headers['mcp-protocol-version'];
  
  // If no version header, continue (backwards compatibility)
  if (!version) {
    next();
    return;
  }
  
  // Check supported versions
  const supportedVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
  if (!supportedVersions.includes(version as string)) {
    logger.warn('Unsupported protocol version', { version });
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Unsupported protocol version',
        data: { supported: supportedVersions, requested: version },
      },
      id: null,
    });
    return;
  }
  
  next();
}

/**
 * Request size limit middleware
 */
export function requestSizeLimit(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      logger.warn('Request too large', { size: contentLength, maxSize });
      res.status(413).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Request entity too large',
          data: { maxSize, received: contentLength },
        },
        id: null,
      });
      return;
    }
    
    next();
  };
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
