/**
 * Centralized OAuth scope configuration
 * This is the single source of truth for all OAuth scopes in the system
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
 * IMPORTANT: This is the ONLY place where OAuth scopes should be defined.
 * All other files should import and use these values.
 *
 * Note: 'openid' scope is intentionally excluded because Mittwald's OAuth
 * implementation doesn't return id_token, which causes validation failures.
 */
export const OAUTH_SCOPES: OAuthScopeConfig = {
  SUPPORTED_SCOPES: [
    // Application Management
    'app:read',
    'app:write',
    'app:delete',
    // Backup Management
    'backup:read',
    'backup:write',
    'backup:delete',
    // Contract & Business
    'contract:read',
    'contract:write',
    // Cron Job Management
    'cronjob:read',
    'cronjob:write',
    'cronjob:delete',
    // Customer Management
    'customer:read',
    'customer:write',
    // Database Management
    'database:read',
    'database:write',
    'database:delete',
    // Domain & DNS Management
    'domain:read',
    'domain:write',
    'domain:delete',
    // Extension Management
    'extension:read',
    'extension:write',
    'extension:delete',
    // Mail Management
    'mail:read',
    'mail:write',
    'mail:delete',
    // Order Management
    'order:domain-create',
    'order:domain-preview',
    // Project Management
    'project:read',
    'project:write',
    'project:delete',
    // Registry Management
    'registry:read',
    'registry:write',
    'registry:delete',
    // SSH User Management
    'sshuser:read',
    'sshuser:write',
    'sshuser:delete',
    // Container Stack Management
    'stack:read',
    'stack:write',
    'stack:delete',
    // User Management
    'user:read',
    'user:write'
  ] as const,

  DEFAULT_SCOPES: [
    'user:read',
    'customer:read',
    'project:read',
    'project:write',
    'app:read',
    'app:write',
    'database:read',
    'database:write',
    'domain:read',
    'domain:write'
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