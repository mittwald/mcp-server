import Router, { type RouterContext } from '@koa/router';
import { randomBytes, randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore, ClientRegistrationRecord } from '../state/state-store.js';

interface RegisterRouterDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

interface RegistrationRequest {
  redirect_uris?: unknown;
  token_endpoint_auth_method?: unknown;
  client_name?: unknown;
  scope?: unknown;
}

const TOKEN_AUTH_METHODS = ['none', 'client_secret_post', 'client_secret_basic'] as const;
type TokenEndpointAuthMethod = typeof TOKEN_AUTH_METHODS[number];

function generateClientSecret(): string {
  return randomBytes(48).toString('base64url');
}

export function createRegisterRouter({ config, stateStore }: RegisterRouterDeps) {
  const router = new Router();

  router.post('/register', async (ctx) => {
    const body = ctx.request.body as RegistrationRequest;

    const tokenEndpointAuthMethod = parseTokenEndpointAuthMethod(body.token_endpoint_auth_method);

    const validationError = validateRegistrationRequest(body, config.redirectUris, tokenEndpointAuthMethod);
    if (validationError) {
      ctx.logger.warn({ error: validationError.body.error, description: validationError.body.error_description }, 'Client registration validation failed');
      ctx.status = validationError.status;
      ctx.body = validationError.body;
      return;
    }

    // tokenEndpointAuthMethod is guaranteed to be non-null when validation passes
    const authMethod = tokenEndpointAuthMethod!;
    const redirectUris = (body.redirect_uris as string[]).map((uri) => uri.trim());
    const scope = typeof body.scope === 'string' ? body.scope : undefined;
    const clientName = typeof body.client_name === 'string' ? body.client_name : undefined;
    const clientSecret = authMethod === 'none' ? undefined : generateClientSecret();

    const clientId = randomUUID();
    const registrationAccessToken = randomUUID();
    const issuedAt = Math.floor(Date.now() / 1000);

    const clientRecord: ClientRegistrationRecord = {
      clientId,
      tokenEndpointAuthMethod: authMethod,
      clientSecret,
      redirectUris,
      scope,
      clientName,
      registrationAccessToken,
      registrationClientUri: `${config.bridge.baseUrl}/register/${clientId}`,
      clientIdIssuedAt: issuedAt,
      clientSecretExpiresAt: 0,
      metadata: {
        token_endpoint_auth_method: tokenEndpointAuthMethod
      }
    };

    try {
      await stateStore.storeClientRegistration(clientRecord);
    } catch (error) {
      ctx.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to persist client registration');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to persist client registration'
      };
      return;
    }

    ctx.logger.info({ clientId, redirectUrisCount: redirectUris.length }, 'Client registration created');

    ctx.status = 201;
    ctx.body = buildClientRegistrationResponse(clientRecord, { includeRegistrationAccessToken: true, includeClientSecret: true });
  });

  router.get('/register/:clientId', async (ctx) => {
    const clientId = ctx.params.clientId;
    const accessToken = extractRegistrationAccessToken(ctx.request.headers.authorization);

    if (!accessToken) {
      ctx.logger.warn({ clientId }, 'Client registration GET missing or invalid access token');
      setRegistrationUnauthorized(ctx);
      return;
    }

    let record: ClientRegistrationRecord | null;
    try {
      record = await stateStore.getClientRegistration(clientId);
    } catch (error) {
      ctx.logger.error({ error: error instanceof Error ? error.message : String(error), clientId }, 'Failed to load client registration');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to load client registration'
      };
      return;
    }

    if (!record) {
      ctx.status = 404;
      ctx.body = {
        error: 'not_found',
        error_description: 'Client registration not found'
      };
      return;
    }

    if (record.registrationAccessToken !== accessToken) {
      ctx.logger.warn({ clientId }, 'Client registration GET authorization failed');
      setRegistrationUnauthorized(ctx);
      return;
    }

    ctx.body = buildClientRegistrationResponse(record, { includeRegistrationAccessToken: true, includeClientSecret: true });
  });

  router.delete('/register/:clientId', async (ctx) => {
    const clientId = ctx.params.clientId;
    const accessToken = extractRegistrationAccessToken(ctx.request.headers.authorization);

    if (!accessToken) {
      ctx.logger.warn({ clientId }, 'Client registration DELETE missing or invalid access token');
      setRegistrationUnauthorized(ctx);
      return;
    }

    let record: ClientRegistrationRecord | null;
    try {
      record = await stateStore.getClientRegistration(clientId);
    } catch (error) {
      ctx.logger.error({ error: error instanceof Error ? error.message : String(error), clientId }, 'Failed to load client registration for deletion');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to load client registration'
      };
      return;
    }

    if (!record) {
      ctx.status = 404;
      ctx.body = {
        error: 'not_found',
        error_description: 'Client registration not found'
      };
      return;
    }

    if (record.registrationAccessToken !== accessToken) {
      ctx.logger.warn({ clientId }, 'Client registration DELETE authorization failed');
      setRegistrationUnauthorized(ctx);
      return;
    }

    try {
      await stateStore.deleteClientRegistration(clientId);
    } catch (error) {
      ctx.logger.error({ error: error instanceof Error ? error.message : String(error), clientId }, 'Failed to delete client registration');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to delete client registration'
      };
      return;
    }

    ctx.logger.info({ clientId }, 'Client registration deleted');

    ctx.status = 204;
  });

  return router;
}

