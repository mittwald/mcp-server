import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { AuthorizationGrantRecord, MittwaldTokenResponse } from '../state/state-store.js';

interface IssueBridgeTokensArgs {
  config: BridgeConfig;
  grant: AuthorizationGrantRecord;
  mittwaldTokens: MittwaldTokenResponse;
}

export interface BridgeTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: number;
  /** Lifetime to advertise to the client, in seconds. Never longer than the Mittwald token inside. */
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

/**
 * Renew slightly before the embedded Mittwald token actually expires, so a client that waits until
 * the last moment still presents us a usable token.
 */
const MITTWALD_EXPIRY_SKEW_SECONDS = 60;

/** Never advertise a lifetime so short that the client spends its time refreshing. */
const MIN_ACCESS_TOKEN_TTL_SECONDS = 60;

function readPositiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : (typeof value === 'string' ? Number(value) : NaN);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function issueBridgeTokens({ config, grant, mittwaldTokens }: IssueBridgeTokensArgs): Promise<BridgeTokenResponse> {
  const issuedAt = Math.floor(Date.now() / 1000);

  // The access token carries a snapshot of the Mittwald tokens, so it is only as good as they are.
  // Advertising the configured hour while Mittwald granted less left clients holding a token that
  // looked valid but no longer worked — they had no reason to refresh, and every call failed.
  const mittwaldExpiresIn = readPositiveNumber(mittwaldTokens.expires_in);
  const accessTokenTtl = Math.max(
    MIN_ACCESS_TOKEN_TTL_SECONDS,
    mittwaldExpiresIn
      ? Math.min(config.bridge.accessTokenTtlSeconds, mittwaldExpiresIn - MITTWALD_EXPIRY_SKEW_SECONDS)
      : config.bridge.accessTokenTtlSeconds
  );

  // Same reasoning for the refresh token: ours is useless once Mittwald's has expired.
  const mittwaldRefreshExpiresIn = readPositiveNumber(
    mittwaldTokens.refresh_token_expires_in ?? mittwaldTokens.refresh_expires_in
  );
  const refreshTokenTtl = mittwaldRefreshExpiresIn
    ? Math.min(config.bridge.refreshTokenTtlSeconds, mittwaldRefreshExpiresIn)
    : config.bridge.refreshTokenTtlSeconds;

  const accessTokenExpiresAt = issuedAt + accessTokenTtl;
  const refreshTokenExpiresAt = issuedAt + refreshTokenTtl;

  const payload = {
    sub: grant.clientId,
    scope: grant.scope,
    mittwald: mittwaldTokens,
    resource: grant.resource
  };

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(issuedAt)
    .setIssuer(config.bridge.issuer)
    .setAudience(grant.clientId)
    .setExpirationTime(accessTokenExpiresAt)
    .sign(new TextEncoder().encode(config.bridge.jwtSecret));

  const refreshToken = randomUUID();

  return {
    accessToken,
    accessTokenExpiresAt,
    expiresIn: accessTokenTtl,
    refreshToken,
    refreshTokenExpiresAt
  };
}
