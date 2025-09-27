# LLM Context Reading List - Mittwald MCP Server

This is a prioritized reading list for LLMs working on this codebase. Read these files in order to build comprehensive context about the project architecture, OAuth implementation, and debugging approaches.

## 1. Foundation & Architecture (Essential - Read First)

### Project Overview
- `/Users/robert/Code/mittwald-mcp/ARCHITECTURE.md` - **CRITICAL**: OAuth 2.1 proxy architecture, trust model, component relationships, stateful services, OAuth flow
- `/Users/robert/Code/mittwald-mcp/package.json` - Project dependencies, scripts, and basic metadata

### Configuration Files
- `/Users/robert/Code/mittwald-mcp/config/mittwald-scopes.json` - **CRITICAL**: Centralized scope configuration (43 scopes), source of truth for OAuth scope validation
- `/Users/robert/Code/mittwald-mcp/docker-compose.yml` - Local development setup
- `/Users/robert/Code/mittwald-mcp/docker-compose.prod.yml` - Production deployment configuration

## 2. OAuth Server Implementation (Core Functionality)

### Primary OAuth Components
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/handlers/interactions.ts` - **CRITICAL**: OAuth interaction handler, consent flows, scope validation, recent fixes for redirect loops
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/config/provider.ts` - **CRITICAL**: oidc-provider configuration, findAccount, loadExistingGrant, resource indicators
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/services/mittwald-metadata.ts` - OIDC discovery, scope resolution, metadata caching

### Supporting Services
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/services/mittwald-oauth-client.ts` - Mittwald OAuth client wrapper
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/services/user-account-store.ts` - User account persistence
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/config/mittwald-scopes.ts` - Scope validation and filtering logic
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/config/adapters.ts` - Storage adapter configuration (SQLite/memory)

### Infrastructure
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/server.ts` - OAuth server entry point
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/services/logger.ts` - Logging configuration

## 3. MCP Server Implementation

### Main Server Files
- `/Users/robert/Code/mittwald-mcp/src/server/mcp.ts` - MCP server implementation
- `/Users/robert/Code/mittwald-mcp/src/server/oauth.ts` - OAuth integration for MCP
- `/Users/robert/Code/mittwald-mcp/src/server/config.ts` - MCP server configuration

### Authentication & Authorization
- `/Users/robert/Code/mittwald-mcp/src/middleware/session-auth.ts` - Session-based authentication middleware
- `/Users/robert/Code/mittwald-mcp/src/auth/oauth-state-manager.ts` - OAuth state management
- `/Users/robert/Code/mittwald-mcp/src/server/session-manager.ts` - Session lifecycle management
- `/Users/robert/Code/mittwald-mcp/src/server/auth-store.ts` - Authentication storage layer

## 4. Known Issues & Debugging Context

### Recent Problem Areas
- `/Users/robert/Code/mittwald-mcp/MCP-JAM-Inspector-OAuth-Analysis.md` - **IMPORTANT**: Comprehensive analysis of OAuth flow issues, redirect loops, scope validation failures
- `/Users/robert/Code/mittwald-mcp/src/documentation/mcpjam-inspector-oauth21-dcr-report.md` - Inspector integration testing results
- `/Users/robert/Code/mittwald-mcp/src/documentation/testing-oauth-and-mcp.md` - Testing approaches and methodologies

### Problem Patterns
1. **Infinite redirect loops** with `prompt=consent` - Fixed in interactions.ts:203-223
2. **Scope validation failures** - Custom middleware vs oidc-provider scope checking
3. **Different client behaviors** - Inspector debug vs production, Claude vs ChatGPT flows
4. **Session vs interaction state** - Complex state management between OAuth flows

## 5. Type Definitions & Contracts

### Core Types
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/types/provider.ts` - OAuth provider types
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/src/types/mittwald.ts` - Mittwald API types
- `/Users/robert/Code/mittwald-mcp/src/types/` - MCP-specific type definitions

## 6. Configuration & Environment

### Deployment Files
- `/Users/robert/Code/mittwald-mcp/Dockerfile` - Main container build
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/Dockerfile` - OAuth server container
- `/Users/robert/Code/mittwald-mcp/packages/mcp-server/Dockerfile` - MCP server container

### Monorepo Structure
- `/Users/robert/Code/mittwald-mcp/packages/oauth-server/package.json` - OAuth server dependencies
- `/Users/robert/Code/mittwald-mcp/packages/mcp-server/package.json` - MCP server dependencies

## 7. Testing & Quality Assurance

### Test Suites
- `/Users/robert/Code/mittwald-mcp/tests/postman/` - Postman collections for API testing
- `/Users/robert/Code/mittwald-mcp/tests/` - Test suite directory structure

### Legal & Compliance
- `/Users/robert/Code/mittwald-mcp/legal/` - License compliance and dependency auditing

## Key Reading Order for Debugging OAuth Issues

1. **Start Here**: `ARCHITECTURE.md` + `config/mittwald-scopes.json`
2. **OAuth Flow Issues**: `handlers/interactions.ts` + `config/provider.ts`
3. **Scope Problems**: `services/mittwald-metadata.ts` + `config/mittwald-scopes.ts`
4. **Recent Fixes**: `MCP-JAM-Inspector-OAuth-Analysis.md`
5. **Client Differences**: Test with multiple clients and compare logs

## Important Context Notes

- **No fallback mechanisms** - Code fails intentionally rather than silently
- **Centralized scope management** - All scope validation uses the JSON configuration
- **OAuth 2.1 proxy architecture** - Not a direct Mittwald integration
- **oidc-provider v9** - Recent upgrade with breaking changes
- **Stateful services** - Redis for MCP sessions, SQLite for OAuth persistence
- **Multiple client support** - Inspector, Claude, ChatGPT have different flow patterns