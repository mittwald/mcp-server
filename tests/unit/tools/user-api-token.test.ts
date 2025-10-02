import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleUserApiTokenCreateCli } from '../../../src/handlers/tools/mittwald-cli/user/api-token/create-cli.js';
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

describe('API token handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleUserApiTokenCreateCli', () => {
    it('returns generated token and redacts metadata', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: { stdout: JSON.stringify({ token: 'tok_12345' }), stderr: '' },
        meta: {
          command: 'mw user api-token create --description deploy --roles api_read --roles api_write --quiet',
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
});
