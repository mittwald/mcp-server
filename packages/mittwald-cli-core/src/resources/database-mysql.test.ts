import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateMysqlDatabase = vi.fn();
const mockGetMysqlDatabase = vi.fn();
const mockListMysqlUsers = vi.fn();

vi.mock('@mittwald/api-client', () => ({
  MittwaldAPIV2Client: {
    newWithToken: vi.fn(() => ({
      database: {
        createMysqlDatabase: mockCreateMysqlDatabase,
        getMysqlDatabase: mockGetMysqlDatabase,
        listMysqlUsers: mockListMysqlUsers,
      },
    })),
  },
}));

vi.mock('@mittwald/api-client-commons', () => ({
  assertStatus: vi.fn(),
}));

const { createMysqlDatabase } = await import('./database-mysql.js');

const baseOptions = {
  apiToken: 'test-token',
  projectId: 'project-1',
  description: 'test database',
  version: '8.0',
};

describe('createMysqlDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the real username via listMysqlUsers when mainUser is not yet populated on the fresh database', async () => {
    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });

    // Immediately after creation, the API has not yet populated the mainUser relation.
    mockGetMysqlDatabase.mockResolvedValue({
      status: 200,
      data: {
        id: 'db-1',
        name: 'db-1',
        hostname: 'db-1.mysql.mittwald.de',
        externalHostname: 'ext-db-1.mysql.mittwald.de',
        mainUser: undefined,
      },
    });

    mockListMysqlUsers.mockResolvedValue({
      status: 200,
      data: [
        { id: 'user-1', name: 'dbu_abc123', mainUser: true },
        { id: 'user-2', name: 'dbu_other', mainUser: false },
      ],
    });

    const result = await createMysqlDatabase(baseOptions);

    expect(result.data.userName).toBe('dbu_abc123');
    expect(mockListMysqlUsers).toHaveBeenCalledWith(
      expect.objectContaining({ mysqlDatabaseId: 'db-1' })
    );
  });

  it('uses mainUser.name directly when the database details already have it populated', async () => {
    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-2', userId: 'user-2' },
    });

    mockGetMysqlDatabase.mockResolvedValue({
      status: 200,
      data: {
        id: 'db-2',
        name: 'db-2',
        hostname: 'db-2.mysql.mittwald.de',
        externalHostname: 'ext-db-2.mysql.mittwald.de',
        mainUser: { name: 'dbu_already_there' },
      },
    });

    const result = await createMysqlDatabase(baseOptions);

    expect(result.data.userName).toBe('dbu_already_there');
    expect(mockListMysqlUsers).not.toHaveBeenCalled();
  });

  it('falls back to an empty string when the follow-up listMysqlUsers lookup cannot find a matching user', async () => {
    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-3', userId: 'user-3' },
    });

    mockGetMysqlDatabase.mockResolvedValue({
      status: 200,
      data: {
        id: 'db-3',
        name: 'db-3',
        hostname: 'db-3.mysql.mittwald.de',
        externalHostname: 'ext-db-3.mysql.mittwald.de',
        mainUser: undefined,
      },
    });

    mockListMysqlUsers.mockResolvedValue({
      status: 200,
      data: [],
    });

    const result = await createMysqlDatabase(baseOptions);

    expect(result.data.userName).toBe('');
  });

  it('falls back to an empty string without throwing when the follow-up listMysqlUsers call itself fails', async () => {
    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-4', userId: 'user-4' },
    });

    mockGetMysqlDatabase.mockResolvedValue({
      status: 200,
      data: {
        id: 'db-4',
        name: 'db-4',
        hostname: 'db-4.mysql.mittwald.de',
        externalHostname: 'ext-db-4.mysql.mittwald.de',
        mainUser: undefined,
      },
    });

    mockListMysqlUsers.mockRejectedValue(new Error('network error'));

    const result = await createMysqlDatabase(baseOptions);

    expect(result.data.userName).toBe('');
  });
});
