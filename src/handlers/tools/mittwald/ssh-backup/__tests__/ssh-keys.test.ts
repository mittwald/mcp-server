/**
 * @file Tests for Mittwald SSH Keys API handlers
 * @module handlers/tools/mittwald/ssh-backup/__tests__/ssh-keys.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleListSshKeys, handleDeleteSshKey, handleUpdateSshKey } from '../ssh-keys.js';
import { getMittwaldClient } from '../../../../../services/mittwald/index.js';

// Mock the Mittwald client
vi.mock('../../../../../services/mittwald/index.js');

const mockClient = {
  api: {
    user: {
      listSshKeys: vi.fn(),
      deleteSshKey: vi.fn(),
    },
  },
};

describe('SSH Keys Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getMittwaldClient as any).mockReturnValue(mockClient);
  });

  describe('handleListSshKeys', () => {
    it('should successfully list SSH keys', async () => {
      const mockResponse = {
        status: 200,
        data: {
          sshKeys: [
            {
              id: 'key-123',
              label: 'Test Key',
              publicKey: 'ssh-rsa AAAAB3...',
              fingerprint: '00:11:22:33',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      mockClient.api.user.listSshKeys.mockResolvedValue(mockResponse);

      const result = await handleListSshKeys({});

      expect(result.content[0].text).toContain('Successfully retrieved SSH keys');
      expect(mockClient.api.user.listSshKeys).toHaveBeenCalledWith();
    });

    it('should handle API errors', async () => {
      mockClient.api.user.listSshKeys.mockResolvedValue({
        status: 500,
        data: null,
      });

      const result = await handleListSshKeys({});

      expect(result.content[0].text).toContain('Failed to list SSH keys');
    });
  });

  describe('handleDeleteSshKey', () => {
    it('should successfully delete SSH key', async () => {
      mockClient.api.user.deleteSshKey.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await handleDeleteSshKey({ sshKeyId: 'key-123' });

      expect(result.content[0].text).toContain('Successfully deleted SSH key');
      expect(mockClient.api.user.deleteSshKey).toHaveBeenCalledWith({ sshKeyId: 'key-123' });
    });
  });

  describe('handleUpdateSshKey', () => {
    it('should return not supported error', async () => {
      const result = await handleUpdateSshKey({ 
        sshKeyId: 'key-123', 
        label: 'New Label' 
      });

      expect(result.content[0].text).toContain('SSH key updates are not supported');
    });
  });
});