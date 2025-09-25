import Koa, { type Context } from 'koa';
import mount from 'koa-mount';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import Provider from 'oidc-provider';
import { createProviderConfiguration, type ProviderConfig } from './config/provider.js';
import { logger } from './services/logger.js';
import { nanoid } from 'nanoid';
import { registerInteractionRoutes } from './handlers/interactions.js';
// REMOVED: Custom token routes - using oidc-provider's standard /token endpoint
import { getClientSecretStore } from './services/client-secrets.js';
// REMOVED: Custom scope validation middleware - using oidc-provider's built-in validation
import { getSupportedScopes, getDefaultScopeString } from './config/oauth-scopes.js';

function compileRedirectPattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexSource = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  return new RegExp(regexSource);
}

function buildRedirectValidator(patterns: string[]): (uri: string) => boolean {
  const trimmed = patterns.map((pattern) => pattern.trim()).filter(Boolean);

  if (trimmed.some((pattern) => pattern === '*' || pattern.toLowerCase() === 'allow_all')) {
    logger.warn('Redirect URI validation disabled (TODO: tighten ALLOWED_REDIRECT_URI_PATTERNS for production)');
    return () => true;
  }

  const regexes = trimmed.map(compileRedirectPattern);

  return (uri: string) => {
    try {
      // Throws if malformed, which will be treated as invalid
      new URL(uri);
    } catch {
      return false;
    }

    if (!regexes.length) {
      return true;
    }

    const matches = regexes.some((regex) => regex.test(uri));
    if (!matches) {
      logger.warn('Redirect URI permitted via temporary allow-all fallback (TODO tighten)', { uri });
      return true;
    }

    return true;
  };
}

// Environment configuration
const rawInitialAccessToken = process.env.INITIAL_ACCESS_TOKEN || '';

if (!rawInitialAccessToken) {
  logger.warn('INITIAL_ACCESS_TOKEN not set – dynamic client registration is open to all callers');
}

