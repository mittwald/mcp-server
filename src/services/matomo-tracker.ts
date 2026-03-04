/**
 * @file Matomo analytics tracking service
 * @module services/matomo-tracker
 *
 * @remarks
 * This service provides event tracking for MCP tool invocations via Matomo.
 * It uses the Matomo Tracking API to send events asynchronously without
 * blocking tool execution.
 *
 * @see {@link https://developer.matomo.org/api-reference/tracking-api | Matomo Tracking API}
 */

import { createHash } from 'node:crypto';
import { CONFIG } from '../server/config.js';
import { logger } from '../utils/logger.js';

/**
 * Event data for tool invocation tracking
 */
export interface ToolInvocationEvent {
  /** Tool name (e.g., "mittwald_app_list") */
  toolName: string;
  /** Tool domain extracted from name (e.g., "app") */
  toolDomain: string;
  /** Execution status */
  status: 'success' | 'error' | 'disabled';
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Session identifier */
  sessionId: string;
  /** User identifier (optional) */
  userId?: string;
  /** AI agent identifier from MCP client (optional) */
  aiAgent?: string;
  /** Error code if status is 'error' (optional) */
  errorCode?: string;
}

/**
 * Matomo Tracker service for analytics
 *
 * @remarks
 * Sends tracking events to Matomo asynchronously using the Tracking API.
 * All tracking is fire-and-forget to avoid impacting tool execution performance.
 */
class MatomoTracker {
  private enabled: boolean;
  private url: string | undefined;
  private siteId: string | undefined;
  private authToken: string | undefined;
  private agentDimensionId: number | undefined;
  private domainDimensionId: number | undefined;

  constructor() {
    this.enabled = CONFIG.MATOMO.ENABLED;
    this.url = CONFIG.MATOMO.URL;
    this.siteId = CONFIG.MATOMO.SITE_ID;
    this.authToken = CONFIG.MATOMO.AUTH_TOKEN;
    this.agentDimensionId = CONFIG.MATOMO.AGENT_DIMENSION_ID;
    this.domainDimensionId = CONFIG.MATOMO.DOMAIN_DIMENSION_ID;

    if (this.enabled) {
      if (!this.url || !this.siteId) {
        logger.warn('Matomo tracking enabled but MATOMO_URL or MATOMO_SITE_ID not configured');
        this.enabled = false;
      } else {
        logger.info(`Matomo tracking enabled: ${this.url} (site ${this.siteId})`);
      }
    }
  }

  /**
   * Check if Matomo tracking is enabled and properly configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Track a tool invocation event
   *
   * @remarks
   * Sends an event to Matomo with the following structure:
   * - Category (e_c): "tool_invocation"
   * - Action (e_a): tool name
   * - Name (e_n): status (success/error/disabled)
   * - Value (e_v): duration in ms
   *
   * Custom dimensions (if configured):
   * - Agent dimension: AI agent identifier
   * - Domain dimension: Tool domain
   */
  async trackToolInvocation(event: ToolInvocationEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const params = this.buildTrackingParams(event);
      const url = `${this.url}?${params.toString()}`;

      // Fire-and-forget: don't await the response to avoid blocking
      fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }).catch((error) => {
        logger.debug('Matomo tracking request failed (non-blocking)', {
          error: error instanceof Error ? error.message : String(error),
          toolName: event.toolName,
        });
      });

      logger.debug('Matomo event tracked', {
        toolName: event.toolName,
        status: event.status,
        durationMs: event.durationMs,
      });
    } catch (error) {
      // Never throw - analytics failures must not affect tool execution
      logger.debug('Matomo tracking error (non-blocking)', {
        error: error instanceof Error ? error.message : String(error),
        toolName: event.toolName,
      });
    }
  }

  /**
   * Build URL parameters for Matomo Tracking API
   */
  private buildTrackingParams(event: ToolInvocationEvent): URLSearchParams {
    const params = new URLSearchParams();

    // Required parameters
    params.set('idsite', this.siteId!);
    params.set('rec', '1');
    params.set('apiv', '1');

    // Event tracking parameters
    params.set('e_c', 'tool_invocation'); // Event category
    params.set('e_a', event.toolName); // Event action
    params.set('e_n', event.status); // Event name
    params.set('e_v', Math.round(event.durationMs).toString()); // Event value (numeric)

    // URL - use tool name as virtual page path
    params.set('url', `mcp://mittwald/tools/${event.toolDomain}/${event.toolName}`);
    params.set('action_name', `Tool: ${event.toolName}`);

    // User identification
    if (event.userId) {
      params.set('uid', event.userId);
    }

    // Visitor ID based on session (16 hex chars)
    const visitorId = this.generateVisitorId(event.sessionId);
    params.set('_id', visitorId);

    // Custom dimensions
    if (this.agentDimensionId && event.aiAgent) {
      params.set(`dimension${this.agentDimensionId}`, event.aiAgent);
    }

    if (this.domainDimensionId) {
      params.set(`dimension${this.domainDimensionId}`, event.toolDomain);
    }

    // Auth token (if configured) - enables additional tracking features
    if (this.authToken) {
      params.set('token_auth', this.authToken);
    }

    // Custom variables for additional context (legacy, but widely supported)
    // cvar is JSON-encoded: {"1":["name","value"],"2":["name","value"]}
    const customVars: Record<string, [string, string]> = {
      '1': ['tool_domain', event.toolDomain],
      '2': ['status', event.status],
    };

    params.set('cvar', JSON.stringify(customVars));

    return params;
  }

  /**
   * Generate a 16-character hex visitor ID from session ID
   */
  private generateVisitorId(sessionId: string): string {
    return createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
  }
}

// Export singleton instance
export const matomoTracker = new MatomoTracker();

/**
 * Convenience function to track a tool invocation
 */
export function trackToolInvocation(event: ToolInvocationEvent): void {
  matomoTracker.trackToolInvocation(event);
}
