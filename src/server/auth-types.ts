/**
 * @file Authentication types
 * @module server/auth-types
 */

import type { Request } from 'express';
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

/**
 * Authenticated request interface
 */
export interface AuthenticatedRequest extends Request {
  auth?: AuthInfo;
}

/**
 * OAuth provider interface stub
 */
export interface OAuthProvider {
  setupRoutes(): void;
}