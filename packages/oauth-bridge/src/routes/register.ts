import Router from '@koa/router';
import { randomBytes, randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore, ClientRegistrationRecord } from '../state/state-store.js';
import { RegistrationTokenStore } from '../registration-token-store.js';
import { createDcrAuthMiddleware } from '../middleware/dcr-auth.js';

interface RegisterRouterDeps {
  config: BridgeConfig;
  stateStore: StateStore;
  registrationTokenStore: RegistrationTokenStore;
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

export function createRegisterRouter({ config, stateStore, registrationTokenStore }: RegisterRouterDeps) {
  const router = new Router();
  const dcrAuth = createDcrAuthMiddleware(registrationTokenStore);

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
    const issuedAt = Math.floor(Date.now() / 1000);

    // Generate secure registration access token using the new token store
    // The plaintext token is returned only once; only its hash is stored
    let registrationAccessToken: string;
    let registrationAccessTokenExpiresAt: number;
    try {
      const tokenResult = await registrationTokenStore.createToken(clientId);
      registrationAccessToken = tokenResult.token;
      registrationAccessTokenExpiresAt = Math.floor(tokenResult.expiresAt / 1000); // Convert to seconds
    } catch (error) {
      ctx.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to create registration access token');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to create registration access token'
      };
      return;
    }

    const clientRecord: ClientRegistrationRecord = {
      clientId,
      tokenEndpointAuthMethod: authMethod,
      clientSecret,
      redirectUris,
      scope,
      clientName,
      // Note: We no longer store the plaintext token in the client record
      // The registrationAccessToken field now stores a placeholder indicating
      // the token is managed by RegistrationTokenStore
      registrationAccessToken: '[HASHED]',
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
      // Clean up the token if client registration fails
      await registrationTokenStore.deleteToken(clientId).catch(() => {});
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
    ctx.body = buildClientRegistrationResponse(clientRecord, {
      includeRegistrationAccessToken: true,
      includeClientSecret: true,
      registrationAccessToken,
      registrationAccessTokenExpiresAt
    });
  });

  // GET /register/:clientId - Protected by dcrAuth middleware
  router.get('/register/:clientId', dcrAuth, async (ctx) => {
    const clientId = ctx.params.clientId;

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

    // Token is already validated by middleware
    // Note: We don't return the registration_access_token on GET requests
    // per RFC 7592 Section 2.1 - token is only shown on initial registration
    ctx.body = buildClientRegistrationResponse(record, {
      includeRegistrationAccessToken: false,
      includeClientSecret: true
    });
  });

  // DELETE /register/:clientId - Protected by dcrAuth middleware
  router.delete('/register/:clientId', dcrAuth, async (ctx) => {
    const clientId = ctx.params.clientId;

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

    // Token is already validated by middleware
    // Delete both the client registration and the token
    try {
      await Promise.all([
        stateStore.deleteClientRegistration(clientId),
        registrationTokenStore.deleteToken(clientId)
      ]);
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

function buildClientRegistrationResponse(
  record: ClientRegistrationRecord,
  options: {
    includeRegistrationAccessToken: boolean;
    includeClientSecret?: boolean;
    registrationAccessToken?: string;
    registrationAccessTokenExpiresAt?: number;
  }
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

  // Per RFC 7592: registration_access_token is returned during initial registration
  // and optionally on subsequent requests. We only return it on POST /register.
  if (options.includeRegistrationAccessToken && options.registrationAccessToken) {
    response.registration_access_token = options.registrationAccessToken;
    // Include expiration timestamp per RFC 7592 Section 3
    if (options.registrationAccessTokenExpiresAt) {
      response.registration_access_token_expires_at = options.registrationAccessTokenExpiresAt;
    }
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
