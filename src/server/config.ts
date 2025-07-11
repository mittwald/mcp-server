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
 * - MITTWALD_API_TOKEN: API token for Mittwald API access
 * - JWT_SECRET: Secret key for signing JWT tokens (if OAuth enabled)
 *
 * Optional environment variables:
 * - OAUTH_ISSUER: Base URL for OAuth endpoints
 * - REDIRECT_URL: OAuth callback URL
 * - PORT: Server port (default: 3000)
 * - DISABLE_OAUTH: Set to "true" to disable OAuth (default: false)
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
export interface ServerConfig {
  /** Mittwald API token for API access */
  MITTWALD_API_TOKEN: string;
  /** Secret key for JWT token signing (optional if OAuth disabled) */
  JWT_SECRET?: string;
  /** Base URL for OAuth issuer (production or localhost) */
  OAUTH_ISSUER: string;
  /** OAuth callback redirect URL */
  REDIRECT_URL: string;
  /** Server port number */
  PORT: string;
  /** Whether to disable OAuth authentication */
  DISABLE_OAUTH: boolean;
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
export const CONFIG: ServerConfig = {
  MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || "",
  JWT_SECRET: process.env.JWT_SECRET,
  OAUTH_ISSUER: process.env.OAUTH_ISSUER || 
    (process.env.NODE_ENV === "production" 
      ? "https://mittwald-mcp.example.com"
      : `http://localhost:${process.env.PORT || "3000"}`),
  REDIRECT_URL: process.env.REDIRECT_URL || 
    `${process.env.OAUTH_ISSUER || `http://localhost:${process.env.PORT || "3000"}`}/oauth/callback`,
  PORT: process.env.PORT || "3000",
  DISABLE_OAUTH: process.env.DISABLE_OAUTH === "true",
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
  const requiredVars = [
    "MITTWALD_API_TOKEN",
  ];

  // JWT_SECRET is only required if OAuth is enabled
  if (!CONFIG.DISABLE_OAUTH && !CONFIG.JWT_SECRET) {
    requiredVars.push("JWT_SECRET");
  }

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
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
export const OAUTH_DISABLED = CONFIG.DISABLE_OAUTH;

export default CONFIG;