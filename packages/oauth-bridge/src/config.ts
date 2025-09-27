export interface BridgeConfig {
  port: number;
  mittwald: {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
  };
  bridge: {
    issuer: string;
    baseUrl: string;
    jwtSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
  };
  redirectUris: string[];
}

export function loadConfigFromEnv(): BridgeConfig {
  const {
    PORT,
    BRIDGE_ISSUER,
    BRIDGE_BASE_URL,
    MITTWALD_AUTHORIZATION_URL,
    MITTWALD_TOKEN_URL,
    MITTWALD_CLIENT_ID,
    MITTWALD_CLIENT_SECRET,
    BRIDGE_REDIRECT_URIS,
    BRIDGE_JWT_SECRET,
    BRIDGE_ACCESS_TOKEN_TTL_SECONDS,
    BRIDGE_REFRESH_TOKEN_TTL_SECONDS
  } = process.env;

  if (!BRIDGE_ISSUER) {
    throw new Error('BRIDGE_ISSUER must be set');
  }

  if (!BRIDGE_BASE_URL) {
    throw new Error('BRIDGE_BASE_URL must be set');
  }

  if (!MITTWALD_AUTHORIZATION_URL) {
    throw new Error('MITTWALD_AUTHORIZATION_URL must be set');
  }

  if (!MITTWALD_TOKEN_URL) {
    throw new Error('MITTWALD_TOKEN_URL must be set');
  }

  if (!MITTWALD_CLIENT_ID) {
    throw new Error('MITTWALD_CLIENT_ID must be set');
  }

  if (!MITTWALD_CLIENT_SECRET) {
    throw new Error('MITTWALD_CLIENT_SECRET must be set');
  }

  if (!BRIDGE_JWT_SECRET) {
    throw new Error('BRIDGE_JWT_SECRET must be set');
  }

  const redirectUriList = (BRIDGE_REDIRECT_URIS ?? '').split(',').map((value) => value.trim()).filter(Boolean);

  if (redirectUriList.length === 0) {
    throw new Error('BRIDGE_REDIRECT_URIS must include at least one redirect URI');
  }

  return {
    port: Number(PORT ?? 3000),
    bridge: {
      issuer: BRIDGE_ISSUER,
      baseUrl: BRIDGE_BASE_URL,
      jwtSecret: BRIDGE_JWT_SECRET,
      accessTokenTtlSeconds: Number(BRIDGE_ACCESS_TOKEN_TTL_SECONDS ?? 3600),
      refreshTokenTtlSeconds: Number(BRIDGE_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 3600)
    },
    mittwald: {
      authorizationUrl: MITTWALD_AUTHORIZATION_URL,
      tokenUrl: MITTWALD_TOKEN_URL,
      clientId: MITTWALD_CLIENT_ID,
      clientSecret: MITTWALD_CLIENT_SECRET
    },
    redirectUris: redirectUriList
  };
}
