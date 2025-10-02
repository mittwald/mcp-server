import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../../../../src/tools/error.js';
import { handleAppDependencyListCli } from '../../../../../../src/handlers/tools/mittwald-cli/app/dependency-list-cli.js';
import type { CliToolResult } from '../../../../../../src/tools/error.js';

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

const buildListResult = (dependencies: unknown): CliToolResult<{ stdout?: string; stderr?: string }> => ({
  ok: true,
  result: {
    stdout: JSON.stringify(dependencies),
    stderr: '',
  },
  meta: {
    command: 'mw app dependency list --output json',
    exitCode: 0,
    durationMs: 10,
  },
});

const buildAppResult = (systemSoftware: unknown): CliToolResult<string> => ({
  ok: true,
  result: JSON.stringify({ appInstallation: { systemSoftware } }),
  meta: {
    command: 'mw app get a-123 --output json',
    exitCode: 0,
    durationMs: 5,
  },
});

describe('handleAppDependencyListCli', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  const dependencies = [
    { id: 'dep-php', name: 'PHP', tags: ['php', 'runtime'], meta: { description: 'PHP runtime' } },
    { id: 'dep-node', name: 'Node.js', tags: ['nodejs'], meta: { description: 'Node runtime' } },
  ];

  it('returns formatted dependencies with enrichment when appId is provided', async () => {
    mockInvokeCliTool.mockResolvedValueOnce(buildListResult(dependencies));
    mockInvokeCliTool.mockResolvedValueOnce(
      buildAppResult([
        {
          systemSoftwareId: 'dep-php',
          systemSoftwareVersion: {
            current: '8.1.10',
            desired: '8.1.10',
          },
          updatePolicy: 'patchLevel',
        },
      ]),
    );

    const response = await handleAppDependencyListCli({ appId: 'a-123', includeMetadata: true });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('success');
    expect(payload.data.dependencies).toHaveLength(2);
    expect(payload.data.dependencies[0]).toMatchObject({
      id: 'dep-php',
      name: 'PHP',
      currentVersion: '8.1.10',
      desiredVersion: '8.1.10',
      updatePolicy: 'patchLevel',
    });
    expect(payload.data.dependencies[0].meta).toBeDefined();
  });

  it('filters dependencies by appType tag when provided', async () => {
    mockInvokeCliTool.mockResolvedValueOnce(buildListResult(dependencies));

    const response = await handleAppDependencyListCli({ appType: 'nodejs' });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.data.dependencies).toHaveLength(1);
    expect(payload.data.dependencies[0]).toMatchObject({ id: 'dep-node', name: 'Node.js' });
  });

  it('returns formatted error when CLI command fails', async () => {
    mockInvokeCliTool.mockRejectedValueOnce(
      new CliToolError('failed', {
        kind: 'EXECUTION',
        stderr: 'unknown system software',
      }),
    );

    const response = await handleAppDependencyListCli({});
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('failed');
  });
});
