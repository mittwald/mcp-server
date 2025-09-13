import Koa, { type Context } from 'koa';
import mount from 'koa-mount';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import Provider from 'oidc-provider';
import { createProviderConfiguration, type ProviderConfig } from './config/provider.js';
import { createRedisClient } from './config/adapters.js';
import { logger } from './services/logger.js';
import { nanoid } from 'nanoid';
import { registerInteractionRoutes } from './handlers/interactions.js';

// Environment configuration
const config: ProviderConfig = {
  issuer: process.env.ISSUER || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000'),
  redisUrl: process.env.REDIS_URL,
  storageAdapter: (process.env.STORAGE_ADAPTER as 'redis' | 'memory') || 'memory',
  initialAccessToken: process.env.INITIAL_ACCESS_TOKEN || nanoid(32),
  jwksKeystorePath: process.env.JWKS_KEYSTORE_PATH || '/app/jwks/jwks.json',
  cookiesSecure: process.env.COOKIES_SECURE === 'true',
  // Dev-friendly default: allow https, localhost loopback, and curated custom schemes
  allowedRedirectUriPatterns: (
    process.env.ALLOWED_REDIRECT_URI_PATTERNS ||
    'https://*/*,http://localhost:*/*,http://127.0.0.1:*/*,http://[::1]:*/*,claude://*,vscode://*,vscodium://*,cursor://*,windsurf://*,zed://*,jetbrains://*,lmstudio://*,postman://*,warp://*,amazonq://*'
  ).split(','),
  tokenTtls: {
    accessToken: parseInt(process.env.TOKEN_TTL_ACCESS_TOKEN || '3600'),
    idToken: parseInt(process.env.TOKEN_TTL_ID_TOKEN || '3600'),
    refreshToken: parseInt(process.env.TOKEN_TTL_REFRESH_TOKEN || '86400'),
  },
};

