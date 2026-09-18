import { describe, it, expect, afterEach, vi } from 'vitest';

import type { MittwaldTokenServiceError } from '../../../src/server/mittwald-token-service.js';

const ORIGINAL_ENV = { ...process.env };

/**
 * CONFIG is read once when the module is first evaluated, so each case sets its environment and
 * then imports a fresh copy.
 */
async function loadService(env: Record<string, string | undefined>) {
  process.env.MITTWALD_TOKEN_URL = 'https://mittwald.example.com/oauth/token';
  process.env.MITTWALD_CLIENT_ID = 'mittwald-mcp-server';

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
  return import('../../../src/server/mittwald-token-service.js');
}

function mockTokenEndpoint(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    })
  );
}

/** Runs a refresh that is expected to fail and returns the reason it reported. */
async function refreshFailureReason(): Promise<string> {
  const { refreshMittwaldAccessToken } = await loadService({});

  try {
    await refreshMittwaldAccessToken({ refreshToken: 'refresh-token' });
  } catch (error) {
    return (error as MittwaldTokenServiceError).reason;
  }

  throw new Error('expected refreshMittwaldAccessToken to reject');
}

describe('refreshMittwaldAccessToken', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('reports a missing token URL as a configuration problem, naming the variable', async () => {
    const { refreshMittwaldAccessToken } = await loadService({ MITTWALD_TOKEN_URL: undefined });

    await expect(refreshMittwaldAccessToken({ refreshToken: 'refresh-token' })).rejects.toMatchObject({
      reason: 'configuration',
      message: expect.stringContaining('MITTWALD_TOKEN_URL'),
    });
  });

  it('treats invalid_grant as a revoked session', async () => {
    mockTokenEndpoint(400, { error: 'invalid_grant', error_description: 'expired' });

    expect(await refreshFailureReason()).toBe('revoked');
  });

  it('does not treat a server-side failure as a revoked session', async () => {
    // A 5xx says nothing about the user's refresh token; retrying is the right move.
    mockTokenEndpoint(503, { error: 'temporarily_unavailable' });

    expect(await refreshFailureReason()).toBe('transport');
  });

  it('does not treat our own bad credentials as a revoked session', async () => {
    mockTokenEndpoint(401, { error: 'invalid_client' });

    expect(await refreshFailureReason()).toBe('transport');
  });

  it('treats an unreachable token endpoint as transient', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    expect(await refreshFailureReason()).toBe('transport');
  });

  it('returns the refreshed tokens on success', async () => {
    mockTokenEndpoint(200, {
      access_token: 'new-access-token',
      token_type: 'Bearer',
      expires_in: 1800,
      refresh_token: 'rotated-refresh-token',
    });

    const { refreshMittwaldAccessToken } = await loadService({});
    const result = await refreshMittwaldAccessToken({ refreshToken: 'refresh-token' });

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('rotated-refresh-token');
  });
});
