import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateMysqlDatabase = vi.fn();
const mockGetMysqlDatabase = vi.fn();

vi.mock('@mittwald/api-client', () => ({
  MittwaldAPIV2Client: {
    newWithToken: vi.fn(() => ({
      database: {
        createMysqlDatabase: mockCreateMysqlDatabase,
        getMysqlDatabase: mockGetMysqlDatabase,
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

const dbDetails = (overrides: Record<string, unknown> = {}) => ({
  id: 'db-1',
  name: 'db-1',
  hostname: 'db-1.mysql.mittwald.de',
  externalHostname: 'ext-db-1.mysql.mittwald.de',
  mainUser: undefined,
  ...overrides,
});

describe('createMysqlDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses mainUser.name directly when the initial getMysqlDatabase call already has it populated', async () => {
    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });
    mockGetMysqlDatabase.mockResolvedValue({
      status: 200,
      data: dbDetails({ mainUser: { name: 'dbu_already_there' } }),
    });

    const result = await createMysqlDatabase(baseOptions);

    expect(result.data.userName).toBe('dbu_already_there');
    // Only the initial read — no polling needed once the field is already populated.
    expect(mockGetMysqlDatabase).toHaveBeenCalledTimes(1);
  });

  it('polls the same getMysqlDatabase endpoint until mainUser.name appears on a later attempt', async () => {
    vi.useFakeTimers();

    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });
    mockGetMysqlDatabase
      .mockResolvedValueOnce({ status: 200, data: dbDetails() }) // initial read: not yet populated
      .mockResolvedValueOnce({ status: 200, data: dbDetails() }) // poll attempt 1: still not populated
      .mockResolvedValueOnce({
        status: 200,
        data: dbDetails({ mainUser: { name: 'dbu_resolved_later' } }),
      }); // poll attempt 2: now populated

    const resultPromise = createMysqlDatabase(baseOptions);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data.userName).toBe('dbu_resolved_later');
    expect(mockGetMysqlDatabase).toHaveBeenCalledTimes(3);
  });

  it('falls back to an empty string without throwing once the poll budget is exhausted', async () => {
    vi.useFakeTimers();

    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });
    // mainUser never shows up on any attempt.
    mockGetMysqlDatabase.mockResolvedValue({ status: 200, data: dbDetails() });

    const resultPromise = createMysqlDatabase(baseOptions);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data.userName).toBe('');
    // 1 initial read + up to 4 poll attempts = 5 total calls, then it gives up.
    expect(mockGetMysqlDatabase).toHaveBeenCalledTimes(5);
  });

  it('keeps polling past a transient error on an individual poll attempt and still resolves the username', async () => {
    vi.useFakeTimers();

    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });
    mockGetMysqlDatabase
      .mockResolvedValueOnce({ status: 200, data: dbDetails() }) // initial read: not yet populated
      .mockRejectedValueOnce(new Error('transient network error')) // poll attempt 1: fails
      .mockResolvedValueOnce({
        status: 200,
        data: dbDetails({ mainUser: { name: 'dbu_after_retry' } }),
      }); // poll attempt 2: succeeds

    const resultPromise = createMysqlDatabase(baseOptions);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data.userName).toBe('dbu_after_retry');
  });

  it('falls back to an empty string without throwing when every poll attempt errors', async () => {
    vi.useFakeTimers();

    mockCreateMysqlDatabase.mockResolvedValue({
      status: 201,
      data: { id: 'db-1', userId: 'user-1' },
    });
    mockGetMysqlDatabase
      .mockResolvedValueOnce({ status: 200, data: dbDetails() }) // initial read: not yet populated
      .mockRejectedValue(new Error('backend unavailable')); // every poll attempt fails

    const resultPromise = createMysqlDatabase(baseOptions);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data.userName).toBe('');
  });
});
