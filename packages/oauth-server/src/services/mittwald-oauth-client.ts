import { Issuer, generators, Client } from 'openid-client';
import { logger } from './logger.js';
import { getDefaultScopeString } from '../../../../src/config/oauth-scopes.js';

export interface MittwaldConfig {
  issuer: string; // label for issuer (not discovery)
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl?: string;
  clientId: string;
  redirectUri: string;
  scope?: string; // default: 'openid profile email'
}

let cachedClient: Client | null = null;
let cachedConfig: MittwaldConfig | null = null;

export async function getMittwaldClient(cfg?: Partial<MittwaldConfig>): Promise<{ client: Client; config: MittwaldConfig }>{
  if (cachedClient && cachedConfig) return { client: cachedClient, config: cachedConfig };

  const envIssuer = cfg?.issuer || process.env.MITTWALD_ISSUER; // e.g., https://id.mittwald.de
  const clientId = cfg?.clientId || process.env.MITTWALD_CLIENT_ID;
  const redirectUri = cfg?.redirectUri || process.env.MITTWALD_REDIRECT_URI;
  const scope = cfg?.scope || process.env.MITTWALD_SCOPE || getDefaultScopeString();

  if (!clientId || !redirectUri) {
    throw new Error('Missing Mittwald OAuth config (MITTWALD_CLIENT_ID, MITTWALD_REDIRECT_URI)');
  }

  let issuerMeta: Issuer<Client>;
  if (envIssuer) {
    // Prefer OIDC Discovery when MITTWALD_ISSUER is provided
    issuerMeta = await Issuer.discover(envIssuer);
  } else {
    // Fall back to explicit endpoints
    const authorizationUrl = cfg?.authorizationUrl || process.env.MITTWALD_AUTHORIZATION_URL;
    const tokenUrl = cfg?.tokenUrl || process.env.MITTWALD_TOKEN_URL;
    const userinfoUrl = cfg?.userinfoUrl || process.env.MITTWALD_USERINFO_URL;
    const issuer = cfg?.issuer || 'https://mittwald-idp';
    if (!authorizationUrl || !tokenUrl) {
      throw new Error('Missing Mittwald OAuth endpoints (MITTWALD_AUTHORIZATION_URL, MITTWALD_TOKEN_URL) or set MITTWALD_ISSUER for discovery');
    }
    const metadata: any = {
      issuer,
      authorization_endpoint: authorizationUrl,
      token_endpoint: tokenUrl,
    };
    if (userinfoUrl) metadata.userinfo_endpoint = userinfoUrl;
    issuerMeta = new Issuer(metadata);
  }

  const client = new issuerMeta.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'none',
  });

  const effectiveConfig: MittwaldConfig = {
    issuer: (envIssuer ?? issuerMeta.issuer) as string,
    authorizationUrl: (issuerMeta.metadata as any).authorization_endpoint,
    tokenUrl: (issuerMeta.metadata as any).token_endpoint,
    userinfoUrl: (issuerMeta.metadata as any).userinfo_endpoint,
    clientId,
    redirectUri,
    scope,
  };

  cachedClient = client;
  cachedConfig = effectiveConfig;
  logger.info('Initialized Mittwald OAuth client', {
    issuer: effectiveConfig.issuer,
    authorizationUrl: effectiveConfig.authorizationUrl,
    tokenUrl: effectiveConfig.tokenUrl,
    redirectUri: effectiveConfig.redirectUri,
  });
  return { client, config: effectiveConfig };
}

export function createPkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
