# LLM Context – Mittwald MCP Server (Updated 2025-10-01)

This document provides a comprehensive overview of the Mittwald MCP Server architecture, purpose, and current state for AI assistants working on this codebase.

---

## Project Overview

The **Mittwald MCP Server** is a Model Context Protocol (MCP) server that exposes Mittwald hosting infrastructure management capabilities to AI assistants (Claude, ChatGPT) and other MCP clients. It acts as a secure bridge between MCP clients and the Mittwald CLI (`mw`), enabling natural language control of hosting resources through OAuth 2.1 authenticated sessions.

### Key Capabilities
- Manage projects, apps, databases, containers, domains, mail, cronjobs, backups
- SSH/SFTP user management
- Per-user session isolation with Redis-backed state
- OAuth 2.1 + PKCE authentication via stateless proxy bridge
- 170+ MCP tools wrapping ~77% of Mittwald CLI commands
- Automatic token refresh and context propagation

---

## Architecture Components

### 1. OAuth Bridge (`packages/oauth-bridge/`)
**Purpose**: Stateless Koa-based OAuth 2.1 proxy fronting Mittwald's OAuth endpoints.

**Key Features**:
- Acts as a **public client** to Mittwald (no client secret required)
- Issues HS256 JWTs embedding Mittwald access/refresh tokens
- Dynamic client registration supporting public and confidential clients
- Redis-backed authorization state management
- PKCE (Proof Key for Code Exchange) enforcement

**OAuth Flow**:
1. Client discovers metadata via `.well-known/oauth-authorization-server`
2. Client calls `/authorize` → bridge validates PKCE, redirects to Mittwald
3. Mittwald authenticates user, redirects to `/mittwald/callback` with auth code
4. Client exchanges code at `/token` → receives JWT with embedded Mittwald tokens
5. Client uses JWT for authenticated MCP requests

