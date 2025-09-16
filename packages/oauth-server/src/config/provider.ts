import Provider, { type Configuration } from 'oidc-provider';
import { createAdapter } from './adapters.js';
import { logger } from '../services/logger.js';
import { JWKSManager } from '../services/jwks-keystore.js';
import { nanoid } from 'nanoid';
import type { ClientMetadata } from '../types/provider.js';

export interface ProviderConfig {
  issuer: string;
  port: number;
  redisUrl?: string;
  storageAdapter: 'redis' | 'memory';
  initialAccessToken: string;
  jwksKeystorePath: string;
  cookiesSecure: boolean;
  cookieKeys?: string[]; // Add cookie keys to config
  allowedRedirectUriPatterns: string[];
  tokenTtls: {
    accessToken: number;
    idToken: number;
    refreshToken: number;
  };
}

export async function createProviderConfiguration(config: ProviderConfig): Promise<Configuration> {
  // Initialize JWKS keystore
  const jwksManager = new JWKSManager(config.jwksKeystorePath);
  const keystore = await jwksManager.ensureKeystore();
  return {
    // Basic configuration
    issuer: config.issuer,
    
    // Client configuration for DCR
    clients: [],
    
    // Storage adapter
    adapter: createAdapter(config.storageAdapter),
    
  // PKCE configuration (v9: methods field removed; keep mandatory PKCE)
  pkce: {
    required: () => true, // Always require PKCE
  },
    
    // Grant types and response types
    grantTypes: new Set([
      'authorization_code',
      'refresh_token',
    ]),
    
    responseTypes: new Set([
      'code',
    ]),
    
    // Features configuration
    features: {
      // Disable dev interactions in production; keep enabled for local/dev
      devInteractions: {
        enabled: process.env.NODE_ENV !== 'production',
      },
      // Enable Dynamic Client Registration (open, no Initial Access Token required)
      registration: {
        enabled: true,
        initialAccessToken: false,
      },
      
      // Enable token revocation
      revocation: { enabled: true },
      
      // Enable introspection (for debugging)
      introspection: { 
        enabled: true,
        allowedPolicy: 'client-credentials',
      },
      
      // JWT features
      jwtResponseModes: { enabled: false },
      
      // Device authorization
      deviceFlow: { enabled: false },
      
      // Enable userinfo endpoint
      userinfo: { enabled: true },
      // Enable Resource Indicators (RFC 8707) so Inspector can send `resource`.
      resourceIndicators: {
        enabled: true,
        // Validate requested resource and define resource server info
        // Accept the MCP resource URL and map scopes/audience accordingly.
        async getResourceServerInfo(ctx: any, resourceIndicator: string, client: any) {
          try {
            const allowed = process.env.ALLOWED_RESOURCE || 'https://mittwald-mcp-fly2.fly.dev/mcp';
            const u = new URL(resourceIndicator);
            const allowUrl = new URL(allowed);
            const matches = u.host === allowUrl.host && u.pathname === allowUrl.pathname;
            if (!matches) {
              // Reject other resources with invalid_target
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { errors } = require('oidc-provider');
              throw new errors.InvalidTarget();
            }
            // Return resource server definition
            return {
              scope: 'profile user:read customer:read project:read',
              audience: resourceIndicator,
              accessTokenFormat: 'jwt',
            } as any;
          } catch {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { errors } = require('oidc-provider');
            throw new errors.InvalidTarget();
          }
        },
      },
    },
    
    // JWT configuration
    jwks: {
      keys: keystore.keys,
    },
    
    // Token TTLs
    ttl: {
      AccessToken: config.tokenTtls.accessToken,
      AuthorizationCode: 600, // 10 minutes
      ClientCredentials: config.tokenTtls.accessToken,
      DeviceCode: 600,
      IdToken: config.tokenTtls.idToken,
      RefreshToken: config.tokenTtls.refreshToken,
      Interaction: 3600, // 1 hour
      Session: 1209600, // 14 days
      Grant: 1209600, // 14 days
    },
    
    // Claims configuration
    claims: {
      openid: ['sub'],
      profile: ['name', 'given_name', 'family_name', 'preferred_username', 'picture', 'locale', 'updated_at'],
      email: ['email', 'email_verified'],
    },
    
    // Scopes
    scopes: new Set([
      'openid',
      'profile',
      'email',
      'user:read',
      'customer:read',
      'project:read',
      // Custom scopes can be added dynamically
    ]),
    
    // Subject types
    subjectTypes: ['public'],
    
    // Response modes
    responseModes: new Set(['query', 'fragment']),
    
    // Cookies configuration
    cookies: {
      keys: config.cookieKeys || [nanoid(32)], // Use provided keys or fallback
      long: {
        signed: true,
        secure: config.cookiesSecure,
        httpOnly: true,
        // Allow cookies in third‑party contexts (Electron/WebView redirects)
        sameSite: 'none',
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      },
      short: {
        signed: true,
        secure: config.cookiesSecure,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 10 * 60 * 1000, // 10 minutes
      },
      names: {
        session: '_session',
        interaction: '_interaction',
        resume: '_resume',
        state: '_state',
      },
    },
    
    // Interaction configuration
    interactions: {
      url(ctx: any, interaction: any) {
        return `/interaction/${interaction.uid}`;
      },
    },
    
    // Custom token format (JWT)
    formats: {
      AccessToken: 'jwt',
      ClientCredentials: 'jwt',
    },
    
    // Extra token claims
    extraTokenClaims(ctx: any, token: any) {
      return {
        // Add custom claims based on token type
        ...(token.kind === 'AccessToken' && {
          // Add MCP-specific claims
          mcp_server: config.issuer.replace('auth.', 'mcp.'),
        }),
      };
    },
    
    // Control refresh token issuance policy to not depend on client's grant_types
    issueRefreshToken: async (ctx: any, client: any, code: any) => {
      // Issue refresh tokens for public/native clients or when offline_access is granted
      try {
        const hasOffline = code?.scopes?.has?.('offline_access') || false;
        const isPublic = client?.clientAuthMethod === 'none';
        const isWeb = client?.applicationType === 'web' || client?.applicationType === 'native';
        return hasOffline || (isPublic && isWeb);
      } catch {
        return false;
      }
    },

    // Client authentication
    clientAuthMethods: new Set(['none']), // Only public clients
    
    // Custom client defaults
    clientDefaults: {
      // Allow clients to register with refresh_token in grant_types.
      // oidc-provider will still enforce actual support via provider.grantTypes
      // and token issuance policy.
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      application_type: 'native',
      require_auth_time: false,
    },
    
    // Route configuration
    routes: {
      authorization: '/auth',
      token: '/token',
      userinfo: '/me',
      revocation: '/token/revocation',
      introspection: '/token/introspection',
      registration: '/reg',
      jwks: '/jwks',
      end_session: '/session/end',
    },
    

    // Render errors
    renderError: (ctx: any, out: any, error: any) => {
      logger.error('OAuth error', {
        error: error.message,
        error_description: error.error_description,
        requestId: ctx.state.requestId,
      });
      
      ctx.type = 'application/json';
      ctx.body = {
        error: error.error || 'server_error',
        error_description: error.error_description || error.message || 'Internal server error',
      };
    },
  };
}

function isAllowedRedirectUri(uri: string, patterns: string[]): boolean {
  try {
    const url = new URL(uri);
    const isHttpScheme = url.protocol === 'http:' || url.protocol === 'https:';
    // In production enforce HTTPS only for HTTP(S) schemes; allow loopback hosts for native apps per RFC 8252
    if (
      process.env.NODE_ENV === 'production' &&
      isHttpScheme &&
      url.protocol !== 'https:' &&
      !isLoopbackHost(url.hostname)
    ) {
      return false;
    }
    
    // Check against allowed patterns
    for (const pattern of patterns) {
      if (matchesPattern(uri, pattern)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

function matchesPattern(uri: string, pattern: string): boolean {
  // Simple pattern matching with wildcards
  const regex = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
    .replace(/\\\*/g, '.*'); // Replace \* with .*
  
  return new RegExp(`^${regex}$`).test(uri);
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}
