import type { Configuration } from 'oidc-provider';
import { createAdapter } from './adapters.js';
import { logger } from '../services/logger.js';
import { JWKSManager } from '../services/jwks-keystore.js';
import { nanoid } from 'nanoid';
import { getDefaultScopeString } from './oauth-scopes.js';

export interface ProviderConfig {
  issuer: string;
  port: number;
  storageAdapter: 'sqlite' | 'memory';
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
        async getResourceServerInfo(_ctx: any, resourceIndicator: string, _client: any) {
          try {
            const allowed = process.env.ALLOWED_RESOURCE || 'https://mittwald-mcp-fly2.fly.dev/mcp';
            const u = new URL(resourceIndicator);
            const allowUrl = new URL(allowed);
            const matches = u.host === allowUrl.host && u.pathname === allowUrl.pathname;
            if (!matches) {
              await throwInvalidTarget();
            }
            // Return resource server definition
            return {
              scope: getDefaultScopeString(),
              audience: resourceIndicator,
              accessTokenFormat: 'jwt',
            } as any;
          } catch {
            await throwInvalidTarget();
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
    
    // Scopes (OIDC + Mittwald custom)
    scopes: new Set([
      // OIDC standard scopes
      'openid',
      'profile',
      'email',
      'offline_access', // For refresh tokens

      // Mittwald custom scopes
      'user:read',
      'customer:read',
      'project:read',
      'project:write',
      'database:read',
      'database:write',
      'app:read',
      'app:write',
      'domain:read',
      'domain:write',
      // Additional scopes can be added dynamically
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

    // Client authentication (support both public and confidential clients)
    clientAuthMethods: new Set(['none', 'client_secret_post']),
    
    // Custom client defaults
    clientDefaults: {
      // Allow clients to register with refresh_token in grant_types.
      // oidc-provider will still enforce actual support via provider.grantTypes
      // and token issuance policy.
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // Default to public, but allow override
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

async function throwInvalidTarget(): Promise<never> {
  const oidcProvider = await import('oidc-provider');
  const errors = (oidcProvider as any).errors;
  throw new errors.InvalidTarget();
}
