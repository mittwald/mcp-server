import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Context, Next } from 'koa';

// Helper to create mock Koa context
function createMockContext(authHeader?: string): Partial<Context> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    status: 0,
    body: undefined,
    set: vi.fn(),
  };
}

describe('OAuth Bridge Metrics Auth Middleware (Koa)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset module cache to pick up env var changes
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('when auth is not configured', () => {
    beforeEach(() => {
      delete process.env.METRICS_USER;
      delete process.env.METRICS_PASS;
    });

    it('should allow access without credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const ctx = createMockContext();
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(next).toHaveBeenCalled();
      expect(ctx.status).toBe(0); // Status not set = allowed to proceed
    });
  });

  describe('when auth is configured', () => {
    beforeEach(() => {
      process.env.METRICS_USER = 'testuser';
      process.env.METRICS_PASS = 'testpass';
    });

    it('should return 401 without credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const ctx = createMockContext();
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(ctx.status).toBe(401);
      expect(ctx.set).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="metrics"');
      expect(ctx.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const invalidAuth = Buffer.from('wrong:wrong').toString('base64');
      const ctx = createMockContext(`Basic ${invalidAuth}`);
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(ctx.status).toBe(401);
      expect(ctx.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with malformed base64', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const ctx = createMockContext('Basic !!!invalid-base64!!!');
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(ctx.status).toBe(401);
      expect(ctx.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with missing colon in credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const noColon = Buffer.from('nocolon').toString('base64');
      const ctx = createMockContext(`Basic ${noColon}`);
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(ctx.status).toBe(401);
      expect(ctx.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access with valid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const validAuth = Buffer.from('testuser:testpass').toString('base64');
      const ctx = createMockContext(`Basic ${validAuth}`);
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(next).toHaveBeenCalled();
      expect(ctx.status).toBe(0); // Status not set = allowed to proceed
    });

    it('should handle password with colon', async () => {
      process.env.METRICS_PASS = 'pass:with:colons';
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const validAuth = Buffer.from('testuser:pass:with:colons').toString('base64');
      const ctx = createMockContext(`Basic ${validAuth}`);
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject non-Basic auth schemes', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const ctx = createMockContext('Bearer some-token');
      const next = vi.fn();

      await metricsAuth(ctx as Context, next as Next);

      expect(ctx.status).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
