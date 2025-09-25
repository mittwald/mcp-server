import { generators, Client } from 'openid-client';
import { logger } from './logger.js';
import {
  getMittwaldIssuer,
  getMittwaldMetadata,
  resolveAuthorizationScope,
  recordScopeResolution,
} from './mittwald-metadata.js';
import type { MittwaldMetadata, ScopeResolutionSource } from './mittwald-metadata.js';

export interface MittwaldConfig {
  issuer: string; // label for issuer (not discovery)
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl?: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  scopeSource?: ScopeResolutionSource;
  metadata: MittwaldMetadata;
}

let cachedClient: Client | null = null;
let cachedConfig: MittwaldConfig | null = null;

export async function getMittwaldClient(cfg?: Partial<MittwaldConfig>): Promise<{ client: Client; config: MittwaldConfig }>{
  if (cachedClient && cachedConfig) return { client: cachedClient, config: cachedConfig };

  const clientId = cfg?.clientId || process.env.MITTWALD_CLIENT_ID;
  const redirectUri = cfg?.redirectUri || process.env.MITTWALD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing Mittwald OAuth config (MITTWALD_CLIENT_ID, MITTWALD_REDIRECT_URI)');
  }

  const metadata = await getMittwaldMetadata();
  const issuerMeta = await getMittwaldIssuer();

  const client = new issuerMeta.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'none',
  });

  // Optional override scope from cfg/env for tooling, otherwise rely on metadata helper
  const requestedScope = cfg?.scope || process.env.MITTWALD_SCOPE;
  const scopeResolution = resolveAuthorizationScope(metadata, requestedScope);
  recordScopeResolution(scopeResolution, { phase: 'mittwald-client-init' });

  const effectiveConfig: MittwaldConfig = {
    issuer: metadata.issuer,
    authorizationUrl: metadata.authorizationEndpoint,
    tokenUrl: metadata.tokenEndpoint,
    userinfoUrl: metadata.userinfoEndpoint,
    clientId,
    redirectUri,
    scope: scopeResolution.scope,
    scopeSource: scopeResolution.source,
    metadata,
  };

  cachedClient = client;
  cachedConfig = effectiveConfig;
  logger.info('Initialized Mittwald OAuth client', {
    issuer: effectiveConfig.issuer,
    authorizationUrl: effectiveConfig.authorizationUrl,
    tokenUrl: effectiveConfig.tokenUrl,
    redirectUri: effectiveConfig.redirectUri,
    scopeSource: effectiveConfig.scopeSource,
  });
  return { client, config: effectiveConfig };
}

export function createPkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
