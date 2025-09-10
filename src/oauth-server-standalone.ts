#!/usr/bin/env node

/**
 * Standalone OAuth Server for Mittwald MCP
 * 
 * This server handles OAuth authentication flows and session management
 * for the Mittwald MCP server. It can run independently for testing
 * or be integrated into the main MCP server.
 */

// Internal OAuth server is removed; this stub remains for development scripts.
// Exiting with code 0 to indicate no-op.
console.log('OAuth server standalone is disabled; use external oauth-server service.');
process.exit(0);
import { logger } from './utils/logger.js';

// No-op implementation
logger.info('OAuth server standalone disabled; use external oauth-server service.');