**Critical Deployment Requirement**: Must run at `https://mittwald-oauth-server.fly.dev` (Mittwald's redirect whitelist).

**Key Files**:
- `packages/oauth-bridge/src/app.ts` – Koa app setup
- `packages/oauth-bridge/src/routes/authorize.ts` – Authorization endpoint
- `packages/oauth-bridge/src/routes/mittwald-callback.ts` – Mittwald callback handler
- `packages/oauth-bridge/src/routes/token.ts` – Token exchange + JWT signing
- `packages/oauth-bridge/src/routes/register.ts` – Dynamic client registration
- `packages/oauth-bridge/src/routes/metadata.ts` – OAuth discovery endpoints
- `packages/oauth-bridge/src/services/mittwald.ts` – Mittwald OAuth client
- `packages/oauth-bridge/src/state/` – State store implementations (Redis/memory)

---

### 2. MCP Server (`src/`)
**Purpose**: Express.js HTTP server implementing MCP protocol with session-aware CLI execution.

#### a. Session Management (`src/server/session-manager.ts`)
- **Redis-backed session store** with per-user isolation
- Stores: Mittwald access/refresh tokens, OAuth tokens, scopes, context (project/server/org IDs)
- **Automatic token refresh**: 1 minute before expiry using Mittwald refresh endpoint
- **8-hour session TTL** with automatic cleanup (5-min interval)
- Session keys: `session:<id>`, `user_sessions:<userId>`
- Token refresh on access if within skew window
- Session destroyed if refresh fails (forces re-authentication)

#### b. MCP Handler (`src/server/mcp.ts`)
- Creates **one `Server` instance per session** (proper MCP SDK usage)
- Per-session `StreamableHTTPServerTransport` for protocol compliance
- Session initialization extracts Mittwald tokens from JWT claims (`req.auth.extra`)
- Persists session auth via `sessionManager.upsertSession()`
- Hydrates session context from Redis on every subsequent request
- Updates in-memory auth if client sends refreshed tokens
- Recreates server instance when tokens change
- Implements MCP request handlers: `ListTools`, `CallTool`, `ListPrompts`, `GetPrompt`, `ListResources`, `ReadResource`, `CreateMessage`

#### c. OAuth Middleware (`src/server/oauth-middleware.ts`)
- Verifies bridge JWT signatures using `jose` library
- Shared secret: `OAUTH_BRIDGE_JWT_SECRET` (must match bridge)
- Extracts Mittwald tokens from JWT payload:
  - `mittwaldAccessToken` (required)
  - `mittwaldRefreshToken` (optional)
  - `mittwaldScope` (optional)
  - `mittwaldAccessTokenExpiresAt` (optional)
  - `resource` (optional)
- Populates `req.auth.extra` for downstream handlers
- Returns 401 with `WWW-Authenticate` challenge on failure

#### d. Tool Execution Pipeline
```
MCP Request
  ↓
OAuth Middleware (JWT verification)
  ↓
Session Hydration (Redis lookup)
  ↓
Tool Handler (src/handlers/tool-handlers.ts)
  ↓
CLI Adapter (src/tools/cli-adapter.ts)
  ↓
Session-Aware CLI (src/utils/session-aware-cli.ts)
  ↓
executeCli → `mw` binary with --token injection
  ↓
Result Parsing → MCP Response
```

**Tool Discovery**:
- Dynamic loading via `src/utils/tool-scanner.ts`
- Scans `src/constants/tool/mittwald-cli/**/*-cli.ts` files
- Lazy handler imports at runtime (performance optimization)
- Cached registries: tools, handlers, schemas
- Optional filtering by category and count (`TOOL_FILTER_ENABLED`, `MAX_TOOLS_PER_RESPONSE`)

**Session-Aware CLI Execution**:
- Every `mw` command receives:
  - User's Mittwald access token via `--token`
  - Current context injected (`--project-id`, `--server-id`, `--org-id`)
  - Non-interactive flags (`MITTWALD_NONINTERACTIVE=1`, `CI=1`)
- Uses `AsyncLocalStorage` for context propagation
- Structured error handling: `CliToolError` with kinds (AUTHENTICATION, TIMEOUT, EXECUTION, PARSING)

**Key Files**:
- `src/index.ts` – Server entry point
- `src/server.ts` – Express app configuration, middleware setup, route registration
- `src/server/mcp.ts` – Per-session MCP handler (Server instances, transport, request routing)
- `src/server/session-manager.ts` – Redis session CRUD, token refresh orchestration
- `src/server/oauth-middleware.ts` – JWT verification, token extraction
- `src/server/config.ts` – Configuration management
- `src/handlers/tool-handlers.ts` – Tool call routing and validation
- `src/handlers/prompt-handlers.ts` – Prompt handlers
- `src/handlers/resource-handlers.ts` – Resource handlers
- `src/handlers/sampling.ts` – Sampling request delegation
- `src/tools/cli-adapter.ts` – Unified CLI invocation wrapper
- `src/tools/error.ts` – Structured CLI error types
- `src/utils/session-aware-cli.ts` – Token injection + context propagation
- `src/utils/cli-wrapper.ts` – Low-level CLI execution
- `src/utils/tool-scanner.ts` – Dynamic tool registry builder
- `src/utils/execution-context.ts` – AsyncLocalStorage context tracking
- `src/utils/redis-client.ts` – Redis client wrapper
- `src/utils/logger.ts` – Logging utilities
- `src/constants/tools.ts` – Tool registry initialization
- `src/constants/tool/mittwald-cli/**/*-cli.ts` – CLI tool definitions (170+ tools)

---

### 3. CLI Integration Strategy

**Docker Setup**:
- Base: `node:20-alpine`
- Mittwald CLI: `@mittwald/cli@1.11.2` installed globally
- SSH client for SFTP operations
- Build: TypeScript compilation + tsc-alias for path resolution

**Tool Architecture**:
- Each tool defined in `src/constants/tool/mittwald-cli/<topic>/<command>-cli.ts`
- Exports `ToolRegistration` with:
  - `tool`: MCP tool metadata (name, description, inputSchema)
  - `handler`: Async function receiving arguments, returning `CallToolResult`
  - `schema`: JSON schema for validation (optional)
- Handlers delegate to `invokeCliTool()` with command args and custom parser
- Parsers transform CLI stdout into typed results
- Standardized error responses for CLI failures

**Current Coverage** (as of 2025-10-01):
- **137 of 178 CLI commands wrapped** (77%)
- Strong coverage: projects, apps, cronjobs, backups, domains, mail, servers, SSH/SFTP
- **Missing 41 commands**:
  - Container: `cp`, `exec`, `port-forward`, `ssh`, `update`
  - Database: MySQL user management, all Redis commands
  - Org: CRUD operations, membership management
  - Registry/Stack/Volume: CLI renamed topics, wrappers need alignment
  - DDEV: tools defined but not registered
  - Login: intentionally disabled (token injection model)

---

## Key Design Principles

### Security
- **No credential storage**: MCP server never stores Mittwald passwords
- **Per-user isolation**: Redis sessions prevent cross-user contamination
- **HTTPS mandatory**: OAuth flows require TLS in production (Fly.io terminates)
- **Scope enforcement**: Mittwald is authoritative for scopes and consent
- **Token rotation**: Automatic refresh with secure storage

### Stateless OAuth Bridge
- Bridge stores only ephemeral authorization state (Redis with TTL)
- No persistent user accounts
- Mittwald controls user identity, permissions, and consent UI
- Bridge acts as transparent proxy for OAuth flows

### Operational Robustness
- Connection logging at transport level (TCP sockets)
- Comprehensive error mapping (CLI exit codes → MCP errors)
- Health endpoints (`/health`, `/version`) for monitoring
- Structured logging with Pino
- Session cleanup (expired sessions removed every 5 minutes)
- Graceful shutdown handling (SIGTERM/SIGINT)

---

## Authentication Flow (End-to-End)

### Initial Authentication
1. MCP client requests `/mcp` without auth → **401** with `WWW-Authenticate` challenge
2. Client discovers OAuth endpoints from `WWW-Authenticate` header
3. Client optionally registers at bridge `/register` (gets client credentials if confidential)
4. User authorizes via bridge `/authorize` → Mittwald login UI → approval
5. Mittwald redirects to bridge `/mittwald/callback` with authorization code
6. Client exchanges code at bridge `/token` → receives JWT
7. JWT payload includes: `mittwaldAccessToken`, `mittwaldRefreshToken`, `scope`, `expiresAt`

### Subsequent MCP Requests
1. Client sends JWT in `Authorization: Bearer` header
2. MCP server verifies JWT signature (shared `OAUTH_BRIDGE_JWT_SECRET`)
3. Extracts Mittwald tokens from `req.auth.extra`
4. On first request: creates session, stores tokens in Redis
5. On subsequent requests: looks up session by `mcp-session-id` header
6. Hydrates session auth from Redis, checks token expiry
7. CLI commands use tokens from session store via `sessionAwareCli`

### Token Refresh Flow
1. `sessionManager.getSession()` checks `mittwaldAccessTokenExpiresAt`
2. If within 1-minute skew window: calls `refreshMittwaldAccessToken()`
3. Exchanges refresh token with Mittwald OAuth endpoint
4. Updates Redis session with new access/refresh tokens
5. Returns updated session to caller
6. If refresh fails: destroys session, returns `null` (forces re-auth)

---

## Configuration

### Environment Variables

**OAuth Bridge** (`packages/oauth-bridge/`):
- `PORT` – Bridge HTTP port (default 3000)
- `BRIDGE_ISSUER`, `BRIDGE_BASE_URL`, `BRIDGE_JWT_SECRET` – JWT metadata and signing key
- `BRIDGE_REDIRECT_URIS` – Comma-separated client redirect URIs
- `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID` – Mittwald OAuth endpoints
- `REDIS_URL` – Redis connection string
- Optional: `BRIDGE_ACCESS_TOKEN_TTL_SECONDS`, `BRIDGE_REFRESH_TOKEN_TTL_SECONDS`

**MCP Server** (`src/`):
- `PORT` – Server HTTP port (default 3000)
- `OAUTH_BRIDGE_JWT_SECRET` – Must match bridge signing secret
- `OAUTH_BRIDGE_ISSUER`, `OAUTH_BRIDGE_BASE_URL` – Bridge OAuth endpoints
- `REDIS_URL` – Redis connection string (shared with bridge)
- `OAUTH_AS_BASE`, `MCP_PUBLIC_BASE` – Used for `WWW-Authenticate` metadata
- Optional: `TOOL_FILTER_ENABLED`, `MAX_TOOLS_PER_RESPONSE`, `ALLOWED_TOOL_CATEGORIES`
- Optional: `ENABLE_HTTPS`, `SSL_KEY_PATH`, `SSL_CERT_PATH` (local dev only; Fly.io handles TLS)

---

## Testing Strategy

### Test Suites
- **Unit tests** (`tests/unit/`): Session manager, OAuth middleware, CLI adapter, tool handlers
- **Integration tests** (`tests/integration/`): Redis-backed session flows, OAuth token exchange
- **Smoke tests** (`tests/smoke/`): Post-deployment health checks
- **E2E tests** (`tests/e2e/`): Full OAuth + MCP tool cycle (Claude Desktop, ChatGPT flows)

### Running Tests
```bash
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:oauth          # OAuth-specific tests
npm run test:e2e:mcp        # End-to-end MCP OAuth flow
npm run test:coverage       # Coverage report
```

---

## Active Development Workstreams

### Current State (2025-10-01)
The project has recently completed a major CLI refactor, migrating from direct API calls to CLI-based tool execution. Documentation exists for closing the CLI coverage gap.

### Workstream A – Coverage Tooling & Automation
- Stabilize `mw-cli-coverage.json` as canonical coverage artifact
- Integrate coverage report generation into CI
- Automated CLI release detector (fail build on version mismatch)
- Enforce allowlist for intentional exclusions (interactive commands)

**Reference**: `docs/mcp-cli-gap-architecture.md`, `docs/mcp-cli-gap-project-plan.md`

### Workstream B – Taxonomy Alignment & Registry Refactor
- Rename registry wrappers (`container/registry-*` → `registry/*`)
- Rename stack wrappers (`container/stack-*` → `stack/*`)
- Update tool names (`mittwald_registry_*`, `mittwald_stack_*`)
- Adjust tool scanner default base path

### Workstream C – Missing Wrapper Implementation
Sub-workstreams by domain:
- **C1**: App dependency metadata (`app dependency list/update/versions`)
- **C2**: Container lifecycle (`container update`, evaluate `cp`)
- **C3**: Database extensions (MySQL users, Redis databases)
- **C4**: Organisation management (`org list/get/delete`, membership)
- **C5**: Volume management (`volume create/delete/list`)
- **C6**: DDEV tooling (convert definitions to `ToolRegistration`)

### Workstream D – Interactive Command Strategy
- Feasibility assessment for streaming/TTY support
- Security review for SSH/port-forward operations
- Implementation or explicit exclusion with documentation

**Key Decisions Needed**:
- Streaming transport support in MCP SDK?
- Policy for exposing shell operations?
- Explicit exclusion list in config?

### Workstream E – QA, Testing, and Documentation
- Expand tests for new handlers
- End-to-end smoke tests (nightly CI)
- Update `docs/mittwald-cli-coverage.md` after each workstream
- Produce release changelog

**References**:
- `docs/2025-09-29-cli-refactor-architecture.md` – CLI adapter architecture
- `docs/2025-09-29-mcp-cli-hardening-plan.md` – Hardening plan
- `docs/2025-10-01-cli-migration-postmortem.md` – Migration postmortem

---

## Document Index

### Core Architecture
- `ARCHITECTURE.md` – OAuth bridge, Redis state, MCP tool execution (canonical)
- `README.md` – Dev setup, run commands, operational tips
- `docs/mcp-cli-gap-architecture.md` – Current CLI coverage gaps and target state
- `docs/mcp-cli-gap-project-plan.md` – Structured workstream plan for closing gaps

### Implementation Touchpoints
- **Bridge**: `packages/oauth-bridge/src/app.ts`, `routes/*`, `services/mittwald.ts`
- **MCP Server**: `src/server/oauth-middleware.ts`, `src/server/session-manager.ts`, `src/server/mcp.ts`
- **Session Auth**: `src/middleware/session-auth.ts`
- **Tool Execution**: `src/utils/session-aware-cli.ts`, `src/tools/cli-adapter.ts`
- **Shared Config**: `config/mittwald-scopes.json`

### Recent Work (2025-09-29 to 2025-10-01)
- `docs/2025-09-29-cli-refactor-architecture.md` – CLI adapter design
- `docs/2025-09-29-mcp-cli-hardening-plan.md` – Hardening strategy
- `docs/2025-10-01-cli-migration-postmortem.md` – Migration learnings
- `docs/2025-10-01-agent-5-review-and-guidance.md` – Agent review
- `docs/2025-10-01-agent-8-task-assignment.md` – Task assignments

### Historical Context
- `docs/2025-09-27-openai-connector-oauth-guidance.md` – Connector-specific requirements
- `docs/2025-09-27-mcp-tool-scope-filtering.md` – Tool filtering plan
- `docs/oauth-testing-tools.md` – oauth2c workflow, automation tooling
- `docs/claude-desktop-notes.md` – Claude Desktop integration notes
- `docs/archive/` – Legacy analyses (oidc-provider, MCP JAM Inspector deep-dives)

### Testing & Operations
- `tests/README.md` – Test matrix and environment setup (if exists)
- `docs/oauth-testing-tools.md` – OAuth testing workflows
- `docs/INDEX.md` – Living index of active documents

---

## Technology Stack

**MCP Server**:
- TypeScript (ES2022 modules, strict mode)
- Express.js 5.1.0 (HTTP server)
- `@modelcontextprotocol/sdk` v1.13.0 (MCP protocol)
- Redis: ioredis v5.7.0 (session store)
- Zod v3.25.67 (schema validation)
- Pino v9.11.0 (structured logging)
- Vitest v3.2.4 (testing)
- Node.js ≥18.0.0

**OAuth Bridge**:
- Koa v3.0.1 + @koa/router v14.0.0
- `jose` v6.0.11 (JWT handling)
- `openid-client` v6.6.2 (OAuth client)
- ioredis v5.7.0 (state storage)
- Pino v9.11.0 (logging)

**CLI Integration**:
- `@mittwald/cli@1.11.2` (installed globally in Docker)
- Child process execution (`child_process.spawn`)
- JSON output parsing

**Build Tools**:
- TypeScript v5.8.3
- tsc-alias v1.8.16 (path resolution)
- ESLint + Prettier (linting/formatting)

---

## Quick Reference: Common Commands

```bash
# Development
npm run build           # Compile TypeScript
npm run watch           # Watch mode
npm run type-check      # Type checking without emit
npm run lint            # ESLint

# Testing
npm test                # Run all tests
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:oauth      # OAuth tests
npm run test:e2e:mcp    # End-to-end MCP OAuth
npm run test:coverage   # Coverage report

# Docker
docker compose build --no-cache
docker compose up -d

# Utilities
npm run inspector       # Launch MCP Inspector
npm run logs:registration # Tail registration logs
```

---

## Critical Notes for AI Assistants

1. **Do not modify authentication flows** without understanding the full OAuth chain (bridge → MCP → CLI)
2. **Session manager token refresh** is automatic; don't bypass `getSession()`
3. **Tool handlers must use `invokeCliTool()`** to ensure session context injection
4. **Docker images must stay synced** with CLI version (currently 1.11.2)
5. **Redis is shared state** between bridge (authorization) and MCP server (sessions)
6. **JWT secret must match** between bridge and MCP server (`OAUTH_BRIDGE_JWT_SECRET`)
7. **Bridge must run at** `https://mittwald-oauth-server.fly.dev` (Mittwald whitelist)
8. **Per-session Server instances** are required by MCP SDK design; do not create singletons
9. **AsyncLocalStorage context** must be maintained across async boundaries for CLI execution
10. **Coverage gaps are tracked** in `docs/mittwald-cli-coverage.md` and `mw-cli-coverage.json`

---

## Archive Notice

Legacy analyses (oidc-provider cookie loops, MCP JAM Inspector deep-dives, pre-bridge OAuth designs) live in `docs/archive/`. They are useful for historical debugging but **do not describe the current production stack**.

---

**Last Updated**: 2025-10-01
**CLI Version**: 1.11.2
**MCP SDK Version**: 1.13.0
**Architecture Phase**: OAuth Bridge (post-oidc-provider migration)
