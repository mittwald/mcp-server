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

      logger.info('Token exchange request', {
        grant_type,
        code: code ? `${code.substring(0, 8)}...` : 'missing',
        client_id,
        redirect_uri,
        has_code_verifier: !!code_verifier
      });

      // Validate grant type
      if (grant_type !== 'authorization_code') {
        ctx.status = 400;
        ctx.body = {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported'
        };
        return;
      }

      // Validate required parameters
      if (!code) {
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Missing authorization code'
        };
        return;
      }

      if (!client_id) {
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_request',
          error_description: 'Missing client_id'
        };
        return;
      }

      // Retrieve and consume authorization code
      const authData = authCodeStore.retrieve(code);
      if (!authData) {
        logger.warn('Invalid or expired authorization code', {
          code: `${code.substring(0, 8)}...`,
          client_id
        });
        ctx.status = 400;
        ctx.body = {
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        };
        return;
      }

      // Validate client ID
      if (authData.clientId !== client_id) {
        logger.error('Client ID mismatch in token exchange', {
          expected: authData.clientId,
          provided: client_id,
          code: `${code.substring(0, 8)}...`
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