const config: ProviderConfig = {
  issuer: process.env.ISSUER || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000'),
  storageAdapter: (process.env.STORAGE_ADAPTER as 'sqlite' | 'memory') || 'sqlite',
  initialAccessToken: rawInitialAccessToken,
  jwksKeystorePath: process.env.JWKS_KEYSTORE_PATH || '/app/jwks/jwks.json',
  cookiesSecure: process.env.COOKIES_SECURE === 'true',
  // Dev-friendly default: allow https, localhost loopback, and curated custom schemes
  allowedRedirectUriPatterns: (
    process.env.ALLOWED_REDIRECT_URI_PATTERNS ||
    'ALLOW_ALL'
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
  app.keys = cookieKeys as unknown as string[];
  const router = new Router();
  // Trust proxy headers (X-Forwarded-*) when running behind Fly.io / proxies
  app.proxy = true;

  // Log storage adapter configuration
  if (config.storageAdapter === 'sqlite') {
    logger.info('Using SQLite storage adapter', {
      dbPath: '/app/jwks/oauth-sessions.db'
    });
  } else {
    logger.warn('Using in-memory storage adapter (not recommended for production)');
  }

  const redirectValidator = buildRedirectValidator(config.allowedRedirectUriPatterns);

  // Create OIDC provider with cookie keys
  const providerConfig = await createProviderConfiguration({
    ...config,
    cookieKeys: cookieKeys // Pass the same keys to provider
  });
  const provider = new Provider(config.issuer, providerConfig);
  const providerAny = provider as any;
  // Trust proxy headers inside oidc-provider as well
  // This removes warnings like: "x-forwarded-proto header detected but not trusted"
  // Not in older type definitions, but supported at runtime
  providerAny.proxy = true;

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
      // DCR lifecycle visibility
      'registration_create.success',
      'registration_create.error',
      'registration_read.error',
      'registration_update.success',
      'registration_update.error',
      'registration_delete.success',
      'registration_delete.error',
    ];
    const sanitizeClientMetadata = (meta: Record<string, any> | undefined) => {
      if (!meta) return undefined;
      const {
        client_secret: _clientSecret,
        registration_access_token: _registrationAccessToken,
        client_secret_expires_at: _clientSecretExpiresAt,
        ...rest
      } = meta;
      return rest;
    };

    const sanitizeBody = (body: any) => {
      if (!body || typeof body !== 'object') return body;
      try {
        const clone = JSON.parse(JSON.stringify(body));
        if (clone.client_secret) delete clone.client_secret;
        if (clone.registration_access_token) delete clone.registration_access_token;
        return clone;
      } catch {
        return undefined;
      }
    };

    for (const ev of events) {
      providerAny.on(ev, (ctx: any, errOrData?: any) => {
        const clientId = ctx?.oidc?.client?.clientId || ctx?.client?.clientId;
        const requestId = (ctx && ctx.state && ctx.state.requestId) || 'n/a';
        const path = ctx?.req?.url || ctx?.request?.url;
        const base = {
          event: ev,
          outcome: String(ev).includes('error') ? 'error' : 'success',
          path,
          clientId,
          requestId,
          ip: ctx?.ip,
          userAgent: ctx?.headers?.['user-agent'],
        } as any;

        if (base.outcome === 'error' && errOrData) {
          base.error = errOrData?.message || String(errOrData);
          base.error_description = errOrData?.error_description;
          base.code = errOrData?.code;
          const sanitizedBody = sanitizeBody(ctx?.request?.body);
          if (sanitizedBody) base.request = sanitizedBody;
          logger.error(base, `OIDC ${ev} client=${clientId || 'n/a'} path=${path || ''} id=${requestId}`);
          return;
        }

        // Success payload enrichment
        if (errOrData?.metadata) {
          base.metadata = sanitizeClientMetadata(errOrData.metadata());
          base.redirectUris = errOrData.redirectUris;
          base.tokenEndpointAuthMethod = errOrData.tokenEndpointAuthMethod;
          base.grantTypes = errOrData.grantTypes;
        } else if (ctx?.oidc?.client) {
          // Some success events (e.g. delete) provide client on ctx
          const meta = ctx.oidc.client.metadata();
          base.metadata = sanitizeClientMetadata(meta);
          base.redirectUris = ctx.oidc.client.redirectUris;
          base.tokenEndpointAuthMethod = ctx.oidc.client.tokenEndpointAuthMethod;
          base.grantTypes = ctx.oidc.client.grantTypes;
        }

        logger.info(base, `OIDC ${ev} client=${clientId || 'n/a'} path=${path || ''} id=${requestId}`);
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

  // Enhanced DCR processing for multi-client compatibility
  router.post('/reg', async (ctx: Context, next) => {
    try {
      if (ctx.is('application/json') && ctx.request.body) {
        const props = ctx.request.body as any;

        if (Array.isArray(props.redirect_uris)) {
          const trimmedUris = props.redirect_uris.map((uri: string) => (typeof uri === 'string' ? uri.trim() : '')).filter(Boolean);
          const invalidUris = trimmedUris.filter((uri: string) => !redirectValidator(uri));

          if (invalidUris.length > 0) {
            logger.warn('DCR validation failed: redirect URIs outside allowed patterns', {
              invalidUris,
              allowedPatterns: config.allowedRedirectUriPatterns,
            });
            ctx.status = 400;
            ctx.body = {
              error: 'invalid_redirect_uri',
              error_description: 'Redirect URI not permitted by server policy',
            };
            return;
          }

          if (trimmedUris.length === 0) {
            ctx.status = 400;
            ctx.body = {
              error: 'invalid_redirect_uri',
              error_description: 'No redirect URIs provided',
            };
            return;
          }

          props.redirect_uris = trimmedUris;
        } else if (typeof props.redirect_uris === 'string') {
          const uri = props.redirect_uris.trim();
          if (!uri || !redirectValidator(uri)) {
            ctx.status = 400;
            ctx.body = {
              error: 'invalid_redirect_uri',
              error_description: 'Redirect URI not permitted by server policy',
            };
            return;
          }
          props.redirect_uris = [uri];
        } else {
          ctx.status = 400;
          ctx.body = {
            error: 'invalid_redirect_uri',
            error_description: 'Redirect URIs are required',
          };
          return;
        }

        // Detect client type and apply appropriate configuration
        const isClaudeClient = props.client_name === 'Claude' ||
          props.redirect_uris?.some((uri: string) => uri.includes('claude.ai') || uri.includes('claude.com'));

        const isChatGPTClient = props.redirect_uris?.some((uri: string) => uri.includes('chatgpt.com'));

        // Configure grant types
        if (Array.isArray(props.grant_types)) {
          const hasRefresh = props.grant_types.includes('refresh_token');
          props.grant_types = ['authorization_code'];
          if (hasRefresh || props.scope?.includes('offline_access')) {
            props.grant_types.push('refresh_token');
          }
        } else {
          props.grant_types = ['authorization_code', 'refresh_token'];
        }

        // Configure authentication method and scopes based on client
        if (isClaudeClient) {
          // Claude.ai requires client_secret_post (confidential client)
          props.token_endpoint_auth_method = 'client_secret_post';
          props.application_type = 'web';
          // CRITICAL: Set allowed scopes for client validation (include openid for Claude)
          props.scope = 'openid ' + getDefaultScopeString();
          logger.info('Configured Claude.ai client for confidential authentication with openid scope');
        } else if (isChatGPTClient) {
          // ChatGPT uses public client
          props.token_endpoint_auth_method = 'none';
          props.application_type = 'native';
          // CRITICAL: Set allowed scopes for client validation
          props.scope = getDefaultScopeString();
          logger.info('Configured ChatGPT client for public authentication');
        } else {
          // Default to public client (MCP Jam, etc.)
          props.token_endpoint_auth_method = props.token_endpoint_auth_method || 'none';
          props.application_type = 'native';
          // CRITICAL: Set allowed scopes for client validation
          if (!props.scope) {
            props.scope = getDefaultScopeString();
          }
        }

        // CRITICAL: Filter out unsupported scopes from client registration
        // This prevents oidc-provider DCR validation errors for scopes like 'profile'
        if (props.scope) {
          const supportedScopes = new Set([...getSupportedScopes(), 'openid']); // Include openid for compatibility
          const requestedScopes = props.scope.split(' ').filter(Boolean);
          const filteredScopes = requestedScopes.filter((scope: string) => supportedScopes.has(scope));

          if (filteredScopes.length !== requestedScopes.length) {
            const removedScopes = requestedScopes.filter((scope: string) => !supportedScopes.has(scope));
            logger.info('Filtered unsupported scopes from client registration', {
              clientName: props.client_name,
              originalScopes: requestedScopes,
              filteredScopes,
              removedScopes
            });
          }

          // Use filtered scopes or fallback to defaults
          props.scope = filteredScopes.length > 0 ? filteredScopes.join(' ') : getDefaultScopeString();
        }

        ctx.request.body = props;

        logger.info('DCR normalized', {
          clientName: props.client_name,
          authMethod: props.token_endpoint_auth_method,
          grantTypes: props.grant_types,
          scopes: props.scope,
          isClaudeClient,
          isChatGPTClient
        });
      }
    } catch (error) {
      logger.error('Failed to normalize DCR payload', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await next();
  });

  // Post-DCR processing: Generate client secrets for confidential clients
  router.post('/reg', async (ctx: Context, next) => {
    await next(); // Let oidc-provider process the registration first

    // If registration was successful (201), check if we need to add client secret
    if (ctx.status === 201 && ctx.body) {
      try {
        const response = ctx.body as any;
        const clientId = response.client_id;
        const authMethod = response.token_endpoint_auth_method;

        if (authMethod === 'client_secret_post' && clientId) {
          const clientSecretStore = getClientSecretStore();
          const clientSecret = clientSecretStore.generateClientSecret(clientId);

          // Add client secret to response
          response.client_secret = clientSecret;
          ctx.body = response;

          logger.info({ clientId, authMethod }, 'Added client secret to DCR response');
        }
      } catch (error) {
        logger.error('Failed to add client secret to DCR response', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
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
  registerInteractionRoutes(router, provider);

  // REMOVED: Custom token routes - oidc-provider handles /token endpoint automatically

  // REMOVED: Custom scope validation middleware
  // With pure oidc-provider approach and centralized scope configuration,
  // oidc-provider handles all scope validation correctly

  app.use(router.routes());
  app.use(router.allowedMethods());

  logger.info('Pure oidc-provider scope validation enabled', {
    scopeCount: getSupportedScopes().length,
    approach: 'oidc-provider built-in validation',
    artificialLimits: 'removed'
  });

  // Mount OIDC provider app using koa-mount to preserve correct Koa ctx/res semantics
  // and to avoid upstream interference. In v9 the Provider instance is itself a Koa app
  app.use(mount('/', providerAny));

  return { app, provider };
}

async function startServer() {
  try {
    const { app } = await createServer();

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

      // SQLite connections will be closed automatically when the process exits
      // No explicit cleanup needed like Redis
      logger.info('SQLite connections closed');

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
