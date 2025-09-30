/**
 * @file Global constants for the Mittwald MCP server
 * @module constants
 * 
 * @remarks 
 * This module contains constant values used throughout the Mittwald MCP server,
 * including API endpoints, rate limits, default values, and error messages.
 */


/**
 * Default delay between API requests in milliseconds.
 * 
 * @remarks
 * Mittwald API has rate limits. This delay helps prevent hitting rate limits.
 * 
 * @default 1000 (1 second)
 */
export const DEFAULT_RATE_LIMIT_DELAY = 1000; // 1 second

/**
 * Default number of items to fetch in listing requests.
 * 
 * @remarks
 * Provides a good balance between performance and usability
 * for list operations like projects, apps, etc.
 * 
 * @default 25
 */
export const DEFAULT_ITEM_LIMIT = 25;

/**
 * Standardized error messages for Mittwald API operations.
 * 
 * @remarks
 * These messages provide consistent error reporting throughout
 * the application. They should be used with appropriate error classes.
 * 
 * @example
 * ```typescript
 * throw new Error(
 *   MITTWALD_ERROR_MESSAGES.INVALID_AUTH
 * );
 * ```
 */
export const MITTWALD_ERROR_MESSAGES = {
  /** Configuration is missing required fields or has invalid values */
  MISSING_CONFIG: "Mittwald configuration is missing or invalid",
  /** Authentication failed or session invalid */
  INVALID_AUTH: "Authentication failed. Please complete OAuth sign-in.",
  /** Mittwald API rate limit has been exceeded */
  RATE_LIMIT: "Mittwald API rate limit exceeded",
  /** General Mittwald API request failure */
  API_ERROR: "Mittwald API request failed",
  /** Request parameters failed validation */
  VALIDATION_ERROR: "Invalid request parameters",
} as const;
