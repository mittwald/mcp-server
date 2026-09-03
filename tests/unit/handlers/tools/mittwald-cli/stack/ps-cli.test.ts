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
    getStackProcesses: vi.fn(),
  };
});

const { handleStackPsCli } = await import('../../../../../../src/handlers/tools/mittwald-cli/stack/ps-cli.js');
const { sessionManager } = await import('../../../../../../src/server/session-manager.js');
const { getStackProcesses } = await import('@mittwald-mcp/cli-core');

const mockGetSession = sessionManager.getSession as unknown as vi.Mock;
const mockGetStackProcesses = getStackProcesses as unknown as vi.Mock;

const SECRET = 'super-secret-db-password';

// Shape mirrors the real MittwaldAPIV2 ContainerServiceResponse returned by
// client.container.listServices(), including the envs the API embeds on
// deployedState/pendingState.
const rawService = {
  id: 'svc-1',
  serviceName: 'stack1-web',
  shortId: 'svc1',
  stackId: 'stack-1',
  projectId: 'p-1',
  status: 'running',
  statusSetAt: '2026-08-31T00:00:00Z',
  requiresRecreate: false,
  description: 'web service',
  deployedState: {
    image: 'nginx:latest',
    ports: ['80/tcp'],
    envs: { DB_PASSWORD: SECRET },
  },
  pendingState: {
    image: 'nginx:latest',
    ports: ['80/tcp'],
    envs: { DB_PASSWORD: SECRET },
  },
};

describe('handleStackPsCli', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockGetStackProcesses.mockReset();
    mockGetSession.mockResolvedValue({ mittwaldAccessToken: 'token-123' });
  });

  it('does not expose environment variables from the underlying API response', async () => {
    mockGetStackProcesses.mockResolvedValueOnce({ data: [rawService] });

    const response = await handleStackPsCli({ stackId: 'stack-1', projectId: 'p-1' }, 'session-1');
    const rawText = response.content[0]?.text ?? '{}';
    const payload = JSON.parse(rawText);

    expect(rawText).not.toContain(SECRET);
    expect(rawText).not.toContain('envs');
    expect(rawText).not.toContain('deployedState');
    expect(rawText).not.toContain('pendingState');

    // formatServices() reads service.name/state/image/createdAt/updatedAt, but the real API
    // response uses serviceName/status and nests image under deployedState/pendingState — so
    // those fields come back undefined (and are dropped by JSON.stringify) rather than leaking.
    expect(payload.data[0]).toEqual({
      id: 'svc-1',
      ports: [],
      stackId: 'stack-1',
    });
  });
});
