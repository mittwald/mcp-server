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
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

export async function issueBridgeTokens({ config, grant, mittwaldTokens }: IssueBridgeTokensArgs): Promise<BridgeTokenResponse> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const accessTokenExpiresAt = issuedAt + config.bridge.accessTokenTtlSeconds;
  const refreshTokenExpiresAt = issuedAt + config.bridge.refreshTokenTtlSeconds;

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
    refreshToken,
    refreshTokenExpiresAt
  };
}
