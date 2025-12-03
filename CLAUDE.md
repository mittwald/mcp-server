# mittwald-mcp Development Guidelines

## Fly.io Infrastructure

There are 2 Fly.io apps for the Mittwald ecosystem:
- `mittwald-oauth-server` - OAuth 2.1 server with DCR support (https://mittwald-oauth-server.fly.dev)
- `mittwald-mcp-fly2` - MCP server for Claude Code integration

### Add MCP Server to Claude Code
```bash
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
```

## Project Structure
```
src/
tests/
```

## Commands
```bash
npm run build    # Build the project
npm run test     # Run tests
```

## Code Style
Follow standard TypeScript conventions.

## Mittwald OAuth Scopes - CRITICAL

**Mittwald's OAuth server requires the scope format: `'openid profile email mittwald:api'`**

- `mittwald:api` is a **passthrough scope** that covers ALL Mittwald API access
- Individual granular scopes like `user:read`, `app:read`, `project:read` are **NOT accepted** by Mittwald's OAuth server
- Sending individual scopes results in: `invalid_scope: No existing and allowed scopes were provided`

**The oauth-bridge flow:**
1. Clients request individual scopes (e.g., `user:read customer:read`)
2. Bridge validates these against `config/mittwald-scopes.json` (for our own authorization)
3. When redirecting to Mittwald: **ALWAYS send `'openid profile email mittwald:api'`**
4. The `mittwald:api` scope grants access to all APIs; Mittwald manages permissions internally

**DO NOT:**
- Send individual scopes like `user:read`, `app:read` to Mittwald
- Try to filter/map granular scopes to Mittwald - it doesn't work
- Assume Mittwald accepts the same scope format as our internal validation

**Location:** `packages/oauth-bridge/src/routes/authorize.ts` - the `mittwaldScopeString` variable

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
