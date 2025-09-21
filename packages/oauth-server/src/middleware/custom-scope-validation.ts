/**
 * Custom Scope Validation Middleware for oidc-provider
 *
 * This middleware addresses oidc-provider's scope validation inconsistency
 * where it advertises scopes in discovery but rejects explicit requests for them.
 *
 * Strategy: Transform client scope requests to match the working pattern from commit bd69f1e
 * where MCP Jam successfully showed the OAuth consent screen.
 */

import type { Context, Next } from 'koa';
import { logger } from '../services/logger.js';
import { getDefaultScopes, getSupportedScopes } from '../config/oauth-scopes.js';

export interface ClientScopeStrategy {
  strategy: 'pass-through' | 'use-defaults' | 'filter-excessive' | 'transform-to-valid';
  allowOpenId: boolean;
  maxScopes?: number;
  preferredScopes?: string[];
}

export interface ScopeValidationConfig {
  allowedMittwaldScopes: Set<string>;
  clientScopeStrategies: Map<string, ClientScopeStrategy>;
  defaultScopes: string[];
  enableDetailedLogging: boolean;
}

export class CustomScopeValidator {
  private config: ScopeValidationConfig;

  constructor(config?: Partial<ScopeValidationConfig>) {
    this.config = {
      allowedMittwaldScopes: new Set(getSupportedScopes()),
      clientScopeStrategies: new Map([
        // MCP Jam Inspector - already working, don't touch
        ['MCPJam', {
          strategy: 'pass-through',
          allowOpenId: false,
        }],
        ['MCPJam - Mittwald', {
          strategy: 'pass-through',
          allowOpenId: false,
        }],

        // Claude.ai - transform excessive scope requests
        ['Claude', {
          strategy: 'filter-excessive',
          allowOpenId: false, // Convert openid requests to no-scope (use defaults)
          maxScopes: 10,
          preferredScopes: ['user:read', 'customer:read', 'project:read', 'project:write', 'app:read', 'app:write', 'database:read', 'database:write', 'domain:read', 'domain:write']
        }],

        // ChatGPT - use server defaults like MCP Jam
        ['ChatGPT', {
          strategy: 'use-defaults',
          allowOpenId: false,
        }],

        // CI Smoke test
        ['CI Smoke', {
          strategy: 'use-defaults',
          allowOpenId: false,
        }]
      ]),
      defaultScopes: getDefaultScopes() as string[],
      enableDetailedLogging: true,
      ...config
    };
  }

  /**
   * Main middleware function to validate and transform scope requests
   */
  async validateAndTransform(ctx: Context, next: Next): Promise<void> {
    try {
      // Only process OAuth authorization requests
      if (ctx.path !== '/auth' || ctx.method !== 'GET') {
        return next();
      }

      const originalScope = ctx.query.scope as string;
      const clientId = ctx.query.client_id as string;

      if (!originalScope && !clientId) {
        // No scope parameter - let oidc-provider handle normally (this works for MCP Jam)
        this.logScopeDecision('No scope parameter provided, using oidc-provider defaults', {
          clientId,
          originalScope,
          action: 'pass-through'
        });
        return next();
      }

      // Get client info for strategy determination
      const clientName = await this.getClientName(clientId);
      const strategy = this.getClientStrategy(clientName, clientId);

      if (strategy.strategy === 'pass-through') {
        this.logScopeDecision('Pass-through strategy', {
          clientId,
          clientName,
          originalScope,
          action: 'pass-through'
        });
        return next();
      }

      // Apply scope transformation
      const transformedScope = this.transformScope(originalScope, strategy, clientName || 'unknown');

      if (transformedScope !== originalScope) {
        // Modify the request parameters for oidc-provider
        ctx.query = {
          ...ctx.query,
          scope: transformedScope
        };

        // Also update the URL for consistency
        const url = new URL(ctx.request.url, `${ctx.protocol}://${ctx.host}`);
        if (transformedScope) {
          url.searchParams.set('scope', transformedScope);
        } else {
          url.searchParams.delete('scope');
        }
        ctx.request.url = url.pathname + url.search;

        this.logScopeDecision('Scope transformation applied', {
          clientId,
          clientName,
          originalScope,
          transformedScope,
          strategy: strategy.strategy,
          action: 'transformed'
        });
      }

      return next();

    } catch (error) {
      logger.error('Custom scope validation error', {
        error: error instanceof Error ? error.message : String(error),
        path: ctx.path,
        method: ctx.method,
        query: ctx.query
      });
      return next(); // Continue to oidc-provider even if our validation fails
    }
  }

