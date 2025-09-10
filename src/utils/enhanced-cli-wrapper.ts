import { executeCli, type CliExecuteOptions, type CliExecuteResult } from './cli-wrapper.js';
import { sessionAwareCli } from './session-aware-cli.js';
import { logger } from './logger.js';

/**
 * Enhanced CLI wrapper that can execute commands with or without session context
 * This provides backward compatibility while enabling session-aware execution
 */
export class EnhancedCliWrapper {
  
  /**
   * Execute CLI command with optional session awareness
   * @param command - CLI command (e.g., 'mw')
   * @param args - CLI arguments
   * @param options - Execution options
   * @param sessionId - Optional session ID for session-aware execution
   */
  async execute(
    command: string,
    args: string[],
    options: CliExecuteOptions = {},
    sessionId?: string
  ): Promise<CliExecuteResult> {
    try {
      if (sessionId) {
        // Use session-aware execution
        logger.debug(`Executing CLI command with session context: ${sessionId}`);
        return await sessionAwareCli.executeWithSession(command, args, sessionId, options);
      } else {
        // Standard execution requires explicit token option; no env fallback
        logger.debug('Executing CLI command without session context');
        return await executeCli(command, args, {
          ...options,
        });
      }
    } catch (error) {
      logger.error('Enhanced CLI wrapper execution failed:', error);
      throw error;
    }
  }

  /**
   * Check if a session exists and is valid
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      return await sessionAwareCli.validateResourceAccess(sessionId, 'project', 'test');
    } catch {
      return false;
    }
  }
}

export const enhancedCliWrapper = new EnhancedCliWrapper();
