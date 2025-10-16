import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleDatabaseRedisCreateCli } from '../../../src/handlers/tools/mittwald-cli/database/redis/create-cli.js';
import { handleDatabaseRedisGetCli } from '../../../src/handlers/tools/mittwald-cli/database/redis/get-cli.js';
import { handleDatabaseRedisListCli } from '../../../src/handlers/tools/mittwald-cli/database/redis/list-cli.js';
import { handleDatabaseRedisVersionsCli } from '../../../src/handlers/tools/mittwald-cli/database/redis/versions-cli.js';
import type { CliToolResult } from '../../../src/tools/error.js';

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
const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<Promise<CliToolResult<any>>, any>;

function parseResponse(payload: unknown) {
  return JSON.parse((payload as { content: Array<{ text: string }> }).content[0]?.text ?? '{}');
}

describe('Redis database tool handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleDatabaseRedisCreateCli', () => {
    it('creates a Redis database and fetches details', async () => {
      mockInvokeCliTool
        .mockResolvedValueOnce({
          ok: true,
          result: { stdout: 'redis-db-123\n', stderr: '' },
          meta: { command: 'mw database redis create ...', exitCode: 0, durationMs: 95 },
        })
        .mockResolvedValueOnce({
          ok: true,
          result: JSON.stringify({ id: 'redis-db-123', version: '7.2', hostname: 'redis.example' }),
          meta: { command: 'mw database redis get redis-db-123 --output json', exitCode: 0, durationMs: 30 },
        });

      const response = await handleDatabaseRedisCreateCli({
        projectId: 'p-12345',
        description: 'Cache',
        version: '7.2',
        persistent: false,
        maxMemory: '512Mi',
      });

      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.redisId).toBe('redis-db-123');
      expect(payload.data.persistent).toBe(false);
      expect(payload.data.details).toEqual({ id: 'redis-db-123', version: '7.2', hostname: 'redis.example' });

      const firstCall = mockInvokeCliTool.mock.calls[0]?.[0];
      expect(firstCall?.argv).toEqual([
        'database',
        'redis',
        'create',
        '--project-id',
        'p-12345',
        '--description',
        'Cache',
        '--version',
        '7.2',
        '--no-persistent',
        '--max-memory',
        '512Mi',
        '--quiet',
      ]);
    });

    it('maps project not found errors', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Project not found', {
          kind: 'EXECUTION',
          stderr: 'Error: project p-missing not found',
          stdout: '',
        })
      );

      const response = await handleDatabaseRedisCreateCli({
        projectId: 'p-missing',
        description: 'Cache',
        version: '7.2',
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Project not found/);
    });
  });

  describe('handleDatabaseRedisGetCli', () => {
    it('parses JSON output from CLI', async () => {
      const details = { id: 'redis-db-123', version: '7.2', configuration: { persistent: true } };
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: JSON.stringify(details), stderr: '' },
        meta: { command: 'mw database redis get redis-db-123 --output json', exitCode: 0, durationMs: 12 },
      });

      const response = await handleDatabaseRedisGetCli({ redisId: 'redis-db-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.database).toEqual(details);
    });
  });

  describe('handleDatabaseRedisListCli', () => {
    it('returns Redis databases for a project', async () => {
      const cliOutput = JSON.stringify([
        { id: 'redis-db-1', name: 'cache-1', version: '7.0', configuration: { persistent: true }, status: 'ready' },
        { id: 'redis-db-2', name: 'cache-2', version: '6.2', configuration: { persistent: false }, status: 'ready' },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: cliOutput, stderr: '' },
        meta: { command: 'mw database redis list --project-id p-123 --output json', exitCode: 0, durationMs: 20 },
      });

      const response = await handleDatabaseRedisListCli({ projectId: 'p-123', outputFormat: 'json' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.databases).toHaveLength(2);
      expect(payload.data.databases?.[0]).toMatchObject({ id: 'redis-db-1', persistent: true, version: '7.0' });
    });
  });

  describe('handleDatabaseRedisVersionsCli', () => {
    it('returns available Redis versions', async () => {
      const cliOutput = JSON.stringify([
        { id: 'v-1', name: 'Redis 7.2', number: '7.2' },
        { id: 'v-2', name: 'Redis 6.2', number: '6.2' },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: cliOutput, stderr: '' },
        meta: { command: 'mw database redis versions --output json', exitCode: 0, durationMs: 9 },
      });

      const response = await handleDatabaseRedisVersionsCli({ outputFormat: 'json' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.versions).toEqual([
        { id: 'v-1', name: 'Redis 7.2', version: '7.2' },
        { id: 'v-2', name: 'Redis 6.2', version: '6.2' },
      ]);
    });

    it('handles CLI permission errors gracefully', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Forbidden', {
          kind: 'EXECUTION',
          stderr: '403 Forbidden',
          stdout: '',
        })
      );

      const response = await handleDatabaseRedisVersionsCli({ outputFormat: 'json' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Permission denied/);
    });
  });
});
