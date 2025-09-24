import type { Configuration } from 'oidc-provider';
import { createAdapter } from './adapters.js';
import { logger } from '../services/logger.js';
import { JWKSManager } from '../services/jwks-keystore.js';
import { nanoid } from 'nanoid';
import { getDefaultScopeString, getSupportedScopes } from './oauth-scopes.js';
import { mittwaldTokenStore } from '../services/mittwald-token-store.js';

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
      
      // Disable userinfo endpoint (not needed without OIDC)
      userinfo: { enabled: false },
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
    
    // Claims configuration (enable minimal OIDC claims for openid scope)
    claims: {
      openid: ['sub'],
      // No profile/email claims since Mittwald doesn't provide them
    },
    
    // Scopes (Mittwald official client configuration + openid for OIDC clients)
    // Scopes: Use centralized configuration (single source of truth)
    scopes: new Set(getSupportedScopes()),
    
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
    
    // Route configuration (OAuth 2.0 only, no OIDC routes)
    routes: {
      authorization: '/auth',
      token: '/token',
      // userinfo: disabled (OIDC feature)
      revocation: '/token/revocation',
      introspection: '/token/introspection',
      registration: '/reg',
      jwks: '/jwks',
      // end_session: disabled (OIDC feature)
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

    // CRITICAL: findAccount function required by oidc-provider for user discovery
    // This function is called during token issuance to retrieve user account data
    async findAccount(ctx: any, sub: string, token?: any) {
      logger.info('FIND ACCOUNT: oidc-provider requesting user account', {
        sub: sub.substring(0, 16) + '...',
        tokenType: token?.kind || 'unknown',
        hasToken: !!token
      });

      try {
        // Retrieve Mittwald tokens for this user from our storage
        const mittwaldTokens = mittwaldTokenStore.get(sub);

        if (!mittwaldTokens) {
          logger.warn('FIND ACCOUNT: No Mittwald tokens found for user', {
            sub: sub.substring(0, 16) + '...',
            storeSize: mittwaldTokenStore.size()
          });

          // Return minimal account for oidc-provider (allows flow to continue)
          return {
            accountId: sub,
            async claims(use: string, scope: string) {
              return {
                sub,
                // No Mittwald tokens available
              };
            }
          };
        }

        logger.info('FIND ACCOUNT: Mittwald tokens found, returning account with claims', {
          sub: sub.substring(0, 16) + '...',
          hasAccessToken: !!mittwaldTokens.accessToken,
          hasRefreshToken: !!mittwaldTokens.refreshToken
        });

        return {
          accountId: sub,
          async claims(use: string, scope: string) {
            logger.info('CLAIMS: Generating token claims for user', {
              sub: sub.substring(0, 16) + '...',
              use,
              scope,
              hasAccessToken: !!mittwaldTokens.accessToken
            });

            return {
              sub,
              // Standard OIDC claims
              email: mittwaldTokens.email,
              name: mittwaldTokens.name,
              // Custom claims for Mittwald tokens (embedded in JWT)
              mittwald_access_token: mittwaldTokens.accessToken,
              mittwald_refresh_token: mittwaldTokens.refreshToken,
              mittwald_issued_at: mittwaldTokens.issuedAt
            };
          }
        };

      } catch (error) {
        logger.error('FIND ACCOUNT: Error retrieving user account', {
          sub: sub.substring(0, 16) + '...',
          error: error instanceof Error ? error.message : String(error)
        });

        // Return minimal account to prevent OAuth flow failure
        return {
          accountId: sub,
          async claims(use: string, scope: string) {
            return { sub };
          }
        };
      }
    },

    // CRITICAL: loadExistingGrant for external OAuth integration
    // Based on Stack Overflow research for federated identity scenarios
    async loadExistingGrant(ctx: any) {
      logger.info('LOAD EXISTING GRANT: Creating grant for external OAuth integration', {
        clientId: ctx?.oidc?.client?.clientId,
        accountId: ctx?.oidc?.session?.accountId,
        requestedScopes: ctx?.oidc?.params?.scope
      });

      try {
        // Create new grant for federated authentication (external OAuth pattern)
        const Grant = ctx.oidc.provider.Grant;
        const grant = new Grant({
          clientId: ctx.oidc.client.clientId,
          accountId: ctx.oidc.session?.accountId || ctx.oidc.params?.sub
        });

        // Add all requested scopes to the grant
        if (ctx.oidc.params?.scope) {
          const scopes = ctx.oidc.params.scope.split(' ');
          for (const scope of scopes) {
            if (scope === 'openid' || scope === 'profile') {
              grant.addOIDCScope(scope);
            } else {
              grant.addResourceScope('https://mittwald-mcp-fly2.fly.dev/mcp', scope);
            }
          }
        }

        // Save grant with TTL (1 hour)
        await grant.save(3600);

        logger.info('LOAD EXISTING GRANT: Grant created successfully', {
          grantId: grant.jti,
          clientId: ctx.oidc.client.clientId,
          scopeCount: ctx.oidc.params?.scope?.split(' ').length || 0
        });

        return grant;

      } catch (error) {
        logger.error('LOAD EXISTING GRANT: Failed to create grant', {
          error: error instanceof Error ? error.message : String(error),
          clientId: ctx?.oidc?.client?.clientId
        });

        // Return null to let oidc-provider handle grant creation
        return null;
      }
    },
  };
}

async function throwInvalidTarget(): Promise<never> {
  const oidcProvider = await import('oidc-provider');
  const errors = (oidcProvider as any).errors;
  throw new errors.InvalidTarget();
}
