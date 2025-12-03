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

**Mittwald accepts scopes in `resource:action` format ONLY:**
- `app:read`, `app:write`, `app:delete`
- `user:read`, `user:write`
- `project:read`, `project:write`, `project:delete`
- etc. (see https://api.mittwald.de/v2/scopes for full list)

**What Mittwald does NOT accept:**
- `mittwald:api` - There is NO passthrough scope!
- `openid`, `profile`, `email` - OIDC scopes are NOT supported
- Any scope not in the /v2/scopes list

**The oauth-bridge flow:**
1. Clients request scopes (e.g., `user:read customer:read app:read`)
2. Bridge validates these against `config/mittwald-scopes.json`
3. When redirecting to Mittwald: Send actual scopes from the `upstreamScopes` list
4. Default scopes: `user:read customer:read project:read app:read`

**Location:** `packages/oauth-bridge/src/config/mittwald-scopes.ts` - `MITTWALD_SCOPE_STRING`

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

## Operations Checklist

### JWT Secret Synchronization - CRITICAL
The OAuth bridge and MCP server must share the same JWT signing secret:
- **OAuth Server**: `BRIDGE_JWT_SECRET`
- **MCP Server**: `OAUTH_BRIDGE_JWT_SECRET`

These MUST be identical! If they differ, JWT signature verification fails and the MCP server falls back to Mittwald CLI validation, which causes OOM errors.

**To verify:**
```bash
flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET"
flyctl ssh console -a mittwald-mcp-fly2 -C "printenv OAUTH_BRIDGE_JWT_SECRET"
```

**To sync (if different):**
```bash
# Get the OAuth server's secret
SECRET=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)
# Set it on the MCP server
flyctl secrets set OAUTH_BRIDGE_JWT_SECRET="$SECRET" -a mittwald-mcp-fly2
```

### Health Check URLs
- OAuth Server: https://mittwald-oauth-server.fly.dev/health
- MCP Server: https://mittwald-mcp-fly2.fly.dev/health

### Logs
```bash
flyctl logs -a mittwald-oauth-server --no-tail | tail -50
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50
```

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
