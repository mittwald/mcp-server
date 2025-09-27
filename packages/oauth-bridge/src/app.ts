import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';
import type { Logger } from 'pino';
import { koaLogger } from './logger.js';
import type { BridgeConfig } from './config.js';

export function createApp(config: BridgeConfig) {
  const app = new Koa();
  const router = new Router({ prefix: '/health' });
  const logger = pino();

  app.context.logger = logger;
  app.context.config = config;

  app.use(koaLogger(logger));
  app.use(bodyParser());

  router.get('/', (ctx) => {
    ctx.body = {
      status: 'ok',
      issuer: ctx.config.bridge.issuer
    };
  });

  app.use(router.routes()).use(router.allowedMethods());

  return app;
}

declare module 'koa' {
  interface DefaultContext {
    logger: Logger;
    config: BridgeConfig;
  }
}
