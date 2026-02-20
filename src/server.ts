#!/usr/bin/env node
/**
 * @file Main HTTP server for the MCP server
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
 * 5. User authorizes at /oauth/authorize
 * 6. Authorization server redirects back with an authorization code
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
import { CONFIG } from './server/config.js';
// OAuth is disabled for Mittwald integration
import { MCPHandler } from './server/mcp.js';
import { setMCPHandlerInstance } from './server/mcp.js';
import { createOAuthMiddleware } from './server/oauth-middleware.js';
import { responseLoggerMiddleware } from './server/response-logger.js';
import { initializeToolHandlers } from './handlers/tool-handlers.js';
import { OAuthMetadataRoutes } from './routes/oauth-metadata-routes.js';
import { logger } from './utils/logger.js';
import { checkRedisHealth } from './utils/redis-client.js';
import { register, metricsAuth, metricsEnabled } from './metrics/index.js';

// Polyfill for jose library
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto.webcrypto as unknown as typeof globalThis.crypto;
}

let shuttingDown = false;

export function markServerShuttingDown(): void {
  if (!shuttingDown) {
    logger.info('Server marked for graceful shutdown');
  }
  shuttingDown = true;
}

export function isServerShuttingDown(): boolean {
  return shuttingDown;
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

  // Early health endpoint (defined before any middleware) to validate external routing quickly
  app.get('/health', async (req, res) => {
    if (isServerShuttingDown()) {
      res.status(503).json({
        status: 'shutting_down',
        service: 'mcp-server',
        path: '/health',
        ts: Date.now(),
        checks: {
          redis: 'unknown',
        },
      });
      return;
    }

    const redisHealthy = await checkRedisHealth();
    const transport = process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http';
    const statusCode = redisHealthy ? 200 : 503;
    const payload = {
      status: redisHealthy ? 'healthy' : 'unhealthy',
      service: 'mcp-server',
      path: '/health',
      ts: Date.now(),
      transport,
      capabilities: {
        oauth: true,
        mcp: true,
      },
      checks: {
        redis: redisHealthy ? 'up' : 'down',
      },
    } as const;

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const ua = req.get('User-Agent') || 'unknown';
    if (redisHealthy) {
      console.log(`❤️  HEALTH → 200 from ${ip} ua=${ua}`);
      res.status(statusCode).json(payload);
      return;
    }

    logger.error('Redis health check failed during /health probe', { ip, userAgent: ua });
    res.status(statusCode).json(payload);
  });

  // Root route is intentionally not used; health endpoint should be used for reachability
  
  // Always use OAuth authentication middleware
  const authMiddleware: express.RequestHandler = createOAuthMiddleware();
  console.log('🔐 OAuth enabled - authentication required');
  
  // Initialize tools before setting up MCP handler
  await initializeToolHandlers();
  
  // Initialize MCP handler for protocol implementation with proper session support
  const mcpHandler = new MCPHandler();
  
  // Set global instance for notifications
  setMCPHandlerInstance(mcpHandler);

  // Configure CORS (expose WWW-Authenticate so browsers can read challenge)
  // In production, CORS_ORIGIN must be set to specific origins (startup validator enforces this)
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigin = process.env.CORS_ORIGIN;

  const corsOriginConfig: cors.CorsOptions['origin'] = (() => {
    if (isProduction) {
      // Startup validation guarantees CORS_ORIGIN is set and not '*'
      return corsOrigin!.split(',').map(o => o.trim());
    }

    if (!corsOrigin) {
      return true; // permissive in development
    }

    if (corsOrigin === '*') {
      return true; // dev-only wildcard
    }

    return corsOrigin.split(',').map(o => o.trim());
  })();

  app.use(
    cors({
      origin: corsOriginConfig,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept', 'mcp-protocol-version'],
      exposedHeaders: ['mcp-session-id', 'x-session-id', 'WWW-Authenticate'],
      optionsSuccessStatus: 204,
    })
  );
  // Explicit preflight for MCP endpoint
  app.options('/mcp', (req, res) => res.sendStatus(204));
  
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
  app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
  // OAuth metadata routes (for MCP endpoint discovery). Internal OAuth routes are disabled; we use the external oauth-server.
  const oauthMetadataRoutes = new OAuthMetadataRoutes();
  app.use('', oauthMetadataRoutes.getRouter());

  // Health check
  app.get('/health', async (_, res) => {
    if (isServerShuttingDown()) {
      res.status(503).json({
        status: 'shutting_down',
        service: 'mcp-server',
        transport: process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http',
        checks: {
          redis: 'unknown',
        },
      });
      return;
    }

    const redisHealthy = await checkRedisHealth();
    const transport = process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http';
    const statusCode = redisHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: redisHealthy ? 'healthy' : 'unhealthy',
      service: 'mcp-server',
      path: '/health',
      ts: Date.now(),
      transport,
      capabilities: {
        oauth: true,
        mcp: true,
      },
      checks: {
        redis: redisHealthy ? 'up' : 'down',
      },
    });
  });

  // Prometheus metrics endpoint (with optional Basic Auth) - only if enabled
  if (metricsEnabled) {
    app.get('/metrics', metricsAuth, async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  // Version info for CI/CD verification
  app.get('/version', (req, res) => {
    res.json({
      service: 'mcp-server',
      gitSha: process.env.GIT_SHA || 'unknown',
      imageDigest: process.env.IMAGE_DIGEST || 'unknown',
      buildTime: process.env.BUILD_TIME || 'unknown',
      node: process.version,
    });
  });

  // no test-auth route in OAuth-only mode

  // Root endpoint with service metadata
  app.get('/', (req, res) => {
    const protocol =
      req.get('x-forwarded-proto') ||
      (req.get('host')?.includes('mittwald.de') ? 'https' : req.protocol);
    const baseUrl = `${protocol}://${req.get('host')}`;
    const basePath = req.baseUrl || '';
    
    const endpoints: any = {
      mcp: `${baseUrl}${basePath}/mcp`,
      health: `${baseUrl}${basePath}/health`,
    };
    
    // OAuth endpoints (external AS)
    const asBase = CONFIG.OAUTH_BRIDGE.BASE_URL
      || process.env.OAUTH_BRIDGE_BASE_URL
      || process.env.OAUTH_AS_BASE
      || 'https://mittwald-oauth-server.fly.dev';
    const authorizeEndpoint = CONFIG.OAUTH_BRIDGE.AUTHORIZATION_URL
      || process.env.OAUTH_BRIDGE_AUTHORIZATION_URL
      || `${asBase.replace(/\/$/, '')}/authorize`;
    endpoints.oauth = {
      authorize: authorizeEndpoint,
      token: `${asBase}/token`,
      metadata: `${asBase}/.well-known/oauth-authorization-server`,
    };
    
    // no test-auth endpoint
    
    res.json({
      service: 'mittwald mStudio MCP server',
      version: '1.0.0',
      gitSha: process.env.GIT_SHA || 'unknown',
      transport: 'http',
      authRequired: true,
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
  // On Fly.io or when behind a proxy, TLS terminates at the edge; always serve HTTP internally.
  const runningOnFly = !!(process.env.FLY_ALLOC_ID || process.env.FLY_APP_NAME);
  const httpsFlag = (process.env.ENABLE_HTTPS || '').toLowerCase();
  let useHTTPS: boolean;

  if (httpsFlag === 'true') {
    useHTTPS = true;
  } else if (httpsFlag === 'false') {
    useHTTPS = false;
  } else {
    useHTTPS = isProduction && !runningOnFly;
  }
  const sslKeyPath = process.env.SSL_KEY_PATH || '/app/ssl/localhost+2-key.pem';
  const sslCertPath = process.env.SSL_CERT_PATH || '/app/ssl/localhost+2.pem';
  
  // SECURITY: HTTPS is mandatory in production for OAuth
  if (isProduction && !useHTTPS && !runningOnFly && httpsFlag !== 'false') {
    console.error('🚨 SECURITY ERROR: HTTPS is mandatory in production environments for OAuth security');
    console.error('🚨 Set ENABLE_HTTPS=true and provide SSL certificates, or explicitly set ENABLE_HTTPS=false if TLS terminates upstream.');
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
        console.log(`🔍 Connection logging enabled for debugging`);
      });
    
    return httpsServer;
  } else {
    // Start HTTP server only - development mode
    console.warn('⚠️  WARNING: Running OAuth with HTTP in development mode');
    console.warn('⚠️  Production deployments MUST use HTTPS for OAuth security');
    
    const httpServer = app.listen(serverPort, '0.0.0.0', () => {
        console.log(`🚀 MCP Server running on port ${serverPort} (HTTP - Development Only)`);
        console.log(`🔐 OAuth authorize: ${CONFIG.OAUTH_ISSUER}/oauth/authorize`);
        console.log(`📡 MCP endpoint: http://localhost:${serverPort}/mcp`);
        console.log(`❤️  Health: http://localhost:${serverPort}/health`);
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
    
    return httpServer;
  }
}
