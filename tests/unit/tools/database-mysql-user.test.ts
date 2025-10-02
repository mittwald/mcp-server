import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleDatabaseMysqlUserCreateCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.js';
import { handleDatabaseMysqlUserDeleteCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-delete-cli.js';
import { handleDatabaseMysqlUserGetCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-get-cli.js';
import { handleDatabaseMysqlUserListCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-list-cli.js';
import { handleDatabaseMysqlUserUpdateCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-update-cli.js';
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

describe('MySQL user tool handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleDatabaseMysqlUserCreateCli', () => {
    it('creates a user, generates a password, and fetches details', async () => {
      mockInvokeCliTool
        .mockResolvedValueOnce({
          ok: true,
          result: { stdout: 'mysql-user-123\n', stderr: '' },
          meta: { command: 'mw database mysql user create ...', exitCode: 0, durationMs: 120 },
        })
        .mockResolvedValueOnce({
          ok: true,
          result: JSON.stringify({ id: 'mysql-user-123', description: 'App user', accessLevel: 'full' }),
          meta: { command: 'mw database mysql user get mysql-user-123 --output json', exitCode: 0, durationMs: 40 },
        });

      const response = await handleDatabaseMysqlUserCreateCli({
        databaseId: 'mysql-abc123',
        description: 'App user',
      });

      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.userId).toBe('mysql-user-123');
      expect(payload.data.passwordGenerated).toBe(true);
      expect(typeof payload.data.generatedPassword).toBe('string');
      expect(payload.data.generatedPassword.length).toBeGreaterThan(10);
      expect(payload.data.password).toBeUndefined();
      expect(payload.data.details).toEqual({ id: 'mysql-user-123', description: 'App user', accessLevel: 'full' });

      const firstCall = mockInvokeCliTool.mock.calls[0]?.[0];
      expect(firstCall?.argv).toEqual([
        'database',
        'mysql',
        'user',
        'create',
        '--database-id',
        'mysql-abc123',
        '--access-level',
        'full',
        '--description',
        'App user',
        '--password',
        expect.any(String),
        '--quiet',
      ]);

      const secondCall = mockInvokeCliTool.mock.calls[1]?.[0];
      expect(secondCall?.argv).toEqual([
        'database',
        'mysql',
        'user',
        'get',
        'mysql-user-123',
        '--output',
        'json',
      ]);
    });

    it('returns error when MySQL user identifier is missing in CLI output', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: '', stderr: '' },
        meta: { command: 'mw database mysql user create ...', exitCode: 0, durationMs: 30 },
      });

      const response = await handleDatabaseMysqlUserCreateCli({
        databaseId: 'mysql-abc123',
        description: 'App user',
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(mockInvokeCliTool).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDatabaseMysqlUserDeleteCli', () => {
    it('deletes a user with force flag', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: '', stderr: '' },
        meta: { command: 'mw database mysql user delete u-123 --force --quiet', exitCode: 0, durationMs: 10 },
      });

      const response = await handleDatabaseMysqlUserDeleteCli({ userId: 'mysql-user-123', force: true });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.deleted).toBe(true);
      expect(payload.data.userId).toBe('mysql-user-123');

      const argv = mockInvokeCliTool.mock.calls[0]?.[0]?.argv as string[];
      expect(argv).toEqual([
        'database',
        'mysql',
        'user',
        'delete',
        'mysql-user-123',
        '--force',
        '--quiet',
      ]);
    });

    it('maps CLI errors for protected users', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Cannot delete main user', {
          kind: 'EXECUTION',
          stderr: 'The main MySQL user can not be deleted manually.',
          stdout: '',
        })
      );

      const response = await handleDatabaseMysqlUserDeleteCli({ userId: 'mysql-user-001' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/primary MySQL user/);
    });
  });

  describe('handleDatabaseMysqlUserGetCli', () => {
    it('parses JSON output', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: JSON.stringify({ id: 'mysql-user-123', accessLevel: 'full' }), stderr: '' },
        meta: { command: 'mw database mysql user get mysql-user-123 --output json', exitCode: 0, durationMs: 15 },
      });

      const response = await handleDatabaseMysqlUserGetCli({ userId: 'mysql-user-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.user).toEqual({ id: 'mysql-user-123', accessLevel: 'full' });
      expect(payload.data.parseError).toBeUndefined();
    });

    it('returns raw output when JSON parsing fails', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'unexpected output', stderr: '' },
        meta: { command: 'mw database mysql user get mysql-user-123 --output json', exitCode: 0, durationMs: 15 },
      });

      const response = await handleDatabaseMysqlUserGetCli({ userId: 'mysql-user-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.rawOutput).toBe('unexpected output');
      expect(payload.data.parseError).toBeDefined();
    });
  });

  describe('handleDatabaseMysqlUserListCli', () => {
    it('parses database user list', async () => {
      const cliOutput = JSON.stringify([
        { id: 'mysql-user-1', name: 'app', description: 'App user', mainUser: false, externalAccess: true },
        { id: 'mysql-user-2', name: 'root', description: 'Main user', mainUser: true, externalAccess: false },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: cliOutput, stderr: '' },
        meta: { command: 'mw database mysql user list --database-id mysql-abc --output json', exitCode: 0, durationMs: 22 },
      });

      const response = await handleDatabaseMysqlUserListCli({ databaseId: 'mysql-abc', outputFormat: 'json' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.users).toHaveLength(2);
      expect(payload.data.users[0]).toMatchObject({ id: 'mysql-user-1', name: 'app', externalAccess: true });
    });
  });

  describe('handleDatabaseMysqlUserUpdateCli', () => {
    it('requires at least one update parameter', async () => {
      const response = await handleDatabaseMysqlUserUpdateCli({ userId: 'mysql-user-777' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });

    it('sanitizes password in meta command and reports updated attributes', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'Updated user', stderr: '' },
        meta: { command: 'mw database mysql user update mysql-user-777 --password secret', exitCode: 0, durationMs: 18 },
      });

      const response = await handleDatabaseMysqlUserUpdateCli({
        userId: 'mysql-user-777',
        password: 'super-secret',
        accessLevel: 'readonly',
      });

      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.updatedAttributes).toEqual({
        description: undefined,
        accessLevel: 'readonly',
        accessIpMask: undefined,
        externalAccess: undefined,
        passwordChanged: true,
      });
      expect(payload.meta.command).not.toContain('super-secret');
      expect(payload.meta.command).toContain('[REDACTED]');
    });

    it('prevents conflicting external access flags', async () => {
      const response = await handleDatabaseMysqlUserUpdateCli({
        userId: 'mysql-user-777',
        enableExternalAccess: true,
        disableExternalAccess: true,
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });
  });
});
