import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createSessionAuthMiddleware } from '../../../src/middleware/session-auth.js';
import { sessionManager } from '../../../src/server/session-manager.js';
import { CONFIG } from '../../../src/server/config.js';

function createMockResponse(): Response {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

const mockNext: NextFunction = vi.fn();

describe('session-auth middleware', () => {
const getSessionSpy = vi.spyOn(sessionManager, 'getSession');
const originalBridgeConfig = { ...CONFIG.OAUTH_BRIDGE };

  beforeEach(() => {
    vi.clearAllMocks();
    getSessionSpy.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-123',
      mittwaldAccessToken: 'mittwald-access',
      mittwaldRefreshToken: 'mittwald-refresh',
      oauthToken: 'bridge-jwt',
      scope: 'openid profile',
      scopeSource: 'mittwald',
      requestedScope: 'openid profile',
      scopes: ['openid', 'profile'],
      resource: 'https://mittwald.example.com/mcp',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      currentContext: {},
      accessibleProjects: [],
      lastAccessed: new Date()
    });

    (CONFIG as any).OAUTH_BRIDGE = {
      ...(CONFIG.OAUTH_BRIDGE || {}),
      JWT_SECRET: 'secret',
      ISSUER: 'https://bridge.example.com'
    };
  });

  afterEach(() => {
    getSessionSpy.mockReset();
    CONFIG.OAUTH_BRIDGE = { ...originalBridgeConfig } as typeof CONFIG.OAUTH_BRIDGE;
  });

  it('attaches req.user and req.auth from session data', async () => {
    const middleware = createSessionAuthMiddleware();
    const res = createMockResponse();
    const req = {
      headers: {
        'mcp-session-id': 'session-1'
      }
    } as unknown as Request;

    await middleware(req, res, mockNext);

    expect(req.user).toEqual({
      userId: 'user-123',
      scope: 'openid profile',
      token: 'mittwald-access',
      sessionId: 'session-1'
    });

    expect(req.auth).toEqual({
      token: 'bridge-jwt',
      clientId: 'mittwald-mcp-server',
      scopes: ['openid', 'profile'],
      expiresAt: expect.any(Number),
      extra: expect.objectContaining({
        userId: 'user-123',
        mittwaldAccessToken: 'mittwald-access',
        mittwaldRefreshToken: 'mittwald-refresh',
        mittwaldScope: 'openid profile',
        mittwaldScopeSource: 'mittwald',
        mittwaldRequestedScope: 'openid profile',
        issuer: 'https://bridge.example.com',
        resource: 'https://mittwald.example.com/mcp'
      })
    });

    expect(mockNext).toHaveBeenCalled();
  });
});
