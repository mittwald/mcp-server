/**
 * @file Tests for Mittwald Backup API handlers
 * @module handlers/tools/mittwald/ssh-backup/__tests__/backups.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleListBackups, handleCreateBackup } from '../backups.js';
import { getMittwaldClient } from '../../../../../services/mittwald/index.js';

// Mock the Mittwald client
vi.mock('../../../../../services/mittwald/index.js');

const mockClient = {
  api: {
    backup: {
      listProjectBackups: vi.fn(),
      createProjectBackup: vi.fn(),
    },
  },
};

describe('Backup Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getMittwaldClient as any).mockReturnValue(mockClient);
  });

  describe('handleListBackups', () => {
    it('should successfully list project backups', async () => {
      const mockResponse = {
        status: 200,
        data: [
          {
            id: 'backup-123',
            projectId: 'project-456',
            description: 'Test Backup',
            status: 'Completed',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.api.backup.listProjectBackups.mockResolvedValue(mockResponse);

      const result = await handleListBackups({
        projectId: 'project-456',
        sort: 'newestFirst',
      });

      expect(result.content[0].text).toContain('Successfully retrieved project backups');
      expect(mockClient.api.backup.listProjectBackups).toHaveBeenCalledWith({
        projectId: 'project-456',
        queryParameters: { sort: 'newestFirst' },
      });
    });

    it('should handle API errors', async () => {
      mockClient.api.backup.listProjectBackups.mockResolvedValue({
        status: 404,
        data: null,
      });

      const result = await handleListBackups({ projectId: 'project-456' });

      expect(result.content[0].text).toContain('Failed to list backups');
    });
  });

  describe('handleCreateBackup', () => {
    it('should successfully create project backup', async () => {
      const mockResponse = {
        status: 201,
        data: {
          id: 'backup-789',
          projectId: 'project-456',
          description: 'New Backup',
          status: 'Pending',
        },
      };

      mockClient.api.backup.createProjectBackup.mockResolvedValue(mockResponse);

      const result = await handleCreateBackup({
        projectId: 'project-456',
        description: 'New Backup',
      });

      expect(result.content[0].text).toContain('Successfully created project backup');
      expect(mockClient.api.backup.createProjectBackup).toHaveBeenCalledWith({
        projectId: 'project-456',
        data: { description: 'New Backup' },
      });
    });
  });
});