async function createServer() {
  const app = new Koa();
  // Koa requires signing keys to use signed cookies. oidc-provider sets cookies with `signed: true`.
  // If not provided, Koa will throw `.keys required for signed cookies`.
  // Use env COOKIE_SIGNING_KEYS (comma-separated) or COOKIE_SIGNING_KEY or generate a random fallback.
  const cookieKeys = (() => {
    const keysEnv = process.env.COOKIE_SIGNING_KEYS || process.env.COOKIE_SIGNING_KEY;
    if (keysEnv) {
      // Support comma-separated keys for rotation
      return keysEnv.includes(',')
        ? keysEnv.split(',').map((k) => k.trim()).filter(Boolean)
        : [keysEnv.trim()];
    } else {
      const randomKey = nanoid(64);
      logger.warn('Using random cookie signing key - cookies will be invalid after server restart');
      return [randomKey];
    }
  })();
  // @ts-ignore - Koa expects `app.keys` to be an array of strings
  app.keys = cookieKeys;
  const router = new Router();
  // Trust proxy headers (X-Forwarded-*) when running behind Fly.io / proxies
  app.proxy = true;

  // Initialize Redis if using Redis storage
  let redisClient;
  if (config.storageAdapter === 'redis' && config.redisUrl) {
    try {
      redisClient = await createRedisClient(config.redisUrl);
      logger.info('Redis client connected', { url: config.redisUrl });
    } catch (error) {
      logger.error('Failed to connect to Redis, falling back to memory storage', { 
        error: error instanceof Error ? error.message : String(error),
        url: config.redisUrl 
      });
      config.storageAdapter = 'memory';
    }
  }

  // Create OIDC provider
  const providerConfig = await createProviderConfiguration(config);
  const provider = new Provider(config.issuer, providerConfig);
  // Trust proxy headers inside oidc-provider as well
  // This removes warnings like: "x-forwarded-proto header detected but not trusted"
  // Not in older type definitions, but supported at runtime
  (provider as any).proxy = true;

  // OAuth provider created successfully
  logger.info('OAuth provider created successfully', { 
    issuer: config.issuer, 
    storageAdapter: config.storageAdapter,
  });

  // Register provider event logging (expanded)
  try {
    const events = [
      'authorization.success',
      'authorization.error',
      'server_error',
      'grant.error',
      'grant.revoked',
      'token.issued',
      'token.error',
      // DCR-related (supported in some versions)
      'registration_create.success',
      'registration_create.error',
    ];
    for (const ev of events) {
      // @ts-ignore: runtime event names may not be in types
      provider.on(ev, (ctx: any, errOrData?: any) => {
        const clientId = ctx?.oidc?.client?.clientId || ctx?.client?.clientId;
        const requestId = (ctx && ctx.state && ctx.state.requestId) || 'n/a';
        const path = ctx?.req?.url || ctx?.request?.url;
        const base = { event: ev, path, clientId, requestId } as any;
        // On *error events, the second arg is the Error
        if (String(ev).includes('error') && errOrData) {
          base.error = errOrData?.message || String(errOrData);
          base.error_description = errOrData?.error_description;
          base.code = errOrData?.code;
          // Try to include request body shape (sanitized)
          try {
            base.body = ctx?.request?.body ? JSON.parse(JSON.stringify(ctx.request.body)) : undefined;
          } catch {}
          logger.error(base, `OIDC ${ev} client=${clientId || 'n/a'} path=${path || ''} id=${requestId}`);
        } else {
          logger.info(base, `OIDC ${ev} client=${clientId || 'n/a'} path=${path || ''} id=${requestId}`);
        }
      });
    }
  } catch (e) {
    logger.warn('Provider event logging registration failed', { error: (e as Error).message });
  }

  // NOTE: Mount the provider AFTER our router so that health and other local routes
  // are handled by our router first. Provider will handle remaining OIDC routes.

  // Verbose request logging middleware
  app.use(async (ctx, next) => {
    const startTime = Date.now();
    const requestId = nanoid(10);
    
    ctx.state.requestId = requestId;
    
    logger.info({
      requestId,
      method: ctx.method,
      url: ctx.url,
      path: ctx.path,
      query: ctx.querystring,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
      forwarded: {
        host: ctx.headers['x-forwarded-host'],
        proto: ctx.headers['x-forwarded-proto'],
        for: ctx.headers['x-forwarded-for'],
      },
      headers: {
        host: ctx.headers['host'],
        origin: ctx.headers['origin'],
        referer: ctx.headers['referer'],
        contentType: ctx.headers['content-type'],
      },
    }, `REQ start ${ctx.method} ${ctx.path}?${ctx.querystring || ''} id=${requestId}`);

    await next();

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      duration: `${duration}ms`,
    }, `REQ done ${ctx.method} ${ctx.path} -> ${ctx.status} in ${duration}ms id=${requestId}`);
  });

  // Error handling middleware
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      logger.error('Unhandled error', {
        requestId: ctx.state.requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Internal server error',
      };
    }
  });

  // Enable CORS for provider routes as well so browser-based flows (e.g., claude.ai) can call /reg, /token
  app.use(cors({
    origin: '*',
    credentials: false,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-protocol-version']
  }));

  // Router-level CORS/body parsing for our own endpoints (e.g., /health)
  router.use(cors({
    origin: (ctx) => {
      const origin = ctx.headers.origin;
      if (process.env.NODE_ENV === 'development') return origin || '*';
      if (origin && origin.startsWith('https://')) return origin;
      return '*';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'User-Agent', 'mcp-protocol-version'],
  }));
  // Add body parsing only for router-handled endpoints (none currently require it but kept for future use)
  router.use(bodyParser({
    enableTypes: ['json', 'form'],
    jsonLimit: '1mb',
    formLimit: '1mb',
  }));

  // Pre-process DCR to normalize grant_types for Inspector compatibility
  router.post('/reg', async (ctx: Context, next) => {
    try {
      if (ctx.is('application/json') && ctx.request.body) {
        const props = ctx.request.body as any;
        if (Array.isArray(props.grant_types)) {
          // Allow Inspector's payload but keep validation-friendly list
          // node-oidc-provider may reject refresh_token in grant_types in some configs
          // Keep authorization_code; drop others to pass validation
          const hasAuthCode = props.grant_types.includes('authorization_code');
          props.grant_types = hasAuthCode ? ['authorization_code'] : ['authorization_code'];
        } else {
          props.grant_types = ['authorization_code'];
        }
        ctx.request.body = props;
      }
    } catch (e) {
      // no-op on failure; let provider handle
    }
    await next();
  });

  // Health check endpoint
  router.get('/health', async (ctx: Context) => {
    ctx.body = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      issuer: config.issuer,
      uptime: process.uptime(),
    };
  });

  // Version endpoint for CI/CD validation
  router.get('/version', async (ctx: Context) => {
    ctx.body = {
      service: 'oauth-server',
      gitSha: process.env.GIT_SHA || 'unknown',
      imageDigest: process.env.IMAGE_DIGEST || 'unknown',
      buildTime: process.env.BUILD_TIME || 'unknown',
      issuer: config.issuer,
      node: process.version,
    };
  });

  // Mount router for our own endpoints such as /health
  // Register interaction routes (login/consent/abort and Mittwald callback)
  registerInteractionRoutes(router, provider, redisClient);
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Mount OIDC provider app using koa-mount to preserve correct Koa ctx/res semantics
  // and to avoid upstream interference. In v9 the Provider instance is itself a Koa app
  app.use(mount('/', provider as any));

  return { app, provider, redisClient };
}

async function startServer() {
  try {
    const { app, provider, redisClient } = await createServer();

    // Start server
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info('OAuth server started', {
        port: config.port,
        issuer: config.issuer,
        storageAdapter: config.storageAdapter,
        environment: process.env.NODE_ENV,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { createServer, startServer };
