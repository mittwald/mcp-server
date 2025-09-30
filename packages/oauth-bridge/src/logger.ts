import type pino from 'pino';
import type Koa from 'koa';

export function koaLogger(logger: pino.Logger) {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const start = Date.now();
    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      logger.debug({
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        duration
      }, 'request completed');
    }
  };
}
