import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError, type CliToolResult } from '../../../../../../src/tools/error.js';
import { handleAppDependencyUpdateCli } from '../../../../../../src/handlers/tools/mittwald-cli/app/dependency-update-cli.js';

vi.mock('../../../../../../src/tools/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../../../../../src/tools/index.js')>(
    '../../../../../../src/tools/index.js'
  );

  return {
    ...actual,
    invokeCliTool: vi.fn(),
  };
});

const { invokeCliTool } = await import('../../../../../../src/tools/index.js');
const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<Promise<CliToolResult<any>>, any>;

const buildUpdateResult = (stdout: string, stderr = ''): CliToolResult<{ stdout?: string; stderr?: string }> => ({
  ok: true,
  result: { stdout, stderr },
  meta: {
    command: 'mw app dependency update a-123 --set php=8.2',
    exitCode: 0,
    durationMs: 12,
  },
});

describe('handleAppDependencyUpdateCli', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  it('collects updates from multiple inputs and forwards them to the CLI', async () => {
    mockInvokeCliTool.mockResolvedValueOnce(buildUpdateResult('Dependencies updated'));

    const response = await handleAppDependencyUpdateCli({
      appId: 'a-123',
      dependency: 'php',
      version: '8.2',
      updates: [{ dependency: 'node', version: '~18' }],
      updatePolicy: 'all',
      quiet: true,
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');
    expect(payload.status).toBe('success');
    expect(payload.data.updates).toHaveLength(2);

    const call = mockInvokeCliTool.mock.calls[0]?.[0];
    expect(call.argv).toEqual([
      'app',
      'dependency',
      'update',
      'a-123',
      '--quiet',
      '--set',
      'php=8.2',
      '--set',
      'node=~18',
      '--update-policy',
      'all',
    ]);
  });

  it('validates presence of updates', async () => {
    const response = await handleAppDependencyUpdateCli({ appId: 'a-123' });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('At least one dependency update is required');
  });

  it('maps CLI execution errors to descriptive messages', async () => {
    mockInvokeCliTool.mockRejectedValueOnce(
      new CliToolError('failed', {
        kind: 'EXECUTION',
        stderr: 'unknown system software php',
      }),
    );

    const response = await handleAppDependencyUpdateCli({
      appId: 'a-123',
      dependency: 'php',
      version: '9.0',
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');
    expect(payload.status).toBe('error');
    expect(payload.message).toContain('Unknown dependency');
  });
});
