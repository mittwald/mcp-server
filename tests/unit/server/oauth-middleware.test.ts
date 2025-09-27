import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { createOAuthMiddleware } from '../../../src/server/oauth-middleware.js';
import { CONFIG } from '../../../src/server/config.js';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));
vi.mock('../../../src/server/config.js', () => ({
  CONFIG: {
    JWT_SECRET: 'test-jwt-secret',
    OAUTH_BRIDGE: {
      JWT_SECRET: 'test-jwt-secret',
      ISSUER: 'https://bridge.example.com'
    },
    OAUTH_ISSUER: 'http://localhost:8080/default',
    MITTWALD: {
      TOKEN_URL: 'https://mittwald.example.com/oauth/token',
      CLIENT_ID: 'mittwald-client',
      CLIENT_SECRET: 'mittwald-secret'
    }
  }
}));

const mockJwtVerify = vi.mocked(jwtVerify);
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
    mockJwtVerify.mockReset();
    process.env.OAUTH_AS_BASE = 'https://mittwald-oauth-bridge.fly.dev';
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
      const issuedAt = 1_700_000_000;
      const expiresIn = 3600;
      const decodedToken = {
        sub: 'user-123',
        aud: 'mittwald-mcp-server',
        scope: 'openid profile user:read',
        exp: issuedAt + expiresIn,
        iat: issuedAt,
        iss: 'https://bridge.example.com',
        mittwald: {
          access_token: 'oauth-access-token',
          refresh_token: 'oauth-refresh-token',
          scope: 'openid profile user:read',
          expires_in: expiresIn,
        }
      } as any;

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwtVerify.mockResolvedValue({ payload: decodedToken });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwtVerify).toHaveBeenCalledWith(
        validToken,
        expect.any(Uint8Array),
        expect.objectContaining({ issuer: 'https://bridge.example.com' })
      );
      expect(mockRequest.auth).toEqual(expect.objectContaining({
        token: validToken,
        clientId: 'mittwald-mcp-server',
        scopes: ['openid', 'profile', 'user:read'],
        expiresAt: decodedToken.exp,
        extra: expect.objectContaining({
          userId: 'user-123',
          mittwaldAccessToken: 'oauth-access-token',
          mittwaldRefreshToken: 'oauth-refresh-token',
          mittwaldScope: 'openid profile user:read',
          mittwaldScopeSource: 'mittwald',
          mittwaldRequestedScope: 'openid profile user:read',
          issuer: 'https://bridge.example.com',
          audience: 'mittwald-mcp-server',
          resource: undefined,
          mittwaldAccessTokenExpiresAt: decodedToken.exp,
          mittwaldRefreshTokenExpiresAt: undefined,
          mittwaldIssuedAt: issuedAt,
          mittwaldExpiresIn: expiresIn,
        })
      }));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token without audience claim', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        client_id: 'custom-client-id',
        scope: 'openid profile',
        exp: Math.floor(Date.now() / 1000) + 3600,
        mittwald: {
          access_token: 'oauth-access-token'
        }
      } as any;

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwtVerify.mockResolvedValue({ payload: decodedToken });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.clientId).toBe('custom-client-id');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default client ID when none provided', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600
      } as any;

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwtVerify.mockResolvedValue({ payload: decodedToken });

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
        'Bearer realm="MCP Server", authorization_uri="https://mittwald-oauth-bridge.fly.dev/authorize"'
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

      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

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
      const originalConfig = CONFIG.OAUTH_BRIDGE.JWT_SECRET;
      (CONFIG as any).OAUTH_BRIDGE.JWT_SECRET = '';
      (CONFIG as any).JWT_SECRET = '';

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // Restore original config
      (CONFIG as any).OAUTH_BRIDGE.JWT_SECRET = originalConfig;
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
            authorization_url: 'https://mittwald-oauth-bridge.fly.dev/authorize',
            token_url: 'https://mittwald-oauth-bridge.fly.dev/token'
          }),
        endpoints: {
          authorize: 'https://mittwald-oauth-bridge.fly.dev/authorize',
          token: 'https://mittwald-oauth-bridge.fly.dev/token',
          metadata: 'https://mittwald-oauth-bridge.fly.dev/.well-known/oauth-authorization-server'
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
      mockJwtVerify.mockRejectedValue(new Error('Unexpected error'));

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

      mockJwtVerify.mockRejectedValue('String error');

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
        exp: Math.floor(Date.now() / 1000) + 3600
      } as any;

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwtVerify.mockResolvedValue({ payload: decodedToken });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.scopes).toEqual([]);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should parse scopes correctly', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        aud: 'mittwald-mcp-server',
        scope: 'openid profile user:read customer:write',
        exp: Math.floor(Date.now() / 1000) + 3600
      } as any;

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      mockJwtVerify.mockResolvedValue({ payload: decodedToken });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.auth?.scopes).toEqual(['openid', 'profile', 'user:read', 'customer:write']);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
