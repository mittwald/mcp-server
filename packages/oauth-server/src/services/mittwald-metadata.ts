import { Issuer, type Client } from 'openid-client';
import { logger } from './logger.js';

export type ScopeResolutionSource = 'client' | 'discovery' | 'fallback' | 'none' | 'mittwald';

export interface MittwaldMetadata {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
  scopesSupported?: string[];
  defaultScope?: string;
  source: 'discovery' | 'manual';
}

interface ScopeResolution {
  scope?: string;
  source: ScopeResolutionSource;
}

let metadataCache: MittwaldMetadata | null = null;
let issuerCache: Issuer<Client> | null = null;
let metadataPromise: Promise<MittwaldMetadata> | null = null;

function normalizeScopeString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean).join(' ') || undefined;
  }
  return undefined;
}

function parseSupportedScopes(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const scopes = value.map((entry) => String(entry).trim()).filter(Boolean);
    return scopes.length ? scopes : undefined;
  }
  if (typeof value === 'string') {
    const scopes = value.split(/\s+/).map((entry) => entry.trim()).filter(Boolean);
    return scopes.length ? scopes : undefined;
  }
  return undefined;
}

async function discoverMittwaldMetadata(): Promise<MittwaldMetadata | null> {
  const issuerUrl = process.env.MITTWALD_ISSUER?.trim();
  if (!issuerUrl) return null;

  try {
    const discoveredIssuer = await Issuer.discover(issuerUrl);
    issuerCache = discoveredIssuer;

    const metadata = discoveredIssuer.metadata;

    if (typeof metadata.authorization_endpoint !== 'string' || typeof metadata.token_endpoint !== 'string') {
      throw new Error('Mittwald discovery document missing authorization or token endpoint');
    }

    const userinfoEndpoint = typeof metadata.userinfo_endpoint === 'string'
      ? metadata.userinfo_endpoint
      : undefined;

    const issuerValue = typeof discoveredIssuer.issuer === 'string'
      ? discoveredIssuer.issuer
      : issuerUrl;

    const result: MittwaldMetadata = {
      issuer: issuerValue,
      authorizationEndpoint: metadata.authorization_endpoint,
      tokenEndpoint: metadata.token_endpoint,
      userinfoEndpoint,
      scopesSupported: parseSupportedScopes(metadata.scopes_supported),
      defaultScope: normalizeScopeString(metadata.default_scope),
      source: 'discovery',
    };

    logger.info('MITTWALD METADATA: discovered issuer', {
      issuer: result.issuer,
      authorizationEndpoint: result.authorizationEndpoint,
      tokenEndpoint: result.tokenEndpoint,
      scopesSupported: result.scopesSupported?.length ?? 0,
      defaultScopeLength: result.defaultScope?.length ?? 0,
    });

    return result;
  } catch (error) {
    logger.warn('MITTWALD METADATA: discovery failed, falling back to manual configuration', {
      issuer: issuerUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function buildManualMetadata(): Promise<MittwaldMetadata> {
  const authorizationUrl = process.env.MITTWALD_AUTHORIZATION_URL?.trim();
  const tokenUrl = process.env.MITTWALD_TOKEN_URL?.trim();

  if (!authorizationUrl || !tokenUrl) {
    throw new Error('Missing Mittwald OAuth endpoints. Provide MITTWALD_ISSUER for discovery or set MITTWALD_AUTHORIZATION_URL and MITTWALD_TOKEN_URL.');
  }

  const issuerValue = process.env.MITTWALD_ISSUER?.trim() || 'https://mittwald-idp';
  const userinfoUrl = process.env.MITTWALD_USERINFO_URL?.trim();

  issuerCache = new Issuer({
    issuer: issuerValue,
    authorization_endpoint: authorizationUrl,
    token_endpoint: tokenUrl,
    userinfo_endpoint: userinfoUrl,
  });

  const fallbackScopes = parseSupportedScopes(process.env.MITTWALD_SCOPES_SUPPORTED);
  const fallbackDefaultScope = normalizeScopeString(process.env.MITTWALD_SCOPE_FALLBACK);

  logger.info('MITTWALD METADATA: using manual configuration', {
    authorizationEndpoint: authorizationUrl,
    tokenEndpoint: tokenUrl,
    hasUserinfo: !!userinfoUrl,
    fallbackScopeLength: fallbackDefaultScope?.length ?? 0,
  });

  return {
    issuer: issuerValue,
    authorizationEndpoint: authorizationUrl,
    tokenEndpoint: tokenUrl,
    userinfoEndpoint: userinfoUrl,
    scopesSupported: fallbackScopes,
    defaultScope: fallbackDefaultScope,
    source: 'manual',
  };
}

async function ensureMetadataLoaded(): Promise<MittwaldMetadata> {
  if (metadataCache) return metadataCache;
  if (!metadataPromise) {
    metadataPromise = (async () => {
      const discovered = await discoverMittwaldMetadata();
      const metadata = discovered ?? (await buildManualMetadata());
      metadataCache = metadata;
      metadataPromise = null;
      return metadata;
    })();
  }
  return metadataPromise;
}

export async function getMittwaldMetadata(): Promise<MittwaldMetadata> {
  return ensureMetadataLoaded();
}

export function getCachedMittwaldMetadata(): MittwaldMetadata | null {
  return metadataCache;
}

export async function getMittwaldIssuer(): Promise<Issuer<Client>> {
  if (issuerCache) return issuerCache;
  await ensureMetadataLoaded();
  if (!issuerCache) {
    throw new Error('Mittwald issuer metadata not initialized');
  }
  return issuerCache;
}

export function resolveAuthorizationScope(
  metadata: MittwaldMetadata | null,
  requestedScope?: string | null
): ScopeResolution {
  if (requestedScope) {
    const trimmed = requestedScope.trim();
    if (trimmed) {
      return { scope: trimmed, source: 'client' };
    }
  }

  if (metadata?.defaultScope) {
    return { scope: metadata.defaultScope, source: 'discovery' };
  }

  const fallback = process.env.MITTWALD_SCOPE_FALLBACK?.trim();
  if (fallback) {
    return { scope: fallback, source: 'fallback' };
  }

  return { scope: undefined, source: 'none' };
}

export function recordScopeResolution(resolution: ScopeResolution, context: Record<string, unknown> = {}): void {
  const logContext = {
    ...context,
    scopeSource: resolution.source,
    hasScope: !!resolution.scope,
  };

  if (resolution.source === 'fallback') {
    logger.warn('MITTWALD SCOPE: using fallback scope string', logContext);
  } else if (resolution.source === 'none') {
    logger.info('MITTWALD SCOPE: allowing Mittwald defaults (no scope parameter)', logContext);
  } else if (resolution.source === 'mittwald') {
    logger.info('MITTWALD SCOPE: using scope returned by Mittwald', logContext);
  } else {
    logger.info('MITTWALD SCOPE: resolved scope string', logContext);
  }
}

export function extractScopeString(input: unknown): string | undefined {
  return normalizeScopeString(input);
}
