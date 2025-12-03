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

## OAuth Bridge DCR Architecture - CRITICAL

**Mittwald's OAuth redirect list is STRICTLY IMMUTABLE.** This drives the entire OAuth bridge design.

### Why DCR (Dynamic Client Registration) is Required
- Mittwald pre-registers allowed redirect URIs - we CANNOT add arbitrary ones
- The bridge has ONE fixed redirect_uri with Mittwald: `{BRIDGE_BASE_URL}/mittwald/callback`
- Clients (Claude.ai, ChatGPT, etc.) register their redirect_uri via DCR with our bridge
- The bridge proxies the OAuth flow, using its own redirect_uri with Mittwald

### Flow
1. Client calls `POST /register` with their `redirect_uri` (DCR)
2. Client calls `/authorize` - bridge validates against DCR-registered URIs
3. Bridge redirects to Mittwald using the bridge's fixed redirect_uri
4. Mittwald authenticates and redirects back to bridge
5. Bridge redirects to the client's DCR-registered redirect_uri

### Error: "redirect_uri is not registered"
This means the client did NOT use DCR first. They must call `POST /register` before `/authorize`.

**DO NOT:**
- Try to add client redirect URIs to a static config list
- Bypass DCR validation in the authorize route
- Assume redirect_uri validation happens elsewhere

**Location:** `packages/oauth-bridge/src/routes/authorize.ts` - DCR lookup via `stateStore.getClientRegistration()`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