  /**
   * Transform scope according to client strategy
   */
  private transformScope(originalScope: string | undefined, strategy: ClientScopeStrategy, clientName: string): string | undefined {
    if (!originalScope) {
      return strategy.strategy === 'use-defaults' ? this.config.defaultScopes.join(' ') : undefined;
    }

    const requestedScopes = originalScope.split(' ').filter(Boolean);

    switch (strategy.strategy) {
      case 'pass-through':
        return originalScope;

      case 'use-defaults':
        // Ignore whatever client requested, use our known working defaults
        return this.config.defaultScopes.join(' ');

      case 'filter-excessive':
        return this.filterExcessiveScopes(requestedScopes, strategy);

      case 'transform-to-valid':
        return this.transformToValidScopes(requestedScopes, strategy);

      default:
        logger.warn('Unknown scope strategy, using defaults', { strategy: strategy.strategy, clientName });
        return this.config.defaultScopes.join(' ');
    }
  }

  /**
   * Filter excessive scope requests to essential scopes
   */
  private filterExcessiveScopes(requestedScopes: string[], strategy: ClientScopeStrategy): string {
    let filteredScopes = requestedScopes.filter(scope => {
      // Remove openid if not allowed
      if (scope === 'openid' && !strategy.allowOpenId) {
        return false;
      }
      // Keep only Mittwald scopes
      return this.config.allowedMittwaldScopes.has(scope);
    });

    // Limit to max scopes if specified
    if (strategy.maxScopes && filteredScopes.length > strategy.maxScopes) {
      // Prefer strategy's preferred scopes
      const preferred = strategy.preferredScopes || this.config.defaultScopes;
      filteredScopes = preferred.slice(0, strategy.maxScopes);
    }

    // Fallback to defaults if filtering resulted in empty list
    if (filteredScopes.length === 0) {
      filteredScopes = this.config.defaultScopes;
    }

    return filteredScopes.join(' ');
  }

  /**
   * Transform scopes to valid alternatives
   */
  private transformToValidScopes(requestedScopes: string[], strategy: ClientScopeStrategy): string {
    const validScopes: string[] = [];

    for (const scope of requestedScopes) {
      if (scope === 'openid' && !strategy.allowOpenId) {
        // Transform openid request to essential read scopes
        validScopes.push('user:read', 'customer:read');
      } else if (this.config.allowedMittwaldScopes.has(scope)) {
        validScopes.push(scope);
      }
      // Invalid scopes are simply dropped
    }

    // Ensure we always have some scopes
    if (validScopes.length === 0) {
      return this.config.defaultScopes.join(' ');
    }

    // Deduplicate and limit
    const uniqueScopes = [...new Set(validScopes)];
    if (strategy.maxScopes && uniqueScopes.length > strategy.maxScopes) {
      return uniqueScopes.slice(0, strategy.maxScopes).join(' ');
    }

    return uniqueScopes.join(' ');
  }

  /**
   * Get client strategy based on name or ID
   */
  private getClientStrategy(clientName: string | null, clientId: string): ClientScopeStrategy {
    // Check by client name first
    if (clientName && this.config.clientScopeStrategies.has(clientName)) {
      return this.config.clientScopeStrategies.get(clientName)!;
    }

    // Check for known patterns in client ID or name
    if (clientName?.includes('Claude') || clientId?.includes('claude')) {
      return this.config.clientScopeStrategies.get('Claude')!;
    }

    if (clientName?.includes('ChatGPT') || clientId?.includes('chatgpt')) {
      return this.config.clientScopeStrategies.get('ChatGPT')!;
    }

    if (clientName?.includes('MCPJam') || clientName?.includes('MCP-Inspector')) {
      return this.config.clientScopeStrategies.get('MCPJam')!;
    }

    // Default strategy for unknown clients
    return {
      strategy: 'use-defaults',
      allowOpenId: false,
    };
  }

  /**
   * Get client name from registration (with caching)
   */
  private async getClientName(clientId: string): Promise<string | null> {
    if (!clientId) return null;

    try {
      // In a real implementation, we'd look up the client in our database
      // For now, we'll rely on pattern matching in getClientStrategy
      return null;
    } catch (error) {
      logger.debug('Failed to get client name', { clientId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Enhanced logging for scope validation decisions
   */
  private logScopeDecision(message: string, details: any): void {
    if (this.config.enableDetailedLogging) {
      logger.info(message, {
        ...details,
        component: 'custom-scope-validator',
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Create middleware instance with default configuration
 */
export function createCustomScopeValidationMiddleware(): (ctx: Context, next: Next) => Promise<void> {
  const validator = new CustomScopeValidator();
  return validator.validateAndTransform.bind(validator);
}

/**
 * Create middleware with custom configuration
 */
export function createCustomScopeValidationMiddlewareWithConfig(config: Partial<ScopeValidationConfig>): (ctx: Context, next: Next) => Promise<void> {
  const validator = new CustomScopeValidator(config);
  return validator.validateAndTransform.bind(validator);
}