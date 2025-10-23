/**
 * @file Server configuration management
 * @module server/config
 *
 * @remarks
 * This module manages all server configuration including environment variables,
 * API settings, and validation. It provides a centralized configuration
 * object that is used throughout the application.
 *
 * Required environment variables:
 * - JWT_SECRET: Secret key for signing JWT tokens
 *
 * Optional environment variables:
 * - OAUTH_ISSUER: Base URL for OAuth endpoints
 * - REDIRECT_URL: OAuth callback URL
 * - PORT: Server port (default: 3000)
 */

import dotenv from "dotenv";
dotenv.config();

/**
 * Server configuration interface
 *
 * @remarks
 * Defines all configuration values required by the server.
 * These values are typically loaded from environment variables.
 */
export interface OAuthBridgeConfig {
  /** Shared secret for verifying OAuth bridge JWTs */
  JWT_SECRET: string;
  /** Expected issuer (optional) */
  ISSUER?: string;
  /** Expected audience (optional) */
  AUDIENCE?: string;
  /** Base URL for the OAuth bridge (used for discovery) */
  BASE_URL?: string;
  /** Authorization endpoint override */
  AUTHORIZATION_URL?: string;
  /** Token endpoint override */
  TOKEN_URL?: string;
}

export interface MittwaldOAuthConfig {
  /** OAuth token endpoint for Mittwald */
  TOKEN_URL?: string;
  /** Mittwald OAuth client identifier */
  CLIENT_ID?: string;
}

export interface ServerConfig {
  /** Secret key for JWT token signing */
  JWT_SECRET?: string;
  /** OAuth bridge verification configuration */
  OAUTH_BRIDGE: OAuthBridgeConfig;
  /** Base URL for OAuth issuer (production or localhost) */
  OAUTH_ISSUER: string;
  /** OAuth callback redirect URL */
  REDIRECT_URL: string;
  /** Server port number */
  PORT: string;
  /** Mittwald OAuth configuration (used for refresh tokens) */
  MITTWALD: MittwaldOAuthConfig;
  /** Reserved for future flags (no OAuth bypass) */
  // no-op
  /** Test server ID for running tests */
  TEST_SERVER_ID?: string;
  /** Test admin email for running tests */
  TEST_ADMIN_EMAIL?: string;
  /** Whether to skip test cleanup */
  SKIP_TEST_CLEANUP?: boolean;
  /** Whether to run tests in parallel */
  TEST_PARALLEL?: boolean;
  /** Whether to enable tool filtering */
  TOOL_FILTER_ENABLED?: boolean;
  /** Maximum number of tools per response */
  MAX_TOOLS_PER_RESPONSE?: number;
  /** Allowed tool categories */
  ALLOWED_TOOL_CATEGORIES?: string;
}

/**
 * Server configuration object
 *
 * @remarks
 * Centralized configuration loaded from environment variables.
 * Used throughout the application for consistent settings.
 */
const resolvedJwtSecret = process.env.OAUTH_BRIDGE_JWT_SECRET || process.env.JWT_SECRET;

function normalizeBaseUrl(url: string | undefined): string {
  const value = url && url.trim().length > 0 ? url.trim() : undefined;
  if (!value) {
    return '';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveOauthIssuer(): string {
  const explicitIssuer = normalizeBaseUrl(process.env.OAUTH_ISSUER);
  if (explicitIssuer) {
    return explicitIssuer;
  }

  const publicBase = normalizeBaseUrl(process.env.MCP_PUBLIC_BASE);
  if (publicBase) {
    return publicBase;
  }

  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return 'https://mittwald-mcp-fly2.fly.dev';
  }

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

function resolveRedirectUrl(issuer: string): string {
  const explicitRedirect = process.env.REDIRECT_URL?.trim();
  if (explicitRedirect) {
    return explicitRedirect;
  }
  return `${issuer}/oauth/callback`;
}

const resolvedIssuer = resolveOauthIssuer();

export const CONFIG: ServerConfig = {
  JWT_SECRET: resolvedJwtSecret,
  OAUTH_BRIDGE: {
    JWT_SECRET: resolvedJwtSecret || '',
    ISSUER: process.env.OAUTH_BRIDGE_ISSUER,
    AUDIENCE: process.env.OAUTH_BRIDGE_AUDIENCE,
    BASE_URL: process.env.OAUTH_BRIDGE_BASE_URL,
    AUTHORIZATION_URL: process.env.OAUTH_BRIDGE_AUTHORIZATION_URL,
    TOKEN_URL: process.env.OAUTH_BRIDGE_TOKEN_URL
  },
  OAUTH_ISSUER: resolvedIssuer,
  REDIRECT_URL: resolveRedirectUrl(resolvedIssuer),
  PORT: process.env.PORT || "3000",
  MITTWALD: {
    TOKEN_URL: process.env.MITTWALD_TOKEN_URL,
    CLIENT_ID: process.env.MITTWALD_CLIENT_ID,
  },
  // no OAuth bypass
  TEST_SERVER_ID: process.env.TEST_SERVER_ID,
  TEST_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL,
  SKIP_TEST_CLEANUP: process.env.SKIP_TEST_CLEANUP === "true",
  TEST_PARALLEL: process.env.TEST_PARALLEL !== "false",
  TOOL_FILTER_ENABLED: process.env.TOOL_FILTER_ENABLED === "true",
  MAX_TOOLS_PER_RESPONSE: process.env.MAX_TOOLS_PER_RESPONSE ? parseInt(process.env.MAX_TOOLS_PER_RESPONSE) : 50,
  ALLOWED_TOOL_CATEGORIES: process.env.ALLOWED_TOOL_CATEGORIES,
};

/**
 * Validates required configuration values
 *
 * @remarks
 * Checks that all required environment variables are set.
 * Throws an error if any required values are missing.
 */
export function validateConfig(): void {
  const requiredVars: string[] = [];
  if (!CONFIG.JWT_SECRET) {
    requiredVars.push("JWT_SECRET");
  }
  if (!CONFIG.OAUTH_BRIDGE.JWT_SECRET) {
    requiredVars.push("OAUTH_BRIDGE_JWT_SECRET or JWT_SECRET");
  }
  if (requiredVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${requiredVars.join(", ")}`
    );
  }
}

/**
 * OAuth callback URLs for development and production
 *
 * @remarks
 * Predefined callback URLs for different environments.
 * Used for OAuth redirect URI validation.
 */
export const OAUTH_CALLBACK_URLS = [
  `http://localhost:${CONFIG.PORT}/oauth/callback`,
  "http://localhost:5173/oauth/callback",
  `${CONFIG.OAUTH_ISSUER}/oauth/callback`,
];

// Legacy exports for backwards compatibility
export const VALID_REDIRECT_URIS = OAUTH_CALLBACK_URLS;
// No OAuth-disabled mode

export default CONFIG;
