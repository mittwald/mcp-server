import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMittwaldAppList, handleMittwaldAppGet } from '../app-management.js';
import type { ToolHandlerContext } from '../../../types.js';

// Mock the Mittwald client
const mockMittwaldClient = {
  api: {
    app: {
      listApps: vi.fn(),
      getApp: vi.fn(),
    }
  }
};

const mockContext: ToolHandlerContext = {
  redditService: {} as any,
  mittwaldClient: mockMittwaldClient as any,
  userId: 'test-user',
  sessionId: 'test-session'
};

describe('App Management Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleMittwaldAppList', () => {
    it('should successfully list apps', async () => {
      const mockApps = [
        { id: 'app-1', name: 'WordPress', tags: ['cms'] },
        { id: 'app-2', name: 'Node.js', tags: ['runtime'] }
      ];

      mockMittwaldClient.api.app.listApps.mockResolvedValue({
        status: 200,
        data: mockApps
      });

      const result = await handleMittwaldAppList({ limit: 10, skip: 0 }, mockContext);

      expect(mockMittwaldClient.api.app.listApps).toHaveBeenCalledWith({
        queryParameters: { limit: 10, skip: 0 }
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.status).toBe('success');
      expect(parsedResult.result.apps).toEqual(mockApps);
      expect(parsedResult.result.pagination.total).toBe(2);
    });

    it('should handle API errors', async () => {
      mockMittwaldClient.api.app.listApps.mockResolvedValue({
        status: 500,
        data: null
      });

      const result = await handleMittwaldAppList({ limit: 10, skip: 0 }, mockContext);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.status).toBe('error');
      expect(parsedResult.message).toContain('Failed to list apps');
    });

    it('should handle missing Mittwald client', async () => {
      const contextWithoutClient = { ...mockContext, mittwaldClient: undefined };

      const result = await handleMittwaldAppList({ limit: 10, skip: 0 }, contextWithoutClient);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.status).toBe('error');
      expect(parsedResult.message).toContain('Mittwald client not initialized');
    });
  });

  describe('handleMittwaldAppGet', () => {
    it('should successfully get app details', async () => {
      const mockApp = {
        id: 'app-1',
        name: 'WordPress',
        tags: ['cms'],
        actionCapabilities: ['start', 'stop', 'restart']
      };

      mockMittwaldClient.api.app.getApp.mockResolvedValue({
        status: 200,
        data: mockApp
      });

      const result = await handleMittwaldAppGet({ appId: 'app-1' }, mockContext);

      expect(mockMittwaldClient.api.app.getApp).toHaveBeenCalledWith({
        appId: 'app-1'
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.status).toBe('success');
      expect(parsedResult.result.app).toEqual(mockApp);
    });

    it('should require appId parameter', async () => {
      const result = await handleMittwaldAppGet({ appId: '' }, mockContext);

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.status).toBe('error');
      expect(parsedResult.message).toContain('App ID is required');
    });
  });
});