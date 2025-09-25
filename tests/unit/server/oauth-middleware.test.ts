import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createOAuthMiddleware } from '../../../src/server/oauth-middleware.js';
import { CONFIG } from '../../../src/server/config.js';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('../../../src/server/config.js', () => ({
  CONFIG: {
    JWT_SECRET: 'test-jwt-secret',
    OAUTH_ISSUER: 'http://localhost:8080/default'
  }
}));

const mockJwt = jwt as any;
const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  MCP_PUBLIC_BASE: process.env.MCP_PUBLIC_BASE,
  OAUTH_AS_BASE: process.env.OAUTH_AS_BASE,
};

describe('OAuth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let middleware: ReturnType<typeof createOAuthMiddleware>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OAUTH_AS_BASE = 'https://mittwald-oauth-server.fly.dev';
    delete process.env.MCP_PUBLIC_BASE;
    process.env.NODE_ENV = 'test';
    
    mockRequest = {
      headers: {},
      auth: undefined
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
    middleware = createOAuthMiddleware();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.MCP_PUBLIC_BASE = originalEnv.MCP_PUBLIC_BASE;
    process.env.OAUTH_AS_BASE = originalEnv.OAUTH_AS_BASE;
  });

  describe('Authentication Success', () => {
    it('should authenticate valid JWT token', async () => {
      // Arrange
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        aud: 'mittwald-mcp-server',
        access_token: 'oauth-access-token',
        refresh_token: 'oauth-refresh-token',
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockReturnValue(decodedToken);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(validToken, expect.any(String));
      expect(mockRequest.auth).toEqual({
        token: validToken,
        clientId: 'mittwald-mcp-server',
        scopes: ['openid', 'profile', 'user:read'],
        expiresAt: decodedToken.exp,
        extra: {
          userId: 'user-123',
          mittwaldAccessToken: undefined,
          mittwaldRefreshToken: undefined,
          issuer: undefined,
          audience: 'mittwald-mcp-server'
        }
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token without audience claim', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        client_id: 'custom-client-id',
        access_token: 'oauth-access-token',
        scope: 'openid profile',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockReturnValue(decodedToken);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.clientId).toBe('custom-client-id');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default client ID when none provided', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        access_token: 'oauth-access-token',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockReturnValue(decodedToken);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.clientId).toBe('mittwald-mcp-server');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Authentication Failures', () => {
    it('should return 401 when no Authorization header', async () => {
      mockRequest.headers = {};

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.set).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Bearer realm="MCP Server", authorization_uri="https://mittwald-oauth-server.fly.dev/auth"'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'authentication_required',
          message: 'OAuth authentication required'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification fails', async () => {
      const invalidToken = 'invalid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT_SECRET is not configured', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      // Mock missing JWT_SECRET
      const originalConfig = CONFIG.JWT_SECRET;
      (CONFIG as any).JWT_SECRET = undefined;

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // Restore original config
      (CONFIG as any).JWT_SECRET = originalConfig;
    });
  });

  describe('OAuth Challenge Response', () => {
    it('should include correct OAuth metadata in 401 response', async () => {
      mockRequest.headers = {};

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'authentication_required',
          message: 'OAuth authentication required',
          oauth: expect.objectContaining({
            authorization_url: 'https://mittwald-oauth-server.fly.dev/auth',
            token_url: 'https://mittwald-oauth-server.fly.dev/token'
          }),
          endpoints: {
            authorize: 'https://mittwald-oauth-server.fly.dev/auth',
            token: 'https://mittwald-oauth-server.fly.dev/token',
            metadata: 'https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server'
          },
          resource: 'https://localhost:3000/mcp'
        })
      );
    });

    it('should use MCP_PUBLIC_BASE when provided in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MCP_PUBLIC_BASE = 'https://example.com';

      mockRequest.headers = {};

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: 'https://example.com/mcp'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      // Mock unexpected error
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle JWT verification throwing non-Error objects', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Parsing', () => {
    it('should handle missing scopes in token', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        aud: 'mittwald-mcp-server',
        access_token: 'oauth-access-token',
        exp: Math.floor(Date.now() / 1000) + 3600
        // No scope field
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockReturnValue(decodedToken);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.scopes).toEqual([]);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should parse scopes correctly', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        aud: 'mittwald-mcp-server',
        access_token: 'oauth-access-token',
        scope: 'openid profile user:read customer:write',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwt.verify.mockReturnValue(decodedToken);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.scopes).toEqual(['openid', 'profile', 'user:read', 'customer:write']);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
