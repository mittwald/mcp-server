# Mittwald MCP Server Source Code

This directory contains the source code for the Mittwald Model Context Protocol (MCP) server. The server enables AI assistants to interact with the Mittwald platform through a standardized protocol.

## Directory Structure

### Entry Points

- **`index.ts`** - Main executable entry point for running the server directly
- **`server.ts`** - HTTP server implementation that handles OAuth metadata and hosts MCP endpoints
- **`smithery-entry.ts`** - Entry point for Smithery platform deployment

### Core Directories

#### `/config`
Configuration management for the MCP server including capabilities and server metadata.

#### `/constants`
Static definitions for tools, sampling operations, and their schemas. This is where all tool definitions and prompts are centralized.

#### `/handlers`
Request handlers that implement the business logic for:
- Tool execution (search, read, create content)
- Sampling operations (AI-assisted content generation)
- Notifications and progress tracking
- Resource management

#### `/server`
HTTP server infrastructure including:
- OAuth2 authentication flow
- MCP protocol endpoints
- Session management
- Middleware for security and validation

#### `/services`
External service integrations:
- Mittwald CLI/API integration

#### `/types`
TypeScript type definitions for:
- Mittwald data structures
- MCP protocol extensions
- Internal application types

#### `/utils`
Utility functions for:
- Data transformation
- Validation
- Logging
- Error handling

## Architecture Overview

The server follows a layered architecture:

1. **Entry Layer** - Multiple entry points for different deployment scenarios
2. **Server Layer** - HTTP server with OAuth and MCP protocol support
3. **Handler Layer** - Business logic for processing MCP requests
4. **Service Layer** - External API integrations
5. **Utility Layer** - Cross-cutting concerns

## Key Concepts

### Authentication Flow
1. User initiates OAuth flow through `/oauth/authorize`
2. Reddit redirects back with authorization code
3. Server exchanges code for access token
4. Token is stored per session for subsequent API calls

### MCP Protocol Implementation
- Tools allow AI to search, read, and create Reddit content
- Sampling enables AI-assisted content generation
- Notifications provide real-time feedback
- Sessions maintain authentication context

### Multi-Session Support
The server supports multiple concurrent users, each with their own:
- Authentication credentials
- MCP server instance
- Session state

## Development

To understand how the server works:

1. Start with `index.ts` to see the main entry point
2. Follow the flow through `reddit-mcp-server.ts` for HTTP setup
3. Look at `/server/routes.ts` for request routing
4. Examine `/handlers` for business logic
5. Check `/services` for Reddit API integration

Each subdirectory contains its own README with more detailed information about its specific functionality.
