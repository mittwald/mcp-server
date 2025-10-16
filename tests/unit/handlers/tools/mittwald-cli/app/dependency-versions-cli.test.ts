import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError, type CliToolResult } from '../../../../../../src/tools/error.js';
import { handleAppDependencyVersionsCli } from '../../../../../../src/handlers/tools/mittwald-cli/app/dependency-versions-cli.js';

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

const buildVersionResult = (versions: unknown): CliToolResult<{ stdout?: string; stderr?: string }> => ({
  ok: true,
  result: {
    stdout: JSON.stringify(versions),
    stderr: '',
  },
  meta: {
    command: 'mw app dependency versions php --output json',
    exitCode: 0,
    durationMs: 7,
  },
});

describe('handleAppDependencyVersionsCli', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  it('filters versions by range and recommended flag', async () => {
    const versions = [
      { id: '1', externalVersion: '8.1.0', internalVersion: '8.1.0', recommended: false },
      { id: '2', externalVersion: '8.2.1', internalVersion: '8.2.1', recommended: true },
      { id: '3', externalVersion: '8.3.0', internalVersion: '8.3.0', recommended: true },
    ];
    mockInvokeCliTool.mockResolvedValueOnce(buildVersionResult(versions));

    const response = await handleAppDependencyVersionsCli({
      dependency: 'php',
      versionRange: '>=8.2.0',
      recommendedOnly: true,
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');
    expect(payload.status).toBe('success');
    expect(payload.data.versions).toHaveLength(2);
    expect(payload.data.versions[0]).toMatchObject({ version: '8.2.1', recommended: true });
  });

  it('attaches warning when version range is invalid', async () => {
    const versions = [{ id: '1', externalVersion: '8.2.0', recommended: true }];
    mockInvokeCliTool.mockResolvedValueOnce(buildVersionResult(versions));

    const response = await handleAppDependencyVersionsCli({
      dependency: 'php',
      versionRange: 'not-a-range',
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');
    expect(payload.status).toBe('success');
    expect(payload.meta.warnings[0]).toContain('Invalid version range');
  });

  it('maps CLI errors to friendly messages', async () => {
    mockInvokeCliTool.mockRejectedValueOnce(
      new CliToolError('failed', {
        kind: 'EXECUTION',
        stderr: 'system software php not found',
      }),
    );

    const response = await handleAppDependencyVersionsCli({ dependency: 'php' });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('Dependency not found');
  });
});
