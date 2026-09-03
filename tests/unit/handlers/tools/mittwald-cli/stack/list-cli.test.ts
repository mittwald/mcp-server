import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/server/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn(),
  },
}));

vi.mock('@mittwald-mcp/cli-core', async () => {
  const actual = await vi.importActual<typeof import('@mittwald-mcp/cli-core')>('@mittwald-mcp/cli-core');

  return {
    ...actual,
    listStacks: vi.fn(),
  };
});

const { handleStackListCli } = await import('../../../../../../src/handlers/tools/mittwald-cli/stack/list-cli.js');
const { sessionManager } = await import('../../../../../../src/server/session-manager.js');
const { listStacks } = await import('@mittwald-mcp/cli-core');

const mockGetSession = sessionManager.getSession as unknown as vi.Mock;
const mockListStacks = listStacks as unknown as vi.Mock;

const rawStack = {
  id: 'stack-1',
  description: 'My stack',
  prefix: 'stack1-',
  disabled: false,
  projectId: 'p-1',
  volumes: [],
  services: [
    {
      id: 'svc-1',
      serviceName: 'stack1-web',
      deployedState: {
        image: 'nginx:latest',
        envs: { DB_PASSWORD: 'super-secret', PUBLIC_FLAG: 'true' },
      },
      pendingState: {
        image: 'nginx:latest',
        envs: { DB_PASSWORD: 'super-secret' },
      },
    },
  ],
};

describe('handleStackListCli', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockListStacks.mockReset();
    mockGetSession.mockResolvedValue({ mittwaldAccessToken: 'token-123' });
  });

  it('redacts environment variable values by default', async () => {
    mockListStacks.mockResolvedValueOnce({ data: [rawStack] });

    const response = await handleStackListCli({ projectId: 'p-1' }, 'session-1');
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    const service = payload.data[0].services[0];
    expect(service.deployedState.envs).toEqual({ DB_PASSWORD: '[REDACTED]', PUBLIC_FLAG: '[REDACTED]' });
    expect(service.pendingState.envs).toEqual({ DB_PASSWORD: '[REDACTED]' });
    expect(payload.message).toContain('redacted');
  });

  it('reveals real environment variable values when explicitly requested', async () => {
    mockListStacks.mockResolvedValueOnce({ data: [rawStack] });

    const response = await handleStackListCli({ projectId: 'p-1', revealEnvironmentVariables: true }, 'session-1');
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    const service = payload.data[0].services[0];
    expect(service.deployedState.envs).toEqual({ DB_PASSWORD: 'super-secret', PUBLIC_FLAG: 'true' });
    expect(payload.message).not.toContain('redacted');
  });
});
