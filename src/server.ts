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
import https from 'https';
import fs from 'fs';
import { CONFIG, VALID_REDIRECT_URIS, OAUTH_DISABLED } from './server/config.js';
// OAuth is disabled for Mittwald integration
import { MCPHandler } from './server/mcp.js';
import { setMCPHandlerInstance } from './server/mcp.js';
import { bypassAuthMiddleware } from './server/bypass-auth.js';
import { createOAuthMiddleware } from './server/oauth-middleware.js';
import { getMittwaldClient } from './services/mittwald/index.js';
import { responseLoggerMiddleware } from './server/response-logger.js';
import { initializeToolHandlers } from './handlers/tool-handlers.js';
import { MittwaldOAuthClient, OAuthConfig } from './auth/oauth-client.js';
import { AuthRoutes } from './routes/auth-routes.js';
import { OAuthMetadataRoutes } from './routes/oauth-metadata-routes.js';
import { logger } from './utils/logger.js';

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
    // Use OAuth authentication middleware
    authMiddleware = createOAuthMiddleware();
    console.log('🔐 OAuth enabled - authentication required');
  }
  
  // Initialize tools before setting up MCP handler
  await initializeToolHandlers();
  
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

  // Add comprehensive request/response logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();
    const clientAddr = req.ip || req.connection.remoteAddress || 'unknown';
    const originalSend = res.send;
    
    // Log incoming request
    console.log(`💫 [${clientAddr}] ${req.method} ${req.originalUrl} - User-Agent: ${req.get('User-Agent') || 'unknown'}`);
    
    // Override res.send to log response
    res.send = function(body) {
      const duration = Date.now() - startTime;
      const contentLength = Buffer.isBuffer(body) ? body.length : (typeof body === 'string' ? Buffer.byteLength(body) : 0);
      console.log(`📤 [${clientAddr}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms, ${contentLength} bytes)`);
      return originalSend.call(this, body);
    };
    
    next();
  });
  
  // Add response size logging middleware
  app.use(responseLoggerMiddleware());

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
  await setupUtilityRoutes(app);
  
  // Add error handling for uncaught errors
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientAddr = req.ip || req.connection.remoteAddress || 'unknown';
    console.error(`🚨 [${clientAddr}] Express error on ${req.method} ${req.originalUrl}:`, error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  });
  
  // Log when app is ready
  console.log('✅ Express application configured successfully');

  return app;
}

/**
 * Sets up utility routes (health, metadata)
 */
