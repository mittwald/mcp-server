/**
 * The bridge access token carries a snapshot of the Mittwald tokens, so it is only usable for as
 * long as they are. Advertising the configured lifetime regardless of what Mittwald granted left
 * clients holding a token that verified fine but no longer worked against the API — with no reason
 * to refresh it, every call failed until the user reconnected by hand.
 */

import { describe, it, expect } from 'vitest';
import { decodeJwt } from 'jose';
import { issueBridgeTokens } from '../../src/services/bridge-tokens.js';
import type { BridgeConfig } from '../../src/config.js';
import type { AuthorizationGrantRecord, MittwaldTokenResponse } from '../../src/state/state-store.js';

const config = {
  bridge: {
    issuer: 'https://bridge.example.com',
    baseUrl: 'https://bridge.example.com',
    jwtSecret: 'test-secret-value-long-enough-for-hs256',
    accessTokenTtlSeconds: 3600,
    refreshTokenTtlSeconds: 7 * 24 * 3600,
  },
} as BridgeConfig;

const grant = {
  clientId: 'claude-client',
  scope: 'user:read project:read',
  resource: 'https://mcp.example.com/mcp',
} as AuthorizationGrantRecord;

function mittwaldTokens(overrides: Partial<MittwaldTokenResponse> = {}): MittwaldTokenResponse {
  return {
    access_token: 'mittwald-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'mittwald-refresh-token',
    ...overrides,
  };
}

describe('issueBridgeTokens', () => {
  it('never advertises a longer lifetime than the Mittwald token it wraps', async () => {
    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ expires_in: 900 }),
    });

    expect(tokens.expiresIn).toBeLessThan(900);
    expect(tokens.expiresIn).toBeGreaterThan(0);
  });

  it('expires the JWT together with the lifetime it advertises', async () => {
    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ expires_in: 900 }),
    });

    const { exp } = decodeJwt(tokens.accessToken);
    const now = Math.floor(Date.now() / 1000);

    expect(exp).toBeDefined();
    expect(exp! - now).toBeLessThanOrEqual(tokens.expiresIn + 1);
  });

  it('keeps the configured lifetime when Mittwald grants a longer one', async () => {
    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ expires_in: 86400 }),
    });

    expect(tokens.expiresIn).toBe(config.bridge.accessTokenTtlSeconds);
  });

  it('falls back to the configured lifetime when Mittwald reports none', async () => {
    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ expires_in: undefined as unknown as number }),
    });

    expect(tokens.expiresIn).toBe(config.bridge.accessTokenTtlSeconds);
  });

  it('does not advertise a lifetime so short that the client only ever refreshes', async () => {
    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ expires_in: 30 }),
    });

    expect(tokens.expiresIn).toBeGreaterThanOrEqual(60);
  });

  it('does not hand out a refresh token that outlives Mittwald\'s', async () => {
    const issuedAt = Math.floor(Date.now() / 1000);

    const tokens = await issueBridgeTokens({
      config,
      grant,
      mittwaldTokens: mittwaldTokens({ refresh_token_expires_in: 3600 }),
    });

    expect(tokens.refreshTokenExpiresAt - issuedAt).toBeLessThanOrEqual(3600);
  });

  it('keeps the configured refresh lifetime when Mittwald reports none', async () => {
    const issuedAt = Math.floor(Date.now() / 1000);

    const tokens = await issueBridgeTokens({ config, grant, mittwaldTokens: mittwaldTokens() });

    expect(tokens.refreshTokenExpiresAt - issuedAt).toBeCloseTo(
      config.bridge.refreshTokenTtlSeconds,
      -1
    );
  });
});
