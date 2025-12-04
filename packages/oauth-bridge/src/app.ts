import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';
import type { Logger } from 'pino';
import { koaLogger } from './logger.js';
import { requestLogger } from './middleware/request-logger.js';
import type { BridgeConfig } from './config.js';
import type { StateStore } from './state/state-store.js';
import { createAuthorizeRouter } from './routes/authorize.js';
import { createMittwaldCallbackRouter } from './routes/mittwald-callback.js';
import { createTokenRouter } from './routes/token.js';
import { createRegisterRouter } from './routes/register.js';
import { createMetadataRouter } from './routes/metadata.js';
import type { RegistrationTokenStore } from './registration-token-store.js';
import { register, pendingAuthorizations, pendingGrants, registeredClients } from './metrics/index.js';

export function createApp(
  config: BridgeConfig,
  stateStore: StateStore,
  registrationTokenStore: RegistrationTokenStore
) {
  const app = new Koa();
  const router = new Router({ prefix: '/health' });
  const versionRouter = new Router();
  const jwksRouter = new Router();
  const logger = pino();

  app.context.logger = logger;
  app.context.config = config;
  app.context.stateStore = stateStore;

  app.use(koaLogger(logger));
  app.use(bodyParser());
  app.use(requestLogger(logger));

  router.get('/', async (ctx) => {
    let stateHealth;
    let stateMetrics;

    try {
      stateHealth = await ctx.stateStore.healthCheck();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.logger.error({ error: message }, 'State store health check failed');
      stateHealth = { status: 'error', details: { error: message } };
    }

    try {
      stateMetrics = await ctx.stateStore.getMetrics();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.logger.error({ error: message }, 'State store metrics collection failed');
      stateMetrics = undefined;
    }

    ctx.body = {
      status: 'ok',
      issuer: ctx.config.bridge.issuer,
      stateStore: {
        health: stateHealth,
        metrics: stateMetrics
      }
    };
  });

  app.use(router.routes()).use(router.allowedMethods());

  versionRouter.get('/version', (ctx) => {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.body = {
      gitSha: process.env.GIT_SHA ?? 'unknown',
      buildTime: process.env.BUILD_TIME ?? 'unknown'
    };
  });

  app.use(versionRouter.routes()).use(versionRouter.allowedMethods());

  // Prometheus metrics endpoint
  const metricsRouter = new Router();
  metricsRouter.get('/metrics', async (ctx) => {
    try {
      // Update state store gauges before returning metrics
      try {
        const stateMetrics = await ctx.stateStore.getMetrics();
        pendingAuthorizations.set(stateMetrics.pendingAuthorizations);
        pendingGrants.set(stateMetrics.pendingGrants);
        registeredClients.set(stateMetrics.registeredClients);
      } catch (error) {
        // If state store is unavailable, set gauges to 0 and log warning
        ctx.logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Failed to get state store metrics for Prometheus');
        pendingAuthorizations.set(0);
        pendingGrants.set(0);
        registeredClients.set(0);
      }

      ctx.set('Content-Type', register.contentType);
      ctx.body = await register.metrics();
    } catch (error) {
      ctx.status = 500;
      ctx.body = error instanceof Error ? error.message : 'Unknown error';
    }
  });
  app.use(metricsRouter.routes()).use(metricsRouter.allowedMethods());

  jwksRouter.get('/jwks', (ctx) => {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.body = {
      keys: []
    };
  });

  app.use(jwksRouter.routes()).use(jwksRouter.allowedMethods());
  const authorizeRouter = createAuthorizeRouter({ config, stateStore });
  const mittwaldCallbackRouter = createMittwaldCallbackRouter({ config, stateStore });
  const tokenRouter = createTokenRouter({ config, stateStore });
  const registerRouter = createRegisterRouter({ config, stateStore, registrationTokenStore });
  const metadataRouter = createMetadataRouter({ config });

  app.use(authorizeRouter.routes()).use(authorizeRouter.allowedMethods());
  app.use(mittwaldCallbackRouter.routes()).use(mittwaldCallbackRouter.allowedMethods());
  app.use(tokenRouter.routes()).use(tokenRouter.allowedMethods());
  app.use(registerRouter.routes()).use(registerRouter.allowedMethods());
  app.use(metadataRouter.routes()).use(metadataRouter.allowedMethods());

  return app;
}

declare module 'koa' {
  interface DefaultContext {
    logger: Logger;
    config: BridgeConfig;
    stateStore: StateStore;
  }
}
