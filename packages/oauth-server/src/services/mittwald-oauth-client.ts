import { Issuer, generators, Client } from 'openid-client';
import { logger } from './logger.js';

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

  const authorizationUrl = cfg?.authorizationUrl || process.env.MITTWALD_AUTHORIZATION_URL;
  const tokenUrl = cfg?.tokenUrl || process.env.MITTWALD_TOKEN_URL;
  const userinfoUrl = cfg?.userinfoUrl || process.env.MITTWALD_USERINFO_URL;
  const issuer = cfg?.issuer || process.env.MITTWALD_ISSUER || 'https://api.mittwald.de';
  const clientId = cfg?.clientId || process.env.MITTWALD_CLIENT_ID;
  const redirectUri = cfg?.redirectUri || process.env.MITTWALD_REDIRECT_URI;
  const scope = cfg?.scope || process.env.MITTWALD_SCOPE || 'openid profile email';

  if (!authorizationUrl || !tokenUrl || !clientId || !redirectUri) {
    throw new Error('Missing Mittwald OAuth config (MITTWALD_AUTHORIZATION_URL, MITTWALD_TOKEN_URL, MITTWALD_CLIENT_ID, MITTWALD_REDIRECT_URI)');
  }

  const metadata: any = {
    issuer,
    authorization_endpoint: authorizationUrl,
    token_endpoint: tokenUrl,
  };
  if (userinfoUrl) metadata.userinfo_endpoint = userinfoUrl;

  const constructed = new Issuer(metadata);
  const client = new constructed.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'none',
  });

  cachedClient = client;
  cachedConfig = { issuer, authorizationUrl, tokenUrl, userinfoUrl, clientId, redirectUri, scope };
  logger.info('Initialized Mittwald OAuth client', { authorizationUrl, tokenUrl, redirectUri });
  return { client, config: cachedConfig };
}

export function createPkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
