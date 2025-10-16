#!/usr/bin/env node
/**
 * @file Main entry point for the MCP server
 * @module index
 * 
 * @remarks
 * This is the executable entry point for the MCP server when run directly.
 * It loads environment variables and starts the HTTP server on the configured port.
 * 
 * The server can be started using:
 * - `npm start` - Production mode
 * - `npm run dev` - Development mode with auto-reload
 * - `node dist/index.js` - Direct execution
 * 
 * Required environment variables:
 * - JWT_SECRET: Secret for signing JWT tokens
 * 
 * @see {@link https://modelcontextprotocol.io} Model Context Protocol Documentation
 */

import dotenv from 'dotenv';
dotenv.config();

import { startServer, markServerShuttingDown } from './server.js';
import { CONFIG, validateConfig } from './server/config.js';
import { redisClient } from './utils/redis-client.js';
import { logger } from './utils/logger.js';
import { getMCPHandlerInstance } from './server/mcp.js';

// Validate configuration and warn about missing .env
try {
  validateConfig();
} catch (error) {
  console.warn('⚠️  Configuration Warning:', error instanceof Error ? error.message : String(error));
  console.warn('📝 Make sure you have a .env file with required environment variables:');
  console.warn('   - JWT_SECRET=your_jwt_secret');
  console.warn('📋 See .env.example for a template');
  console.warn('🚀 Server will start but API calls may fail without proper configuration\n');
}

// Start the server
const port = parseInt(CONFIG.PORT, 10);
(async () => {
  try {
    const server = await startServer(port);

    server.on('error', (error) => {
      logger.error('Failed to start server:', error);
      process.exit(1);
    });

    let gracefulShutdownInitiated = false;

    const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
      if (gracefulShutdownInitiated) {
        logger.warn(`Shutdown already in progress, ignoring ${signal}`);
        return;
      }

      gracefulShutdownInitiated = true;
      markServerShuttingDown();
      logger.info(`${signal} received, starting graceful shutdown...`);

      const forceExitTimer = setTimeout(() => {
        logger.warn('Graceful shutdown timeout reached, forcing exit');
        process.exit(0);
      }, 25000);
      forceExitTimer.unref();

      await new Promise<void>((resolve) => {
        server.close((error?: Error) => {
          if (error) {
            logger.error('Error closing HTTP server during shutdown', error);
          } else {
            logger.info('HTTP server closed');
          }
          resolve();
        });
      });

      try {
        const handler = getMCPHandlerInstance();
        handler?.shutdown();
      } catch (error) {
        logger.error('Error shutting down MCP handler', error);
      }

      try {
        await redisClient.disconnect();
      } catch (error) {
        logger.error('Error closing Redis connection during shutdown', error);
      }

      clearTimeout(forceExitTimer);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    };

    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.once(signal as NodeJS.Signals, () => {
        void gracefulShutdown(signal as NodeJS.Signals);
      });
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
