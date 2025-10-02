import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleVolumeCreateCli } from '../../../src/handlers/tools/mittwald-cli/volume/create-cli.js';
import { handleVolumeListCli } from '../../../src/handlers/tools/mittwald-cli/volume/list-cli.js';
import { handleVolumeDeleteCli } from '../../../src/handlers/tools/mittwald-cli/volume/delete-cli.js';

vi.mock('../../../src/tools/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/tools/index.js')>(
    '../../../src/tools/index.js'
  );

  return {
    ...actual,
    invokeCliTool: vi.fn(),
  };
});

const { invokeCliTool } = await import('../../../src/tools/index.js');
const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<any, any>;

function parseResponse(payload: Awaited<ReturnType<typeof handleVolumeCreateCli>> | Awaited<ReturnType<typeof handleVolumeListCli>> | Awaited<ReturnType<typeof handleVolumeDeleteCli>>) {
  const { content } = payload;
  const text = content?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

describe('Volume management tool handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleVolumeCreateCli', () => {
    it('creates a volume and reports success', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'app-volume\n', stderr: '' },
        meta: { command: 'mw volume create app-volume', exitCode: 0, durationMs: 12 },
      });

      const response = await handleVolumeCreateCli({ projectId: 'p-12345', name: 'app-volume', quiet: true });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.volume.name).toBe('app-volume');
      expect(payload.data.volume.projectId).toBe('p-12345');
      expect(mockInvokeCliTool).toHaveBeenCalledWith({
        toolName: 'mittwald_volume_create',
        argv: ['volume', 'create', 'app-volume', '--project-id', 'p-12345', '--quiet'],
        parser: expect.any(Function),
      });
    });

    it('rejects invalid volume names before hitting the CLI', async () => {
      const response = await handleVolumeCreateCli({ projectId: 'p-12345', name: 'INVALID_NAME' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Invalid volume name/i);
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });

    it('maps CLI errors to descriptive messages', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Volume already exists', {
          kind: 'EXECUTION',
          stderr: 'Volume "app-volume" already exists',
        })
      );

      const response = await handleVolumeCreateCli({ projectId: 'p-12345', name: 'app-volume' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/already exists/);
    });
  });

  describe('handleVolumeListCli', () => {
    it('returns formatted volume data and table', async () => {
      const volumes = [
        {
          id: 'vol-1',
          name: 'app-volume',
          stackId: 'p-12345',
          linkedServices: [{ id: 'c-1', name: 'web' }],
          storageUsageInBytes: 1073741824,
          storageUsageInBytesSetAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: {
          stdout: JSON.stringify(volumes),
          stderr: '',
        },
        meta: { command: 'mw volume list', exitCode: 0, durationMs: 14 },
      });

      const response = await handleVolumeListCli({ projectId: 'p-12345' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.volumes).toHaveLength(1);
      expect(payload.data.volumes[0].name).toBe('app-volume');
      expect(payload.data.table).toContain('app-volume');
    });

    it('handles an empty volume list', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: '[]', stderr: '' },
        meta: { command: 'mw volume list', exitCode: 0, durationMs: 9 },
      });

      const response = await handleVolumeListCli({ projectId: 'p-empty' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.message).toMatch(/No volumes/);
    });

    it('falls back to raw output when parsing fails', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'not-json', stderr: '' },
        meta: { command: 'mw volume list', exitCode: 0, durationMs: 7 },
      });

      const response = await handleVolumeListCli({ projectId: 'p-parse' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.rawOutput).toBe('not-json');
    });
  });

  describe('handleVolumeDeleteCli', () => {
    it('deletes an unmounted volume successfully', async () => {
      mockInvokeCliTool
        .mockResolvedValueOnce({
          ok: true,
          result: JSON.stringify([
            {
              id: 'vol-1',
              name: 'app-volume',
              linkedServices: [],
              orphaned: false,
            },
          ]),
          meta: { command: 'mw volume list', exitCode: 0, durationMs: 11 },
        })
        .mockResolvedValueOnce({
          ok: true,
          result: { stdout: 'app-volume\n', stderr: '' },
          meta: { command: 'mw volume delete', exitCode: 0, durationMs: 10 },
        });

      const response = await handleVolumeDeleteCli({ projectId: 'p-12345', volumeId: 'app-volume', quiet: true });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.volume.force).toBe(false);
      expect(payload.data.volume.name).toBe('app-volume');
      expect(mockInvokeCliTool).toHaveBeenNthCalledWith(1, {
        toolName: 'mittwald_volume_list',
        argv: ['volume', 'list', '--project-id', 'p-12345', '--output', 'json'],
      });
      expect(mockInvokeCliTool).toHaveBeenNthCalledWith(2, {
        toolName: 'mittwald_volume_delete',
        argv: ['volume', 'delete', 'app-volume', '--project-id', 'p-12345', '--quiet'],
        parser: expect.any(Function),
      });
    });

    it('warns when attempting to delete a mounted volume without force', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: JSON.stringify([
          {
            id: 'vol-1',
            name: 'app-volume',
            linkedServices: [{ id: 'c-1', name: 'web' }],
            orphaned: false,
          },
        ]),
        meta: { command: 'mw volume list', exitCode: 0, durationMs: 8 },
      });

      const response = await handleVolumeDeleteCli({ projectId: 'p-12345', volumeId: 'app-volume' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/mounted/);
      expect(mockInvokeCliTool).toHaveBeenCalledTimes(1);
    });

    it('rejects volume identifiers with invalid characters', async () => {
      const response = await handleVolumeDeleteCli({ projectId: 'p-12345', volumeId: 'INVALID!' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Invalid volume identifier/);
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });

    it('maps CLI errors when deletion fails', async () => {
      mockInvokeCliTool
        .mockResolvedValueOnce({
          ok: true,
          result: JSON.stringify([
            {
              id: 'vol-1',
              name: 'app-volume',
              linkedServices: [],
              orphaned: false,
            },
          ]),
          meta: { command: 'mw volume list', exitCode: 0, durationMs: 11 },
        })
        .mockRejectedValueOnce(
          new CliToolError('Forbidden', {
            kind: 'EXECUTION',
            stderr: 'Volume "app-volume" does not exist',
          })
        );

      const response = await handleVolumeDeleteCli({ projectId: 'p-12345', volumeId: 'app-volume', force: true });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/not found/);
    });
  });
});
