import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import { MittwaldOAuthClient, OAuthConfig } from '../auth/oauth-client.js';
import { AuthRoutes } from '../routes/auth-routes.js';
import { AuthMiddleware } from '../middleware/auth-middleware.js';
import { sessionManager } from '../server/session-manager.js';
import { redisClient } from '../utils/redis-client.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OAuthServer {
  private app: Express;
  private oauthClient!: MittwaldOAuthClient;
  private authRoutes!: AuthRoutes;
  private server: any;

  constructor() {
    this.app = express();
    this.setupOAuthClient();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupOAuthClient(): void {
    const config: OAuthConfig = {
      issuer: process.env.OAUTH_ISSUER || 'http://localhost:8080/default',
      clientId: process.env.MITTWALD_OAUTH_CLIENT_ID || 'mittwald-mcp-server',
      clientSecret: process.env.MITTWALD_OAUTH_CLIENT_SECRET || 'mock-client-secret',
      redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://localhost:3000/auth/callback',
      scopes: ['openid', 'profile', 'user:read', 'customer:read', 'project:read']
    };

    this.oauthClient = new MittwaldOAuthClient(config);
    this.authRoutes = new AuthRoutes(this.oauthClient);

    logger.info('OAuth server configuration', {
      issuer: config.issuer,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes
    });
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        
        // Allow production origins (configure as needed)
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Serve static files
    const publicPath = path.join(__dirname, '../public');
    this.app.use('/static', express.static(publicPath));
    
    // Serve auth.html at root for convenience
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(publicPath, 'auth.html'));
    });

    // OAuth routes
    this.app.use('/auth', this.authRoutes.getRouter());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: 'healthy', // Could add actual Redis health check
          oauth: 'healthy'
        }
      });
    });

    // Protected API routes (example)
    this.app.get('/api/profile', AuthMiddleware.validateSession, (req: any, res) => {
      res.json({
        user: {
          id: req.session.userId,
          sessionId: req.session.sessionId,
          context: req.session.currentContext,
          scopes: req.session.scopes
        }
      });
    });

    // Session management endpoints
    this.app.get('/api/sessions', AuthMiddleware.validateSession, async (req: any, res) => {
      try {
        const sessions = await sessionManager.getUserSessions(req.session.userId);
        res.json({ sessions });
      } catch (error) {
        logger.error('Failed to get user sessions', error);
        res.status(500).json({ error: 'Failed to get sessions' });
      }
    });

    this.app.delete('/api/sessions/:sessionId', AuthMiddleware.validateSession, async (req: any, res) => {
      try {
        const { sessionId } = req.params;
        
        // Only allow users to delete their own sessions
        const session = await sessionManager.getSession(sessionId);
        if (!session || session.userId !== req.session.userId) {
          return res.status(404).json({ error: 'Session not found' });
        }

        await sessionManager.destroySession(sessionId);
        return res.json({ success: true });
      } catch (error) {
        logger.error('Failed to delete session', error);
        return res.status(500).json({ error: 'Failed to delete session' });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'not_found',
        message: 'Endpoint not found',
        availableEndpoints: [
          'GET /',
          'GET /auth/login',
          'GET /auth/callback',
          'POST /auth/logout',
          'GET /auth/status',
          'GET /health'
        ]
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: any, res: any, next: any) => {
      logger.error('Unhandled error in OAuth server', error);
      
      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        error: 'internal_server_error',
        message: isDevelopment ? error.message : 'An internal error occurred',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in OAuth server', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in OAuth server', { reason, promise });
      this.shutdown();
    });
  }

  async start(port: number = 3000): Promise<void> {
    try {
      // Initialize OAuth client
      await this.oauthClient.initialize();
      
      // Check if SSL certificates exist for HTTPS
      const useHTTPS = process.env.ENABLE_HTTPS === 'true';
      const sslKeyPath = process.env.SSL_KEY_PATH || '/app/ssl/server.key';
      const sslCertPath = process.env.SSL_CERT_PATH || '/app/ssl/server.crt';
      
      if (useHTTPS && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
        // Start HTTPS server
        const httpsOptions = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath)
        };
        
        this.server = https.createServer(httpsOptions, this.app).listen(port, () => {
          logger.info(`OAuth server started with HTTPS on port ${port}`, {
            environment: process.env.NODE_ENV,
            protocol: 'https',
            issuer: process.env.OAUTH_ISSUER,
            clientId: process.env.MITTWALD_OAUTH_CLIENT_ID
          });
        });
      } else {
        // Start HTTP server
        this.server = this.app.listen(port, () => {
          logger.info(`OAuth server started with HTTP on port ${port}`, {
            environment: process.env.NODE_ENV,
            protocol: 'http',
            issuer: process.env.OAUTH_ISSUER,
            clientId: process.env.MITTWALD_OAUTH_CLIENT_ID
          });
        });
      }

      // Start background cleanup tasks
      this.startBackgroundTasks();

    } catch (error) {
      logger.error('Failed to start OAuth server', error);
      throw error;
    }
  }

  private startBackgroundTasks(): void {
    // Cleanup expired sessions every 5 minutes
    setInterval(async () => {
      try {
        const cleanedSessions = await sessionManager.cleanupExpiredSessions();
        if (cleanedSessions > 0) {
          logger.info(`Background cleanup: removed ${cleanedSessions} expired sessions`);
        }
      } catch (error) {
        logger.error('Background session cleanup failed', error);
      }
    }, 5 * 60 * 1000);

    // Heartbeat log every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        logger.debug('OAuth server heartbeat', {
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
      }, 30 * 1000);
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down OAuth server...');
    
    try {
      if (this.server) {
        this.server.close();
      }
      
      await redisClient.disconnect();
      logger.info('OAuth server shutdown complete');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during OAuth server shutdown', error);
      process.exit(1);
    }
  }

  getApp(): Express {
    return this.app;
  }
}

// Export singleton instance
export const oauthServer = new OAuthServer();