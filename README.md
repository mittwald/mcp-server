# Mittwald MCP Server

The Mittwald MCP server lets external MCP clients (Claude, ChatGPT, MCP Inspector) run Mittwald CLI commands on behalf of users. Authentication now flows through a stateless OAuth bridge that fronts Mittwald’s OAuth 2.1 endpoints using Authorization Code + PKCE only. Mittwald treats our bridge as a **public client**—there is no Mittwald-issued client secret to manage. The bridge mints its own secrets for downstream confidential MCP clients (e.g. Claude Desktop) and verifies them before issuing JWTs. Each CLI invocation receives the user's Mittwald access token via `mw ... --token <mittwald_access_token>`.

## What Changed (2025-09-25)
- **Mittwald is authoritative for scopes and consent.** Our proxy no longer maintains its own scope catalogue or renders consent pages.
- **Dynamic client registration remains open.** Clients register through `/register`; we store their metadata and rely on Mittwald to validate scopes during the downstream exchange.
- **JWT payloads include Mittwald tokens verbatim.** The scope string inside each issued JWT comes directly from Mittwald's token response.
- **Confidential MCP clients are supported.** The bridge returns `client_secret_post` credentials during registration and enforces them on `/token`, allowing Claude Desktop to complete OAuth without custom configuration.

For the full design see `ARCHITECTURE.md`.

## Repository Layout

```
packages/
  oauth-bridge/      # stateless OAuth proxy to Mittwald OAuth
src/
  ...               # MCP server (JWT validation + CLI wrapper)
docs/               # Supplemental documentation
```

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure scopes and Mittwald OAuth details:
   ```bash
   export MITTWALD_ISSUER=https://id.mittwald.de
   export MITTWALD_CLIENT_ID=mittwald-mcp-server
   export MITTWALD_REDIRECT_URI=https://your-local-proxy/mittwald/callback
   ```
   The OAuth and MCP services both read their scope catalogue from `config/mittwald-scopes.json`.
   Update that file (or point `MITTWALD_SCOPE_CONFIG_PATH` at an override) to change supported or
   default scopes—no code changes required.
3. Run the OAuth bridge:
   ```bash
   pnpm --filter @mittwald/oauth-bridge dev
   ```
4. Run the MCP server:
   ```bash
   pnpm --filter mcp-server dev
   ```

Each service exposes health and debugging endpoints; consult `ARCHITECTURE.md` for flow diagrams and environment specifics.

## Operational Notes
- Revoke access in Mittwald Studio to force downstream clients to re-authorize.
- The OAuth bridge logs the loaded scope configuration (counts, defaults, config file path). Any
  mismatch between Mittwald discovery and the configured list is surfaced there.
- Ensure Redis is available to both the bridge and MCP server (`BRIDGE_STATE_STORE=redis`, shared
  session store).

## Testing
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test:unit` for fast local feedback.
- `pnpm test:integration` exercises Redis-backed session flows and bridge JWT verification.
- `pnpm test:e2e:mcp` (when available) drives a full OAuth + MCP tool cycle against the mock stack.
- See `tests/README.md` for the complete matrix and environment requirements.

---

For questions or onboarding guidance, start with `ARCHITECTURE.md`.
