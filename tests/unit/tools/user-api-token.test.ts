import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleUserApiTokenCreateCli } from '../../../src/handlers/tools/mittwald-cli/user/api-token/create-cli.js';
import { handleUserApiTokenRevokeCli } from '../../../src/handlers/tools/mittwald-cli/user/api-token/revoke-cli.js';
import type { CliToolResult } from '../../../src/tools/error.js';
import { logger } from '../../../src/utils/logger.js';

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
const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

function parseResponse(payload: unknown) {
  return JSON.parse((payload as { content: Array<{ text: string }> }).content[0]?.text ?? '{}');
}

describe('API token handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('handleUserApiTokenCreateCli', () => {
    it('returns generated token and redacts metadata', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: JSON.stringify({ token: 'tok_12345' }), stderr: '' },
        meta: {
          command: 'mw user api-token create --description deploy --roles api_read --roles api_write',
          exitCode: 0,
          durationMs: 18,
        },
      });

      const response = await handleUserApiTokenCreateCli({
        description: 'deploy',
        roles: ['api_read', 'api_write'],
      });

      const payload = parseResponse(response);
      expect(payload.status).toBe('success');
      expect(payload.data.generatedToken).toBe('tok_12345');
      expect(payload.data.tokenGenerated).toBe(true);
      expect(payload.meta.command).not.toContain('tok_12345');
    });

    it('handles missing token output', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: '', stderr: '' },
        meta: { command: 'mw user api-token create ...', exitCode: 0, durationMs: 10 },
      });

      const response = await handleUserApiTokenCreateCli({ description: 'deploy', roles: ['api_read'] });
      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/no token returned/i);
    });

    it('maps CLI errors', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Failed', {
          kind: 'EXECUTION',
          stderr: 'permission denied',
          stdout: '',
        })
      );

      const response = await handleUserApiTokenCreateCli({ description: 'deploy', roles: ['api_read'] });
      const payload = parseResponse(response);
      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Failed to create API token/);
    });
  });

  describe('handleUserApiTokenRevokeCli', () => {
    it('requires confirm flag before revoking a token', async () => {
      const response = await handleUserApiTokenRevokeCli({ tokenId: 'tok-1' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toContain('confirm=true');
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('logs audit trail and revokes the token', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: 'Token tok-1 revoked\n', stderr: '' },
        meta: { command: 'mw user api-token revoke tok-1 --force', exitCode: 0, durationMs: 19 },
      });

      const response = await handleUserApiTokenRevokeCli(
        { tokenId: 'tok-1', confirm: true, force: true },
        { sessionId: 'sess-1', userId: 'user-9' } as any
      );
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.message).toContain('Token tok-1 revoked');
      expect(payload.data.tokenId).toBe('tok-1');
      expect(payload.data.force).toBe(true);
      expect(payload.data.revoked).toBe(true);
      expect(mockInvokeCliTool).toHaveBeenCalledWith({
        toolName: 'mittwald_user_api_token_revoke',
        argv: ['user', 'api-token', 'revoke', 'tok-1', '--force'],
        parser: expect.any(Function),
      });
      expect(warnSpy).toHaveBeenCalledWith(
        '[UserApiTokenRevoke] Destructive operation attempted',
        expect.objectContaining({
          tokenId: 'tok-1',
          force: true,
          sessionId: 'sess-1',
          userId: 'user-9',
        })
      );
    });

    it('maps CLI errors to descriptive messages', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Not found', {
          kind: 'EXECUTION',
          stderr: 'no token found',
          stdout: '',
        })
      );

      const response = await handleUserApiTokenRevokeCli({ tokenId: 'tok-missing', confirm: true });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/API token not found/);
      expect(warnSpy).toHaveBeenCalledWith(
        '[UserApiTokenRevoke] Destructive operation attempted',
        expect.objectContaining({ tokenId: 'tok-missing' })
      );
    });
  });
});
