# Mittwald MCP Server
[![Coverage Check](https://github.com/robertDouglass/mittwald-mcp/actions/workflows/coverage-check.yml/badge.svg)](https://github.com/robertDouglass/mittwald-mcp/actions/workflows/coverage-check.yml)

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

> **Prerequisite**: Node.js 20.12.2 (see `.nvmrc` / `.node-version`). Earlier LTS releases (e.g. Node 18) cannot run `@mittwald/cli@1.12.0` because its dependencies require the new `/v` regular-expression flag.

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

## Coverage Reports

- `mw-cli-coverage.json` contains machine-readable coverage stats for the Mittwald CLI.
- Validate the artifact with `config/mw-cli-coverage.schema.json` (e.g. `npx ajv validate -s config/mw-cli-coverage.schema.json -d mw-cli-coverage.json`).
- Regeneration is automated via the Workstream A script (`npm run coverage:generate`); commit both the JSON and `docs/mittwald-cli-coverage.md` after running it. Only rerun when tool metadata, exclusion lists, or the Mittwald CLI version change—routine commits that don’t touch those inputs can skip regeneration.
- Intentional gaps live in `config/mw-cli-exclusions.json`. Update this allowlist (with rationale) whenever a missing CLI command is acceptable—CI fails if `stats.missingCount` is greater than zero.
- Quick commands:
  - `npm run coverage:generate` – rebuild artifacts when coverage inputs change.
  - `npm run check:cli-version` – warn when Dockerfile pins drift from npm.
- See `docs/coverage-automation.md` for the full runbook covering CI guards and allowlist policy.
- Intentional gaps live in `config/mw-cli-exclusions.json`. Update this allowlist (with rationale) whenever a missing CLI command is acceptable—CI fails if `stats.missingCount` is greater than zero.

---

For questions or onboarding guidance, start with `ARCHITECTURE.md` and `docs/INDEX.md` (docs navigation). LLM/agent operators should read `docs/LLM-AGENTS.md`.
