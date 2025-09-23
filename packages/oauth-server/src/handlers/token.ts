import Router from '@koa/router';
import { authCodeStore } from '../services/auth-code-store.js';
import { logger } from '../services/logger.js';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

// PKCE helper functions
function base64URLEncode(str: Buffer): string {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function validatePKCE(codeVerifier: string, codeChallenge: string): boolean {
  if (!codeVerifier || !codeChallenge) return false;

  const computed = base64URLEncode(createHash('sha256').update(codeVerifier).digest());
  return computed === codeChallenge;
}

export function registerTokenRoutes(router: Router) {
  // Custom token endpoint for manual authorization codes
  router.post('/token', async (ctx) => {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        code_verifier
      } = ctx.request.body as any;

      logger.info('TOKEN EXCHANGE: Request received', {
        grant_type,
        code: code ? `${code.substring(0, 8)}...` : 'missing',
        fullCode: code,
        client_id,
        redirect_uri,
        has_code_verifier: !!code_verifier,
        authCodeStoreSize: authCodeStore.size()
      });

      // Validate grant type (support both authorization_code and refresh_token)
      if (grant_type !== 'authorization_code' && grant_type !== 'refresh_token') {
        logger.error('TOKEN EXCHANGE: Invalid grant type', {
          provided: grant_type,
          expected: 'authorization_code or refresh_token'
        });
        ctx.status = 400;
        ctx.body = {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code and refresh_token grant types are supported'
        };
        return;
      }

      // Handle refresh token flow
      if (grant_type === 'refresh_token') {
        return await handleRefreshToken(ctx);
      }

      // Validate required parameters
      if (!code) {
        logger.error('TOKEN EXCHANGE: Missing authorization code', {
          hasCode: !!code,
          bodyKeys: Object.keys(ctx.request.body || {})
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Missing authorization code'
        };
        return;
      }

      if (!client_id) {
        logger.error('TOKEN EXCHANGE: Missing client_id', {
          hasClientId: !!client_id,
          bodyKeys: Object.keys(ctx.request.body || {})
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Missing client_id'
        };
        return;
      }

      // Retrieve and consume authorization code
      logger.info('TOKEN EXCHANGE: Looking up authorization code', {
        code: `${code.substring(0, 8)}...`,
        fullCode: code,
        storeSize: authCodeStore.size(),
        requestedClientId: client_id
      });

      const authData = authCodeStore.retrieve(code);

      if (!authData) {
        logger.warn('TOKEN EXCHANGE: Authorization code not found in store', {
          code: `${code.substring(0, 8)}...`,
          fullCode: code,
          client_id,
          storeSize: authCodeStore.size(),
          storeEmpty: authCodeStore.size() === 0
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        };
        return;
      }

      logger.info('TOKEN EXCHANGE: Authorization code found, validating client ID', {
        storedClientId: authData.clientId,
        requestedClientId: client_id,
        clientIdMatch: authData.clientId === client_id,
        code: `${code.substring(0, 8)}...`,
        storedRedirectUri: authData.redirectUri,
        requestedRedirectUri: redirect_uri
      });

      // Validate client ID
      if (authData.clientId !== client_id) {
        logger.error('TOKEN EXCHANGE: Client ID mismatch', {
          expected: authData.clientId,
          provided: client_id,
          code: `${code.substring(0, 8)}...`,
          authDataFull: JSON.stringify(authData, null, 2)
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_grant',
          error_description: 'Authorization code was not issued to this client'
        };
        return;
      }

      // Validate redirect URI
      if (redirect_uri && redirect_uri !== authData.redirectUri) {
        logger.error('Redirect URI mismatch in token exchange', {
          expected: authData.redirectUri,
          provided: redirect_uri,
          client_id
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_grant',
          error_description: 'Redirect URI mismatch'
        };
        return;
      }

      // Validate PKCE if challenge was stored
      if (authData.codeChallenge) {
        if (!code_verifier) {
          logger.error('PKCE code verifier required but not provided', {
            client_id,
            code_challenge_method: authData.codeChallengeMethod
          });
          ctx.status = 400;
          ctx.body = {
            error: 'invalid_grant',
            error_description: 'PKCE code verifier required'
          };
          return;
        }

        if (authData.codeChallengeMethod !== 'S256') {
          logger.error('Unsupported PKCE challenge method', {
            client_id,
            method: authData.codeChallengeMethod
          });
          ctx.status = 400;
          ctx.body = {
            error: 'invalid_grant',
            error_description: 'Unsupported code challenge method'
          };
          return;
        }

        if (!validatePKCE(code_verifier, authData.codeChallenge)) {
          logger.error('PKCE validation failed', {
            client_id,
            code_challenge: authData.codeChallenge.substring(0, 8) + '...'
          });
          ctx.status = 400;
          ctx.body = {
            error: 'invalid_grant',
            error_description: 'PKCE validation failed'
          };
          return;
        }

        logger.info('PKCE validation successful', { client_id });
      } else if (code_verifier) {
        logger.warn('PKCE code verifier provided but no challenge stored', {
          client_id,
          has_verifier: true
        });
      }

      // Generate JWT tokens
      const issuer = process.env.ISSUER || 'http://localhost:3000';
      const audience = process.env.ALLOWED_RESOURCE || 'https://mittwald-mcp-fly2.fly.dev';
      const now = Math.floor(Date.now() / 1000);

      const accessTokenPayload = {
        iss: issuer,
        sub: authData.accountId,
        aud: audience,
        exp: now + 3600, // 1 hour
        iat: now,
        jti: nanoid(),
        client_id: authData.clientId,
        mittwald: {
          access_token: authData.accessToken,
          refresh_token: authData.refreshToken,
          issued_at: authData.createdAt
        }
      };

      // For now, use a simple signing key (in production, use proper JWKS)
      const signingKey = process.env.JWT_SIGNING_KEY || 'development-key-not-secure';
      const accessToken = jwt.sign(accessTokenPayload, signingKey, { algorithm: 'HS256' });

      const response: any = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user:read customer:read project:read project:write app:read app:write database:read database:write domain:read domain:write'
      };

      // Include refresh token if available
      if (authData.refreshToken) {
        response.refresh_token = jwt.sign({
          ...accessTokenPayload,
          exp: now + 86400, // 24 hours
          mittwald_refresh_token: authData.refreshToken
        }, signingKey, { algorithm: 'HS256' });
      }

      logger.info('Token exchange successful', {
        client_id: authData.clientId,
        account_id: authData.accountId ? `${authData.accountId.substring(0, 8)}...` : 'none',
        has_refresh_token: !!authData.refreshToken,
        expires_in: 3600
      });

      ctx.body = response;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Token exchange error', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });

      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Internal server error during token exchange'
      };
    }
  });

  // Token introspection endpoint (optional, for debugging)
  router.post('/token/introspect', async (ctx) => {
    try {
      const { token } = ctx.request.body as any;

      if (!token) {
        ctx.status = 400;
        ctx.body = { error: 'invalid_request', error_description: 'Missing token' };
        return;
      }

      const signingKey = process.env.JWT_SIGNING_KEY || 'development-key-not-secure';

      try {
        const decoded = jwt.verify(token, signingKey) as any;

        ctx.body = {
          active: true,
          client_id: decoded.client_id,
          sub: decoded.sub,
          exp: decoded.exp,
          iat: decoded.iat,
          iss: decoded.iss,
          aud: decoded.aud
        };
      } catch (jwtError) {
        ctx.body = { active: false };
      }

    } catch (error) {
      logger.error('Token introspection error', {
        error: error instanceof Error ? error.message : String(error)
      });
      ctx.status = 500;
      ctx.body = { error: 'server_error' };
    }
  });
}

/**
 * Handle refresh token grant type
 */
async function handleRefreshToken(ctx: any): Promise<void> {
  try {
    const { refresh_token, client_id } = ctx.request.body as any;

    logger.info('REFRESH TOKEN: Request received', {
      client_id,
      has_refresh_token: !!refresh_token
    });

    // Validate required parameters
    if (!refresh_token) {
      logger.error('REFRESH TOKEN: Missing refresh token');
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_request',
        error_description: 'Missing refresh_token'
      };
      return;
    }

    if (!client_id) {
      logger.error('REFRESH TOKEN: Missing client_id');
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_request',
        error_description: 'Missing client_id'
      };
      return;
    }

    // Validate and decode refresh token
    const signingKey = process.env.JWT_SIGNING_KEY || 'development-key-not-secure';
    let decoded: any;

    try {
      decoded = jwt.verify(refresh_token, signingKey) as any;
      logger.info('REFRESH TOKEN: Token validated', {
        client_id: decoded.client_id,
        sub: decoded.sub,
        exp: decoded.exp
      });
    } catch (jwtError) {
      logger.error('REFRESH TOKEN: Invalid refresh token', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_grant',
        error_description: 'Invalid or expired refresh token'
      };
      return;
    }

    // Validate client ID matches
    if (decoded.client_id !== client_id) {
      logger.error('REFRESH TOKEN: Client ID mismatch', {
        expected: decoded.client_id,
        provided: client_id
      });
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_grant',
        error_description: 'Refresh token was not issued to this client'
      };
      return;
    }

    // Check if refresh token is expired
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      logger.error('REFRESH TOKEN: Token expired', {
        exp: decoded.exp,
        now: Math.floor(Date.now() / 1000)
      });
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_grant',
        error_description: 'Refresh token has expired'
      };
      return;
    }

    // Extract Mittwald refresh token for token refresh
    const mittwaldRefreshToken = decoded.mittwald_refresh_token || decoded.mittwald?.refresh_token;

    if (!mittwaldRefreshToken) {
      logger.error('REFRESH TOKEN: Missing Mittwald refresh token in JWT');
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_grant',
        error_description: 'Refresh token does not contain Mittwald credentials'
      };
      return;
    }

    // TODO: Exchange Mittwald refresh token for new access token
    // For now, reuse existing Mittwald tokens (they have longer TTL)
    logger.info('REFRESH TOKEN: Reusing Mittwald tokens (TODO: implement refresh)');

    // Generate new JWT tokens
    const issuer = process.env.ISSUER || 'http://localhost:3000';
    const audience = process.env.ALLOWED_RESOURCE || 'https://mittwald-mcp-fly2.fly.dev';
    const now = Math.floor(Date.now() / 1000);

    const accessTokenPayload = {
      iss: issuer,
      sub: decoded.sub,
      aud: audience,
      exp: now + 3600, // 1 hour
      iat: now,
      jti: nanoid(),
      client_id: decoded.client_id,
      mittwald: decoded.mittwald || {
        access_token: decoded.mittwald?.access_token,
        refresh_token: mittwaldRefreshToken,
        issued_at: Date.now()
      }
    };

    const newAccessToken = jwt.sign(accessTokenPayload, signingKey, { algorithm: 'HS256' });
    const newRefreshToken = jwt.sign({
      ...accessTokenPayload,
      exp: now + 86400, // 24 hours
      mittwald_refresh_token: mittwaldRefreshToken
    }, signingKey, { algorithm: 'HS256' });

    const response = {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: 'user:read customer:read project:read project:write app:read app:write database:read database:write domain:read domain:write'
    };

    logger.info('REFRESH TOKEN: New tokens issued', {
      client_id: decoded.client_id,
      sub: decoded.sub,
      expires_in: 3600
    });

    ctx.body = response;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('REFRESH TOKEN: Server error', {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined
    });

    ctx.status = 500;
    ctx.body = {
      error: 'server_error',
      error_description: 'Internal server error during token refresh'
    };
  }
}