/**
 * Centralized OAuth scope configuration for OAuth Server
 * This should match the main src/config/oauth-scopes.ts
 */

export interface OAuthScopeConfig {
  /** All scopes that the Mittwald MCP system supports */
  readonly SUPPORTED_SCOPES: readonly string[];

  /** Default scopes to request in OAuth flows */
  readonly DEFAULT_SCOPES: readonly string[];

  /** Scopes formatted as space-separated string for OAuth requests */
  readonly DEFAULT_SCOPE_STRING: string;
}

/**
 * OAuth scope configuration for Mittwald MCP
 *
 * IMPORTANT: This is the OAuth server copy of the scope configuration.
 * Keep in sync with src/config/oauth-scopes.ts
 *
 * Note: 'openid' scope is intentionally excluded because Mittwald's OAuth
 * implementation doesn't return id_token, which causes validation failures.
 */
export const OAUTH_SCOPES: OAuthScopeConfig = {
  SUPPORTED_SCOPES: [
    'profile',
    'user:read',
    'customer:read',
    'project:read'
  ] as const,

  DEFAULT_SCOPES: [
    'profile',
    'user:read',
    'customer:read',
    'project:read'
  ] as const,

  get DEFAULT_SCOPE_STRING(): string {
    return this.DEFAULT_SCOPES.join(' ');
  }
} as const;

/**
 * Helper to get scopes as array (for metadata endpoints)
 */
export function getSupportedScopes(): readonly string[] {
  return OAUTH_SCOPES.SUPPORTED_SCOPES;
}

/**
 * Helper to get default scopes as array
 */
export function getDefaultScopes(): readonly string[] {
  return OAUTH_SCOPES.DEFAULT_SCOPES;
}

/**
 * Helper to get default scopes as space-separated string (for OAuth requests)
 */
export function getDefaultScopeString(): string {
  return OAUTH_SCOPES.DEFAULT_SCOPE_STRING;
}