import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { directTokenValidator, DirectTokenValidationError } from '../../../src/server/direct-token-validator.js';

vi.mock('../../../src/server/config.js', () => ({
  CONFIG: {
    DIRECT_TOKENS: {
      ENABLED: true,
      CACHE_TTL_MS: 5_000,
      SESSION_TTL_SECONDS: 1_800,
      VALIDATION_TIMEOUT_MS: 5_000,
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DirectTokenValidator', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    directTokenValidator.clear();
  });

  afterEach(() => {
    directTokenValidator.clear();
  });

  it('validates token via REST API and returns parsed info', async () => {
    const userResponse = {
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'rob@robshouse.net',
      person: {
        firstName: 'Robert',
        lastName: 'Douglass',
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(userResponse),
    });

    const result = await directTokenValidator.validate('mwat_token');

    expect(result).toMatchObject({
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'rob@robshouse.net',
      name: 'Robert Douglass',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mittwald.de/v2/users/self',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mwat_token',
          'Accept': 'application/json',
        },
      }),
    );
  });

  it('caches validation results for subsequent calls', async () => {
    const userResponse = {
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'test@example.com',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(userResponse),
    });

    await directTokenValidator.validate('token-123');
    await directTokenValidator.validate('token-123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws DirectTokenValidationError when API returns 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(directTokenValidator.validate('invalid-token')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });

  it('throws DirectTokenValidationError when API returns 403', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(directTokenValidator.validate('forbidden-token')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });

  it('throws DirectTokenValidationError when response is missing userId', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ email: 'test@example.com' }),
    });

    await expect(directTokenValidator.validate('token-without-id')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });

  it('handles user without person data', async () => {
    const userResponse = {
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'test@example.com',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(userResponse),
    });

    const result = await directTokenValidator.validate('token-no-person');

    expect(result).toMatchObject({
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'test@example.com',
    });
    expect(result.name).toBeUndefined();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(directTokenValidator.validate('error-token')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(directTokenValidator.validate('network-error-token')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });
});
