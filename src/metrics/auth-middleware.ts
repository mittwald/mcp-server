import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';

const METRICS_USER = process.env.METRICS_USER;
const METRICS_PASS = process.env.METRICS_PASS;

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
}

/**
 * Optional Basic Auth middleware for /metrics endpoint.
 * Only enforces authentication if both METRICS_USER and METRICS_PASS are set.
 */
export function metricsAuth(req: Request, res: Response, next: NextFunction): void {
  // If no credentials configured, allow access
  if (!METRICS_USER || !METRICS_PASS) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // No auth header provided
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="metrics"')
      .send('Unauthorized');
    return;
  }

  // Decode and validate credentials
  try {
    const base64Credentials = authHeader.slice(6); // Remove 'Basic '
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const colonIndex = credentials.indexOf(':');

    if (colonIndex === -1) {
      throw new Error('Invalid credentials format');
    }

    const user = credentials.slice(0, colonIndex);
    const pass = credentials.slice(colonIndex + 1);

    if (secureCompare(user, METRICS_USER) && secureCompare(pass, METRICS_PASS)) {
      return next();
    }
  } catch {
    // Invalid base64 or format - fall through to 401
  }

  // Invalid credentials
  res.status(401)
    .set('WWW-Authenticate', 'Basic realm="metrics"')
    .send('Unauthorized');
}
