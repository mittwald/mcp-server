#!/usr/bin/env node
/**
 * @file STDIO MCP Server for Mittwald API
 * @module stdio-server
 * 
 * @remarks
 * This module provides the STDIO entry point for the Mittwald MCP server
 * for use with Claude Desktop and other STDIO-based MCP clients.
 * 
 * Unlike the HTTP server, this communicates via standard input/output
 * using pure JSON-RPC messages without HTTP headers.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CreateMessageRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { serverConfig, serverCapabilities } from "./constants/server/server-config.js";
import { sendSamplingRequest } from "./handlers/sampling.js";
import { handleListTools, handleToolCall } from "./handlers/tool-handlers.js";
import { handleListPrompts, handleGetPrompt } from "./handlers/prompt-handlers.js";
import { handleListResources, handleResourceCall } from "./handlers/resource-handlers.js";
import { logger } from "./utils/logger.js";

/**
 * Main STDIO server setup
 */
async function main() {
  // Create server instance
  const server = new Server(serverConfig, serverCapabilities);
  
  // Setup tool handlers
  server.setRequestHandler(ListToolsRequestSchema, (request) => {
    logger.debug('📋 Listing tools via STDIO');
    return handleListTools(request);
  });

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    logger.debug(`🔧 Calling tool via STDIO: ${request.params.name}`);
    
    // For STDIO, create a mock MCPToolContext with Mittwald API token
    const context = {
      sessionId: 'stdio-session',
      authInfo: {
        clientId: 'stdio-client',
        token: 'stdio-token',
        scopes: [],
        mittwald: {
          apiToken: process.env.MITTWALD_API_TOKEN || ''
        },
        extra: {
          mittwaldApiToken: process.env.MITTWALD_API_TOKEN || ''
        }
      }
    };

    return handleToolCall(request, context);
  });

  // Setup prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, (request) => {
    logger.debug('📝 Listing prompts via STDIO');
    return handleListPrompts();
  });

  server.setRequestHandler(GetPromptRequestSchema, (request) => {
    logger.debug(`📄 Getting prompt via STDIO: ${request.params.name}`);
    return handleGetPrompt(request);
  });

  // Setup resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, (request) => {
    logger.debug('📁 Listing resources via STDIO');
    return handleListResources();
  });

  server.setRequestHandler(ReadResourceRequestSchema, (request) => {
    logger.debug(`📖 Reading resource via STDIO: ${request.params.uri}`);
    return handleResourceCall(request, { authInfo: { clientId: 'stdio-client', token: 'stdio-token', scopes: [] } });
  });

  // Setup sampling handler
  server.setRequestHandler(CreateMessageRequestSchema, (request) => {
    logger.debug('🎯 Handling sampling request via STDIO');
    const samplingContext = {
      sessionId: 'stdio-session',
      authInfo: { clientId: 'stdio-client', token: 'stdio-token', scopes: [] }
    };
    return sendSamplingRequest(request, samplingContext);
  });

  // Create STDIO transport
  const transport = new StdioServerTransport();
  
  // Start the server
  await server.connect(transport);
  
  logger.info('🚀 Mittwald MCP STDIO server started');
  logger.info('📡 Ready for Claude Desktop connection');
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('🛑 STDIO server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 STDIO server shutting down...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('❌ Failed to start STDIO server:', error);
  process.exit(1);
});