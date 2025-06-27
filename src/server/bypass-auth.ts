import express from "express";
import type { AuthenticatedRequest } from "./oauth.js";

/**
 * Bypass authentication middleware for development/non-OAuth environments
 * 
 * @remarks
 * This middleware allows all requests through without authentication.
 * It's useful for:
 * - Development environments
 * - Services that use API keys instead of OAuth
 * - Internal/trusted environments
 * 
 * The middleware maintains the same interface as the OAuth middleware
 * so it can be used as a drop-in replacement.
 */
export function bypassAuthMiddleware() {
  return async (
    _req: AuthenticatedRequest,
    _res: express.Response,
    next: express.NextFunction,
  ): Promise<void> => {
    // Simply pass through without authentication
    // The MCP handler will work without auth info
    next();
  };
}