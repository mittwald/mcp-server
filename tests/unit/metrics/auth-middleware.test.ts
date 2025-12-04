import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Helper to create mock Express request
function createMockRequest(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

// Helper to create mock Express response
function createMockResponse(): Partial<Response> & { statusCode: number; body: string } {
  const res = {
    statusCode: 0,
    body: '',
    status: vi.fn().mockImplementation(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockImplementation(function (this: any, body: string) {
      this.body = body;
      return this;
    }),
  };
  return res as any;
}

describe('MCP Server Metrics Auth Middleware (Express)', () => {
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
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(0); // Status not set = allowed to proceed
    });
  });

  describe('when auth is configured', () => {
    beforeEach(() => {
      process.env.METRICS_USER = 'testuser';
      process.env.METRICS_PASS = 'testpass';
    });

    it('should return 401 without credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(res.statusCode).toBe(401);
      expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="metrics"');
      expect(res.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const invalidAuth = Buffer.from('wrong:wrong').toString('base64');
      const req = createMockRequest(`Basic ${invalidAuth}`);
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with malformed base64', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const req = createMockRequest('Basic !!!invalid-base64!!!');
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with missing colon in credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const noColon = Buffer.from('nocolon').toString('base64');
      const req = createMockRequest(`Basic ${noColon}`);
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(res.statusCode).toBe(401);
      expect(res.body).toBe('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access with valid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const validAuth = Buffer.from('testuser:testpass').toString('base64');
      const req = createMockRequest(`Basic ${validAuth}`);
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(0); // Status not set = allowed to proceed
    });

    it('should handle password with colon', async () => {
      process.env.METRICS_PASS = 'pass:with:colons';
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const validAuth = Buffer.from('testuser:pass:with:colons').toString('base64');
      const req = createMockRequest(`Basic ${validAuth}`);
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should reject non-Basic auth schemes', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware.js');
      const req = createMockRequest('Bearer some-token');
      const res = createMockResponse();
      const next = vi.fn();

      metricsAuth(req as Request, res as Response, next as NextFunction);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
