import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleSftpUserCreateCli } from '../../../src/handlers/tools/mittwald-cli/sftp/user-create-cli.js';
import { handleSshUserCreateCli } from '../../../src/handlers/tools/mittwald-cli/ssh/user-create-cli.js';
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

describe('SSH/SFTP user handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleSshUserCreateCli', () => {
    it('creates SSH user with password and redacts credentials in metadata', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'ssh-user-123\n', stderr: '' },
        meta: {
          command: 'mw ssh-user create --description app --password super-secret --quiet',
          exitCode: 0,
          durationMs: 20,
        },
      });

      const response = await handleSshUserCreateCli({
        description: 'app',
        password: 'super-secret',
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('success');
      expect(payload.data.authentication).toEqual({
        method: 'password',
        passwordProvided: true,
        publicKeyProvided: false,
      });
      expect(payload.data.id).toBe('ssh-user-123');
      expect(payload.meta.command).toContain('[REDACTED]');
      expect(payload.meta.command).not.toContain('super-secret');
    });

    it('requires an authentication method', async () => {
      const response = await handleSshUserCreateCli({ description: 'app' });
      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Either password or public key/);
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });
  });

  describe('handleSftpUserCreateCli', () => {
    it('creates SFTP user with public key authentication', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'sftp-user-555\n', stderr: '' },
        meta: {
          command: 'mw sftp-user create --description deploy --public-key ssh-rsa AAA... --quiet',
          exitCode: 0,
          durationMs: 32,
        },
      });

      const response = await handleSftpUserCreateCli({
        description: 'deploy',
        directories: ['/var/www'],
        publicKey: 'ssh-rsa AAA...',
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('success');
      expect(payload.data.id).toBe('sftp-user-555');
      expect(payload.data.authentication).toEqual({
        method: 'publicKey',
        passwordProvided: false,
        publicKeyProvided: true,
      });
      expect(payload.meta.command).toContain('--public-key');
    });

    it('maps CLI errors', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Forbidden', {
          kind: 'EXECUTION',
          stderr: '403 Forbidden',
          stdout: '',
        })
      );

      const response = await handleSftpUserCreateCli({
        description: 'deploy',
        directories: ['/var/www'],
        password: 'Temp-123!',
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Permission denied/);
    });
  });
});