function validateRegistrationRequest(
  body: RegistrationRequest,
  allowedRedirectUris: string[],
  parsedMethod: TokenEndpointAuthMethod | null
):
  { status: number; body: Record<string, string> } | null {
  if (!body.redirect_uris || !Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return {
      status: 400,
      body: {
        error: 'invalid_client_metadata',
        error_description: 'redirect_uris must be a non-empty array'
      }
    };
  }

  const redirectUris = body.redirect_uris as unknown[];
  for (const uri of redirectUris) {
    if (typeof uri !== 'string') {
      return {
        status: 400,
        body: {
          error: 'invalid_client_metadata',
          error_description: 'redirect_uris must contain strings only'
        }
      };
    }
    if (!allowedRedirectUris.includes(uri)) {
      return {
        status: 400,
        body: {
          error: 'invalid_redirect_uri',
          error_description: 'redirect_uri is not registered'
        }
      };
    }
  }

  if (body.token_endpoint_auth_method && typeof body.token_endpoint_auth_method !== 'string') {
    return {
      status: 400,
      body: {
        error: 'invalid_client_metadata',
        error_description: 'token_endpoint_auth_method must be a string'
      }
    };
  }

  if (!parsedMethod) {
    return {
      status: 400,
      body: {
        error: 'invalid_client_metadata',
        error_description: 'Unsupported token_endpoint_auth_method'
      }
    };
  }

  if (body.client_name && typeof body.client_name !== 'string') {
    return {
      status: 400,
      body: {
        error: 'invalid_client_metadata',
        error_description: 'client_name must be a string'
      }
    };
  }

  if (body.scope && typeof body.scope !== 'string') {
    return {
      status: 400,
      body: {
        error: 'invalid_client_metadata',
        error_description: 'scope must be a string'
      }
    };
  }

  return null;
}

function extractRegistrationAccessToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const [scheme, value] = authorizationHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) {
    return null;
  }
  return value;
}

function setRegistrationUnauthorized(ctx: RouterContext) {
  ctx.status = 401;
  ctx.set('WWW-Authenticate', 'Bearer realm="Dynamic Client Registration"');
  ctx.body = {
    error: 'invalid_token',
    error_description: 'A valid registration access token is required'
  };
}

function buildClientRegistrationResponse(
  record: ClientRegistrationRecord,
  options: { includeRegistrationAccessToken: boolean; includeClientSecret?: boolean }
) {
  const response: Record<string, unknown> = {
    client_id: record.clientId,
    client_id_issued_at: record.clientIdIssuedAt,
    token_endpoint_auth_method: record.tokenEndpointAuthMethod,
    redirect_uris: record.redirectUris,
    client_secret_expires_at: record.clientSecretExpiresAt ?? 0,
    scope: record.scope,
    client_name: record.clientName,
    registration_client_uri: record.registrationClientUri
  };

  if (options.includeClientSecret && record.clientSecret) {
    response.client_secret = record.clientSecret;
  }

  if (options.includeRegistrationAccessToken) {
    response.registration_access_token = record.registrationAccessToken;
  }

  return response;
}

function parseTokenEndpointAuthMethod(value: unknown): TokenEndpointAuthMethod | null {
  if (value === undefined || value === null) {
    return 'none';
  }
  if (typeof value !== 'string') {
    return null;
  }
  const normalised = value.toLowerCase();
  return isTokenEndpointAuthMethod(normalised) ? normalised : null;
}

function isTokenEndpointAuthMethod(value: string): value is TokenEndpointAuthMethod {
  return (TOKEN_AUTH_METHODS as readonly string[]).includes(value);
}
