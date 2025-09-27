import Router from '@koa/router';
import type { BridgeConfig } from '../config.js';

interface MetadataRouterDeps {
  config: BridgeConfig;
}

export function createMetadataRouter({ config }: MetadataRouterDeps) {
  const router = new Router({ prefix: '/.well-known' });

  const sendEmptyJwks = (ctx: Router.RouterContext) => {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.body = {
      keys: []
    };
  };

  router.get('/jwks.json', sendEmptyJwks);
  router.get('/jwks', sendEmptyJwks);

  router.get('/oauth-authorization-server', (ctx) => {
    const metadata = {
      issuer: config.bridge.issuer,
      authorization_endpoint: `${config.bridge.baseUrl}/authorize`,
      token_endpoint: `${config.bridge.baseUrl}/token`,
      registration_endpoint: `${config.bridge.baseUrl}/register`,
      code_challenge_methods_supported: ['S256'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [],
      mcp: {
        registration_endpoint: `${config.bridge.baseUrl}/register`,
        redirect_uris: config.redirectUris,
        token_endpoint_auth_method: 'none'
      }
    };

    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.body = metadata;
  });

  router.get('/oauth-protected-resource', (ctx) => {
    const metadata = {
      resource: config.bridge.baseUrl,
      authorization_servers: [config.bridge.baseUrl],
      bearer_methods_supported: ['header'],
      mcp: {
        registration_endpoint: `${config.bridge.baseUrl}/register`,
        redirect_uris: config.redirectUris
      }
    };

    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.body = metadata;
  });

  return router;
}
