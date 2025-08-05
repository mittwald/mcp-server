#!/usr/bin/env node

/**
 * Standalone OAuth Server for Mittwald MCP
 * 
 * This server handles OAuth authentication flows and session management
 * for the Mittwald MCP server. It can run independently for testing
 * or be integrated into the main MCP server.
 */

import { oauthServer } from './server/oauth-server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting Mittwald MCP OAuth Server...');
    
    const port = parseInt(process.env.PORT || '3000', 10);
    await oauthServer.start(port);
    
    logger.info(`OAuth server is running on http://localhost:${port}`);
    logger.info('Available endpoints:');
    logger.info('  - GET  /             - Authentication interface');
    logger.info('  - GET  /auth/login   - Start OAuth flow');
    logger.info('  - GET  /auth/status  - Check auth status');
    logger.info('  - POST /auth/logout  - Logout');
    logger.info('  - GET  /health       - Health check');
    
    // Log environment info
    logger.info('Environment configuration:', {
      nodeEnv: process.env.NODE_ENV,
      oauthIssuer: process.env.OAUTH_ISSUER,
      clientId: process.env.MITTWALD_OAUTH_CLIENT_ID,
      redirectUri: process.env.OAUTH_REDIRECT_URI,
      redisUrl: process.env.REDIS_URL
    });
    
  } catch (error) {
    logger.error('Failed to start OAuth server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await oauthServer.shutdown();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await oauthServer.shutdown();
});

main().catch((error) => {
  logger.error('Unexpected error in main', error);
  process.exit(1);
});