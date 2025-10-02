import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../../../../src/tools/error.js';
import { handleContainerUpdateCli } from '../../../../../../src/handlers/tools/mittwald-cli/container/update-cli.js';
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

describe('handleContainerUpdateCli', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  it('updates container image successfully', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Container updated', stderr: '' },
      meta: { command: 'mw container update c-abc123 --image nginx:latest', exitCode: 0, durationMs: 100 },
    });

    const response = await handleContainerUpdateCli({
      containerId: 'c-abc123',
      image: 'nginx:latest',
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('success');
    expect(payload.message).toContain('c-abc123');
    expect(payload.data.updatedAttributes.image).toBe('nginx:latest');
  });

  it('handles multiple environment variables', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Container updated', stderr: '' },
      meta: { command: 'mw container update c-abc123 --env FOO=bar --env BAZ=qux', exitCode: 0, durationMs: 50 },
    });

    await handleContainerUpdateCli({
      containerId: 'c-abc123',
      env: ['FOO=bar', 'BAZ=qux'],
    });

    const invokedArgs = mockInvokeCliTool.mock.calls[0]?.[0]?.argv as string[];

    expect(invokedArgs).toEqual([
      'container',
      'update',
      'c-abc123',
      '--env',
      'FOO=bar',
      '--env',
      'BAZ=qux',
    ]);
  });

  it('maps container not found errors', async () => {
    mockInvokeCliTool.mockRejectedValueOnce(
      new CliToolError('Container not found', {
        kind: 'EXECUTION',
        stderr: 'Error: container c-invalid not found',
        stdout: '',
      })
    );

    const response = await handleContainerUpdateCli({
      containerId: 'c-invalid',
      image: 'nginx:latest',
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('Container not found');
    expect(payload.data.stderr).toContain('container c-invalid not found');
  });

  it('parses quiet mode output for container id', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'c-abc123\n', stderr: '' },
      meta: { command: 'mw container update c-abc123 --quiet', exitCode: 0, durationMs: 25 },
    });

    const response = await handleContainerUpdateCli({
      containerId: 'c-abc123',
      quiet: true,
    });

    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.status).toBe('success');
    expect(payload.data.containerId).toBe('c-abc123');
    expect(payload.message).toContain('c-abc123');
  });

  it('passes recreate flag to CLI invocation', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Container updated and recreated', stderr: '' },
      meta: { command: 'mw container update c-abc123 --recreate', exitCode: 0, durationMs: 150 },
    });

    await handleContainerUpdateCli({
      containerId: 'c-abc123',
      recreate: true,
    });

    const invokedArgs = mockInvokeCliTool.mock.calls[0]?.[0]?.argv as string[];

    expect(invokedArgs).toEqual([
      'container',
      'update',
      'c-abc123',
      '--recreate',
    ]);
  });
});
