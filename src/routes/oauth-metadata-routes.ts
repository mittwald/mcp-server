import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

export class OAuthMetadataRoutes {
  private router: Router;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.router = Router();
    this.baseUrl = baseUrl || process.env.BASE_URL || (process.env.ENABLE_HTTPS === 'true' ? 'https://localhost:3000' : 'http://localhost:3000');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // OAuth 2.0 Authorization Server Metadata (RFC 8414)
    this.router.get('/.well-known/oauth-authorization-server', this.handleAuthorizationServerMetadata.bind(this));
    
    // OAuth 2.0 Protected Resource Metadata (for MCP)
    this.router.get('/.well-known/oauth-protected-resource', this.handleProtectedResourceMetadata.bind(this));
  }

  private async handleAuthorizationServerMetadata(req: Request, res: Response): Promise<void> {
    try {
      const metadata = {
        issuer: this.baseUrl,
        authorization_endpoint: `${this.baseUrl}/oauth/authorize`,
        token_endpoint: `${this.baseUrl}/oauth/token`,
        userinfo_endpoint: `${this.baseUrl}/auth/user-info`,
        revocation_endpoint: `${this.baseUrl}/oauth/revoke`,
        registration_endpoint: `${this.baseUrl}/oauth/register`,
        jwks_uri: `${this.baseUrl}/.well-known/jwks.json`,
        scopes_supported: [
          'openid',
          'profile',
          'user:read',
          'customer:read',
          'project:read'
        ],
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
      const metadata = {
        resource: this.baseUrl,
        authorization_servers: [this.baseUrl],
        scopes_supported: [
          'openid',
          'profile',
          'user:read',
          'customer:read',
          'project:read'
        ],
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