#!/usr/bin/env node
/**
 * @file Main entry point for the Reddit MCP server
 * @module index
 * 
 * @remarks
 * This is the executable entry point for the Reddit MCP server when run directly.
 * It loads environment variables and starts the HTTP server on the configured port.
 * 
 * The server can be started using:
 * - `npm start` - Production mode
 * - `npm run dev` - Development mode with auto-reload
 * - `node dist/index.js` - Direct execution
 * 
 * Required environment variables:
 * - REDDIT_CLIENT_ID: OAuth2 client ID from Reddit app
 * - REDDIT_CLIENT_SECRET: OAuth2 client secret
 * - JWT_SECRET: Secret for signing JWT tokens
 * 
 * @see {@link https://modelcontextprotocol.io} Model Context Protocol Documentation
 */

import dotenv from 'dotenv';
dotenv.config();

import { startServer } from './server.js';
import { CONFIG, validateConfig } from './server/config.js';

// Validate configuration and warn about missing .env
try {
  validateConfig();
} catch (error) {
  console.warn('⚠️  Configuration Warning:', error instanceof Error ? error.message : String(error));
  console.warn('📝 Make sure you have a .env file with required environment variables:');
  console.warn('   - MITTWALD_API_TOKEN=your_mittwald_api_token');
  if (!CONFIG.DISABLE_OAUTH) {
    console.warn('   - JWT_SECRET=your_jwt_secret');
  }
  console.warn('📋 See .env.example for a template');
  console.warn('🚀 Server will start but API calls may fail without proper configuration\n');
}

// Start the server
const port = parseInt(CONFIG.PORT, 10);
(async () => {
  try {
    const server = await startServer(port);
    server.on('error', (error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
