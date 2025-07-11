/**
 * @file Authentication types
 * @module server/auth-types
 */

import type { Request } from 'express';

/**
 * Authenticated request interface
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    mittwaldApiToken?: string;
  };
}

/**
 * OAuth provider interface stub
 */
export interface OAuthProvider {
  setupRoutes(): void;
}