# LLM Onboarding Checklist – Mittwald MCP (2025-09-27)

Read the documents below in order to understand the current, stateless OAuth bridge architecture. Historical write-ups are in `docs/archive/` if you need them.

## 1. Core Architecture
- `ARCHITECTURE.md` – canonical description of the Mittwald OAuth bridge, Redis state, and MCP tool execution.
- `docs/2025-09-27-openai-connector-oauth-guidance.md` – connector-specific requirements, deployment checklists, and risk register.

## 2. Implementation Touchpoints
- Bridge: `packages/oauth-bridge/src/app.ts`, `routes/*`, `services/bridge-tokens.ts`.
- MCP server: `src/server/oauth-middleware.ts`, `src/server/session-manager.ts`, `src/server/mcp.ts`, `src/middleware/session-auth.ts`.
- Shared scope catalogue: `config/mittwald-scopes.json`.
- Tool execution helpers: `src/utils/session-aware-cli.ts`, `src/utils/cli-wrapper.ts`.

## 3. Upcoming Work
- `docs/2025-09-27-mcp-tool-scope-filtering.md` – plan for per-user tool filtering based on OAuth scopes.

## 4. Testing
- `tests/README.md` – current test matrix and environment setup.
- `docs/oauth-testing-tools.md` – oauth2c workflow, automation tooling, and Redis notes.

## 5. Operational References
- `README.md` – dev setup, run commands, and operational tips.
- `docs/INDEX.md` – living index of active documents.

## Archive
Legacy analyses (oidc-provider cookie loops, MCP JAM Inspector deep-dives, Claude Desktop notes) live in `docs/archive/`. They are useful for historical debugging but no longer describe the production stack.
