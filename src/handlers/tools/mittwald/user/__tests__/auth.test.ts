/**
 * @file Tests for Mittwald User Authentication handlers
 * @module handlers/tools/mittwald/user/__tests__/auth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  handleAuthenticate, 
  handleAuthenticateMfa, 
  handleCheckToken 
} from '../auth.js';
import { getMittwaldClient } from '../../../../../services/mittwald/index.js';

// Mock the Mittwald client
vi.mock('../../../../../services/mittwald/index.js', () => ({
  getMittwaldClient: vi.fn()
}));

describe('Authentication Handlers', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      api: {
        user: {
          authenticate: vi.fn(),
          authenticateMfa: vi.fn(),
          getOwnEmail: vi.fn(),
          getSelf: vi.fn()
        }
      }
    };
    (getMittwaldClient as any).mockReturnValue(mockClient);
  });

  describe('handleAuthenticate', () => {
    it('should successfully authenticate with email and password', async () => {
      const mockResponse = {
        status: 200,
        data: {
          token: 'test-token',
          expiresAt: '2024-12-31T23:59:59Z'
        }
      };
      mockClient.api.user.authenticate.mockResolvedValue(mockResponse);

      const result = await handleAuthenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(mockClient.api.user.authenticate).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('success');
      expect(content.result.token).toBe('test-token');
      expect(content.result.requiresMfa).toBe(false);
    });

    it('should handle MFA requirement', async () => {
      const mockResponse = {
        status: 202,
        data: {
          authenticationToken: 'mfa-token'
        }
      };
      mockClient.api.user.authenticate.mockResolvedValue(mockResponse);

      const result = await handleAuthenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('success');
      expect(content.result.requiresMfa).toBe(true);
      expect(content.result.authenticationToken).toBe('mfa-token');
    });

    it('should handle authentication errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.response = {
        status: 401,
        data: { message: 'Invalid email or password' }
      };
      mockClient.api.user.authenticate.mockRejectedValue(mockError);

      const result = await handleAuthenticate({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('error');
      expect(content.message).toContain('Authentication failed');
      expect(content.error.type).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('handleAuthenticateMfa', () => {
    it('should successfully complete MFA authentication', async () => {
      const mockResponse = {
        status: 200,
        data: {
          token: 'final-token',
          expiresAt: '2024-12-31T23:59:59Z'
        }
      };
      mockClient.api.user.authenticateMfa.mockResolvedValue(mockResponse);

      const result = await handleAuthenticateMfa({
        authenticationToken: 'mfa-token',
        multiFactorCode: '123456'
      });

      expect(mockClient.api.user.authenticateMfa).toHaveBeenCalledWith({
        data: {
          authenticationToken: 'mfa-token',
          multiFactorCode: '123456'
        }
      });

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('success');
      expect(content.result.token).toBe('final-token');
    });
  });

  describe('handleCheckToken', () => {
    it('should successfully validate token', async () => {
      mockClient.api.user.getOwnEmail.mockResolvedValue({
        status: 200,
        data: { email: 'test@example.com' }
      });
      mockClient.api.user.getSelf.mockResolvedValue({
        status: 200,
        data: { 
          userId: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const result = await handleCheckToken();

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('success');
      expect(content.result.valid).toBe(true);
      expect(content.result.email).toBe('test@example.com');
      expect(content.result.user.userId).toBe('user-123');
    });

    it('should handle invalid token', async () => {
      const mockError = new Error('Unauthorized');
      mockError.response = {
        status: 401,
        data: { message: 'Token expired' }
      };
      mockClient.api.user.getOwnEmail.mockRejectedValue(mockError);

      const result = await handleCheckToken();

      const content = JSON.parse(result.content[0].text);
      expect(content.status).toBe('error');
      expect(content.error.code).toBe(401);
    });
  });
});