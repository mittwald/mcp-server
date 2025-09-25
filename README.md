# Mittwald MCP Server

The Mittwald MCP server lets external MCP clients (Claude, ChatGPT, MCP Inspector, …) run Mittwald CLI commands on behalf of users. Authentication flows through a dedicated oidc-provider instance that proxies OAuth 2.1 requests to Mittwald's static client (`mittwald-mcp-server`). Each CLI invocation receives the user's Mittwald access token via `mw ... --token <mittwald_access_token>`.

## What Changed (2025-09-25)
- **Mittwald is authoritative for scopes and consent.** Our proxy no longer maintains its own scope catalogue or renders consent pages.
- **Dynamic client registration remains open.** Clients register through `/reg`; we store their metadata and rely on Mittwald to validate scopes during the downstream exchange.
- **JWT payloads include Mittwald tokens verbatim.** The scope string inside each issued JWT comes directly from Mittwald's token response.

For the full design see `ARCHITECTURE.md`.

## Repository Layout

```
packages/
  oauth-server/      # oidc-provider proxy to Mittwald OAuth
src/
  ...               # MCP server (JWT validation + CLI wrapper)
docs/               # Supplemental documentation
```

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Provide Mittwald OAuth details (use discovery when possible):
   ```bash
   export MITTWALD_ISSUER=https://id.mittwald.de
   export MITTWALD_CLIENT_ID=mittwald-mcp-server
   export MITTWALD_REDIRECT_URI=https://your-local-proxy/mittwald/callback
   # Optional fallback if discovery is unreachable
   export MITTWALD_SCOPE_FALLBACK="project:read project:write"
   ```
3. Run the OAuth proxy:
   ```bash
   pnpm --filter oauth-server dev
   ```
4. Run the MCP server:
   ```bash
   pnpm --filter mcp-server dev
   ```

Each service exposes health and debugging endpoints; consult `ARCHITECTURE.md` for flow diagrams and environment specifics.

## Operational Notes
- Revoke access in Mittwald Studio to force downstream clients to re-authorize.
- Monitor the OAuth proxy logs for discovery warnings—these indicate a fallback scope string is in use.
- Keep Fly.io volumes attached for JWKS and SQLite state; the proxy remains stateless outside of volume-backed storage.

## Testing
- Integration tests (planned) will verify that scope passthrough and consent short-circuiting behave as expected.
- Existing MCP tool tests remain unaffected; they rely on the MCP server injecting Mittwald tokens obtained via the proxy.

---

For questions or onboarding guidance, start with `ARCHITECTURE.md`.
