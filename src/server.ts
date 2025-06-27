#!/usr/bin/env node
/**
 * @file Main HTTP server for Reddit MCP
 * @module server
 * 
 * @remarks
 * This module provides the Express.js HTTP server that handles:
 * - OAuth 2.1 authentication flows (Steps 1-8 of MCP OAuth spec)
 * - MCP protocol endpoints with authentication
 * - Health checks and metadata endpoints
 * 
 * OAuth Flow Integration:
 * @see https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
 * 
 * 1. Client requests /mcp without auth → 401 with WWW-Authenticate
 * 2. Client discovers metadata endpoints from WWW-Authenticate
 * 3. Client gets auth server info from /.well-known endpoints
 * 4. Client optionally registers at /oauth/register
 * 5. User authorizes at /oauth/authorize (redirects to Reddit)
 * 6. Reddit calls back to /oauth/reddit/callback
 * 7. Client exchanges code at /oauth/token
 * 8. Client uses JWT token for authenticated /mcp requests
 * 
 * The server can be run standalone or integrated with platforms like Smithery.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { CONFIG, VALID_REDIRECT_URIS, OAUTH_DISABLED } from './server/config.js';
import { OAuthProvider } from './server/oauth.js';
import { MCPHandler } from './server/mcp.js';
import { setMCPHandlerInstance } from './server/mcp.js';
import { bypassAuthMiddleware } from './server/bypass-auth.js';
import { getMittwaldClient } from './services/mittwald/index.js';

// Polyfill for jose library
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto as any;
}

/**
 * Creates and configures the Express application
 * 
 * @remarks
 * Sets up the complete MCP OAuth flow:
 * - OAuthProvider handles Steps 1-7 (auth flow)
 * - MCPHandler handles Step 8 (authenticated requests)
 * 
 * @returns Configured Express application with OAuth endpoints
 */
export async function createApp(): Promise<express.Application> {
  const app = express();
  
  // Initialize auth middleware based on configuration
  let authMiddleware: express.RequestHandler;
  
  if (OAUTH_DISABLED) {
    // Use bypass auth for non-OAuth environments
    authMiddleware = bypassAuthMiddleware();
    console.log('🔓 OAuth disabled - running without authentication');
  } else {
    // Initialize OAuth provider for MCP authentication
    const oauthProvider = new OAuthProvider({
      ...CONFIG,
      validRedirectUris: VALID_REDIRECT_URIS,
    });
    oauthProvider.setupRoutes(app);
    authMiddleware = oauthProvider.authMiddleware();
  }
  
  // Initialize MCP handler for protocol implementation with proper session support
  const mcpHandler = new MCPHandler();
  
  // Set global instance for notifications
  setMCPHandlerInstance(mcpHandler);

  // Configure CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept'],
      exposedHeaders: ['mcp-session-id', 'x-session-id'],
    })
  );
  
  app.use(cookieParser());

  // Selective body parsing - skip for MCP streaming endpoints
  app.use((req, res, next) => {
    if (req.path === '/mcp') {
      next(); // Skip body parsing for MCP
    } else {
      express.json()(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ extended: true })(req, res, next);
      });
    }
  });

  // Set up routes
  await mcpHandler.setupRoutes(app, authMiddleware);
  setupUtilityRoutes(app);

  return app;
}

/**
 * Sets up utility routes (health, metadata)
 */
function setupUtilityRoutes(app: express.Application): void {
  // Health check
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'mcp-server',
      transport: 'http',
      capabilities: {
        oauth: !OAUTH_DISABLED,
        mcp: true,
      },
    });
  });

  // Mittwald API test endpoint (only when OAuth is disabled and Mittwald is configured)
  if (OAUTH_DISABLED && CONFIG.MITTWALD_API_TOKEN) {
    app.get('/test-auth', async (_req, res) => {
      try {
        const client = getMittwaldClient();
        const connected = await client.testConnection();
        
        if (connected) {
          const userInfo = await client.getUserInfo();
          res.json({
            status: 'success',
            message: 'Successfully authenticated with Mittwald API',
            user: userInfo,
          });
        } else {
          res.status(401).json({
            status: 'error',
            message: 'Failed to authenticate with Mittwald API',
          });
        }
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    });
  }

  // Root endpoint with service metadata
  app.get('/', (req, res) => {
    const protocol =
      req.get('x-forwarded-proto') ||
      (req.get('host')?.includes('systemprompt.io') ? 'https' : req.protocol);
    const baseUrl = `${protocol}://${req.get('host')}`;
    const basePath = req.baseUrl || '';
    
    const endpoints: any = {
      mcp: `${baseUrl}${basePath}/mcp`,
      health: `${baseUrl}${basePath}/health`,
    };
    
    // Only include OAuth endpoints if OAuth is enabled
    if (!OAUTH_DISABLED) {
      endpoints.oauth = {
        authorize: `${baseUrl}${basePath}/oauth/authorize`,
        token: `${baseUrl}${basePath}/oauth/token`,
        metadata: `${baseUrl}/.well-known/oauth-authorization-server`,
      };
    }
    
    // Include test endpoint if Mittwald is configured
    if (OAUTH_DISABLED && CONFIG.MITTWALD_API_TOKEN) {
      endpoints['test-auth'] = `${baseUrl}${basePath}/test-auth`;
    }
    
    res.json({
      service: 'MCP Server',
      version: '1.0.0',
      transport: 'http',
      authRequired: !OAUTH_DISABLED,
      endpoints,
    });
  });
}

/**
 * Starts the HTTP server
 * 
 * @param port - Port number to listen on
 * @returns Server instance
 */
export async function startServer(port?: number): Promise<ReturnType<express.Application['listen']>> {
  const app = await createApp();
  const serverPort = port || parseInt(CONFIG.PORT, 10);
  
  return app.listen(serverPort, '0.0.0.0', () => {
    console.log(`🚀 MCP Server running on port ${serverPort}`);
    if (!OAUTH_DISABLED) {
      console.log(`🔐 OAuth authorize: ${CONFIG.OAUTH_ISSUER}/oauth/authorize`);
    }
    console.log(`📡 MCP endpoint: http://localhost:${serverPort}/mcp`);
    console.log(`❤️  Health: http://localhost:${serverPort}/health`);
    if (OAUTH_DISABLED && CONFIG.MITTWALD_API_TOKEN) {
      console.log(`🧪 Test auth: http://localhost:${serverPort}/test-auth`);
    }
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});