async function setupUtilityRoutes(app: express.Application): Promise<void> {
  // OAuth authentication routes
  if (!OAUTH_DISABLED) {
    // OAuth metadata routes (for MCP endpoint discovery)
    const oauthMetadataRoutes = new OAuthMetadataRoutes();
    app.use('', oauthMetadataRoutes.getRouter());
    
    // OAuth authentication routes (login, callback, etc.)
    const oauthConfig = {
      issuer: CONFIG.OAUTH_ISSUER,
      clientId: 'mittwald-mcp-server',
      clientSecret: 'dev-secret', // For MockOAuth2Server
      redirectUri: `https://localhost:${CONFIG.PORT}/auth/callback`,
      scopes: ['openid', 'profile', 'user:read', 'customer:read', 'project:read']
    };
    const mittwaldOAuthClient = new MittwaldOAuthClient(oauthConfig);
    await mittwaldOAuthClient.initialize();
    const authRoutes = new AuthRoutes(mittwaldOAuthClient);
    app.use('/auth', authRoutes.getRouter());
    
    // OAuth 2.0 compliant authorization endpoint (RFC 6749) - Industry standard path
    app.get('/oauth/authorize', async (req, res) => {
      try {
        // OAuth 2.0 spec requires these parameters
        const { response_type, client_id, redirect_uri, scope, state } = req.query;
        
        if (!response_type || !client_id) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing required parameters: response_type and client_id'
          });
        }
        
        if (response_type !== 'code') {
          return res.status(400).json({
            error: 'unsupported_response_type',
            error_description: 'Only response_type=code is supported'
          });
        }
        
        // Generate OAuth state and PKCE parameters
        const oauthState = await authRoutes.getStateManager().createState();
        const { authUrl, codeVerifier, codeChallenge } = await mittwaldOAuthClient.generateAuthUrl(oauthState.state);
        
        // Update state with PKCE parameters
        await authRoutes.getStateManager().updateState(oauthState.state, {
          codeVerifier,
          codeChallenge
        });

        // Store state in session cookie for security
        res.cookie('oauth_state', oauthState.state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60 * 1000, // 10 minutes
          sameSite: 'lax'
        });

        logger.info('OAuth 2.0 authorization initiated', { 
          client_id,
          state: oauthState.state,
          redirect_uri 
        });

        // Redirect to OAuth provider (MockOAuth2Server)
        return res.redirect(authUrl);
      } catch (error) {
        logger.error('OAuth authorization error', error);
        return res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to initiate OAuth authorization'
        });
      }
    });
    
    // Token endpoint - POST /oauth/token (not implemented yet)
    app.post('/oauth/token', (req, res) => {
      res.status(501).json({
        error: 'not_implemented',
        error_description: 'Token endpoint not yet implemented. Complete OAuth flow via /oauth/authorize for now.'
      });
    });
  }

  // Health check
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'mcp-server',
      transport: process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http',
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
  
  // Check if HTTPS should be enabled - MANDATORY in production
  const isProduction = process.env.NODE_ENV === 'production';
  const useHTTPS = process.env.ENABLE_HTTPS === 'true' || isProduction;
  const sslKeyPath = process.env.SSL_KEY_PATH || '/app/ssl/localhost+2-key.pem';
  const sslCertPath = process.env.SSL_CERT_PATH || '/app/ssl/localhost+2.pem';
  
  // SECURITY: HTTPS is mandatory in production for OAuth
  if (isProduction && !useHTTPS) {
    console.error('🚨 SECURITY ERROR: HTTPS is mandatory in production environments for OAuth security');
    console.error('🚨 Set ENABLE_HTTPS=true and provide SSL certificates');
    process.exit(1);
  }
  
  if (useHTTPS && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    // Start both HTTP and HTTPS servers for Claude Desktop compatibility
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    
    // Start HTTPS server with connection logging
    const httpsServer = https.createServer(httpsOptions, app)
      .on('connection', (socket: any) => {
        const clientAddr = socket.remoteAddress + ':' + socket.remotePort;
        console.log(`🔗 [HTTPS:${serverPort}] New connection from ${clientAddr}`);
        
        socket.on('close', () => {
          console.log(`🔌 [HTTPS:${serverPort}] Connection closed from ${clientAddr}`);
        });
        
        socket.on('error', (error: any) => {
          console.log(`❌ [HTTPS:${serverPort}] Socket error from ${clientAddr}:`, error.message);
        });
      })
      .on('error', (error) => {
        console.error(`🚨 [HTTPS:${serverPort}] Server error:`, error);
      })
      .listen(serverPort, '0.0.0.0', () => {
        console.log(`🚀 MCP Server running on port ${serverPort} (HTTPS)`);
        console.log(`📡 MCP endpoint: https://localhost:${serverPort}/mcp`);
        console.log(`❤️  Health: https://localhost:${serverPort}/health`);
        if (OAUTH_DISABLED && CONFIG.MITTWALD_API_TOKEN) {
          console.log(`🧪 Test auth: https://localhost:${serverPort}/test-auth`);
        }
        console.log(`🔍 Connection logging enabled for debugging`);
      });
    
    // Also start HTTP server on a different port for fallback
    const httpPort = serverPort + 1;
    const httpServer = app.listen(httpPort, '0.0.0.0', () => {
        console.log(`🔄 HTTP fallback server running on port ${httpPort}`);
        console.log(`📡 HTTP MCP endpoint: http://localhost:${httpPort}/mcp`);
        console.log(`🔍 Connection logging enabled for debugging`);
      });
      
    httpServer.on('connection', (socket: any) => {
      const clientAddr = socket.remoteAddress + ':' + socket.remotePort;
      console.log(`🔗 [HTTP:${httpPort}] New connection from ${clientAddr}`);
      
      socket.on('close', () => {
        console.log(`🔌 [HTTP:${httpPort}] Connection closed from ${clientAddr}`);
      });
      
      socket.on('error', (error: any) => {
        console.log(`❌ [HTTP:${httpPort}] Socket error from ${clientAddr}:`, error.message);
      });
    });
    
    return httpServer;
    
    return httpsServer;
  } else {
    // Start HTTP server only - development mode
    if (!OAUTH_DISABLED) {
      console.warn('⚠️  WARNING: Running OAuth with HTTP in development mode');
      console.warn('⚠️  Production deployments MUST use HTTPS for OAuth security');
    }
    
    const httpServer = app.listen(serverPort, '0.0.0.0', () => {
        console.log(`🚀 MCP Server running on port ${serverPort} (HTTP - Development Only)`);
        if (!OAUTH_DISABLED) {
          console.log(`🔐 OAuth authorize: ${CONFIG.OAUTH_ISSUER}/oauth/authorize`);
        }
        console.log(`📡 MCP endpoint: http://localhost:${serverPort}/mcp`);
        console.log(`❤️  Health: http://localhost:${serverPort}/health`);
        if (OAUTH_DISABLED && CONFIG.MITTWALD_API_TOKEN) {
          console.log(`🧪 Test auth: http://localhost:${serverPort}/test-auth`);
        }
        console.log(`🔍 Connection logging enabled for debugging`);
      });
      
    httpServer.on('connection', (socket: any) => {
      const clientAddr = socket.remoteAddress + ':' + socket.remotePort;
      console.log(`🔗 [HTTP:${serverPort}] New connection from ${clientAddr}`);
      
      socket.on('close', () => {
        console.log(`🔌 [HTTP:${serverPort}] Connection closed from ${clientAddr}`);
      });
      
      socket.on('error', (error: any) => {
        console.log(`❌ [HTTP:${serverPort}] Socket error from ${clientAddr}:`, error.message);
      });
    });
    
    httpServer.on('error', (error: any) => {
      console.error(`🚨 [HTTP:${serverPort}] Server error:`, error);
    });
    
    return httpServer
  }
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