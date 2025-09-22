import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { getSupportedScopes } from '../config/oauth-scopes.js';

export class OAuthMetadataRoutes {
  private router: Router;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.router = Router();
    // Prefer explicit public base for MCP, then BASE_URL, then localhost fallback
    this.baseUrl = baseUrl || process.env.MCP_PUBLIC_BASE || process.env.BASE_URL || (process.env.ENABLE_HTTPS === 'true' ? 'https://localhost:3000' : 'http://localhost:3000');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // OAuth 2.0 Authorization Server Metadata (RFC 8414)
    this.router.get('/.well-known/oauth-authorization-server', this.handleAuthorizationServerMetadata.bind(this));
    // Compatibility path used by some MCP clients (suffix /mcp). Redirect to AS metadata
    this.router.get('/.well-known/oauth-authorization-server/mcp', (req, res) => {
      const asBase = process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-server.fly.dev';
      return res.redirect(302, `${asBase}/.well-known/oauth-authorization-server`);
    });
    
    // OAuth 2.0 Protected Resource Metadata (for MCP)
    this.router.get('/.well-known/oauth-protected-resource', this.handleProtectedResourceMetadata.bind(this));
    // Alias endpoint with /mcp suffix that Inspector tries to access
    this.router.get('/.well-known/oauth-protected-resource/mcp', this.handleProtectedResourceMetadata.bind(this));
  }

  private async handleAuthorizationServerMetadata(req: Request, res: Response): Promise<void> {
    try {
      const asBase = process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-server.fly.dev';
      const metadata = {
        issuer: asBase,
        authorization_endpoint: `${asBase}/auth`,
        token_endpoint: `${asBase}/token`,
        userinfo_endpoint: `${asBase}/me`,
        revocation_endpoint: `${asBase}/token/revocation`,
        registration_endpoint: `${asBase}/reg`,
        jwks_uri: `${asBase}/jwks`,
        scopes_supported: getSupportedScopes(),
        response_types_supported: [
          'code'
        ],
        response_modes_supported: [
          'query'
        ],
        grant_types_supported: [
          'authorization_code',
          'refresh_token'
        ],
        code_challenge_methods_supported: [
          'S256'
        ],
        subject_types_supported: [
          'public'
        ],
        id_token_signing_alg_values_supported: [
          'RS256'
        ],
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'client_secret_post',
          'none'
        ],
        claims_supported: [
          'sub',
          'iss',
          'aud',
          'exp',
          'iat',
          'email',
          'name',
          'preferred_username'
        ]
      };

      logger.debug('Serving OAuth authorization server metadata', {
        requestedFrom: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Add cache-busting headers to force client re-discovery
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Last-Modified', new Date().toUTCString());

      res.json(metadata);
    } catch (error) {
      logger.error('Failed to serve authorization server metadata', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to retrieve authorization server metadata'
      });
    }
  }

  private async handleProtectedResourceMetadata(req: Request, res: Response): Promise<void> {
    try {
      const asBase = process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-server.fly.dev';
      const resourceUrl = `${this.baseUrl}/mcp`;
      const metadata = {
        resource: resourceUrl,
        authorization_servers: [asBase],
        scopes_supported: getSupportedScopes(),
        bearer_methods_supported: [
          'header',
          'query'
        ],
        resource_documentation: `${this.baseUrl}/docs`,
        resource_policy_uri: `${this.baseUrl}/policy`,
        resource_tos_uri: `${this.baseUrl}/terms`,
        // MCP-specific metadata
        mcp_version: '2025-01-07',
        mcp_capabilities: {
          tools: true,
          resources: true,
          prompts: true,
          roots: false
        }
      };

      logger.debug('Serving OAuth protected resource metadata', {
        requestedFrom: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Add cache-busting headers to force client re-discovery
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Last-Modified', new Date().toUTCString());

      res.json(metadata);
    } catch (error) {
      logger.error('Failed to serve protected resource metadata', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to retrieve protected resource metadata'
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
