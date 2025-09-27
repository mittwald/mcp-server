import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';
import type { Logger } from 'pino';
import { koaLogger } from './logger.js';
import type { BridgeConfig } from './config.js';
import type { StateStore } from './state/state-store.js';
import { createAuthorizeRouter } from './routes/authorize.js';
import { createMittwaldCallbackRouter } from './routes/mittwald-callback.js';
import { createTokenRouter } from './routes/token.js';

export function createApp(config: BridgeConfig, stateStore: StateStore) {
  const app = new Koa();
  const router = new Router({ prefix: '/health' });
  const logger = pino();

  app.context.logger = logger;
  app.context.config = config;
  app.context.stateStore = stateStore;

  app.use(koaLogger(logger));
  app.use(bodyParser());

  router.get('/', (ctx) => {
    ctx.body = {
      status: 'ok',
      issuer: ctx.config.bridge.issuer
    };
  });

  app.use(router.routes()).use(router.allowedMethods());
  const authorizeRouter = createAuthorizeRouter({ config, stateStore });
  const mittwaldCallbackRouter = createMittwaldCallbackRouter({ config, stateStore });
  const tokenRouter = createTokenRouter({ config, stateStore });

  app.use(authorizeRouter.routes()).use(authorizeRouter.allowedMethods());
  app.use(mittwaldCallbackRouter.routes()).use(mittwaldCallbackRouter.allowedMethods());
  app.use(tokenRouter.routes()).use(tokenRouter.allowedMethods());

  return app;
}

declare module 'koa' {
  interface DefaultContext {
    logger: Logger;
    config: BridgeConfig;
    stateStore: StateStore;
  }
}
