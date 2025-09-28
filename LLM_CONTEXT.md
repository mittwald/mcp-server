# LLM Context Reading List - Mittwald MCP Server (2025-09-27)

The codebase now uses a **stateless OAuth bridge** in front of the MCP server. Read the sections below (roughly in order) to understand the current implementation and where to make changes.

## 1. Foundation & Architecture (Read First)
- `ARCHITECTURE.md` – **CRITICAL** overview of the OAuth bridge, Redis-backed state, and how ChatGPT/Claude reach the MCP server.
- `docs/2025-09-27-openai-connector-oauth-guidance.md` – Live implementation log + debate notes documenting why we chose the bridge and the current rollout status.
- Root `package.json` – Monorepo scripts and shared dependencies (note new `koa`, `jose`, and `@koa/router` usage).

## 2. OAuth Bridge Implementation
- `packages/oauth-bridge/src/app.ts` – Koa app wiring and shared middleware.
- `packages/oauth-bridge/src/routes/authorize.ts` – Validates PKCE input, persists state, and redirects to Mittwald.
- `packages/oauth-bridge/src/routes/mittwald-callback.ts` – Handles Mittwald callback and stores the bridge authorization code.
- `packages/oauth-bridge/src/routes/token.ts` – Exchanges the code with Mittwald, verifies PKCE, and issues bridge JWTs/refresh tokens.
- `packages/oauth-bridge/src/routes/register.ts` – Dynamic client registration plus GET/DELETE management guarded by registration access tokens.
- `packages/oauth-bridge/src/services/bridge-tokens.ts` – HS256 signing that embeds Mittwald tokens into the JWT payload.
- `packages/oauth-bridge/tests/token-flow.test.ts` – Supertest flow test for `/authorize → /mittwald/callback → /token`.
- `packages/oauth-bridge/src/config.ts` – Environment-driven configuration (`BRIDGE_*`, `MITTWALD_*` without any client secret handling). Ensure deployments use `BRIDGE_BASE_URL=https://mittwald-oauth-server.fly.dev` so Mittwald’s redirect whitelist remains valid.

## 3. MCP Server Integration
- `src/server/config.ts` – Loads `OAUTH_BRIDGE_*` settings (`JWT_SECRET`, issuer, audience) and still exposes `JWT_SECRET` for legacy use.
- `src/server/oauth-middleware.ts` – Uses `jose.jwtVerify` to validate bridge tokens and extracts embedded Mittwald credentials.
- `src/middleware/session-auth.ts` – Hydrates `req.auth` from Redis sessions so CLI handlers always see up-to-date Mittwald tokens.
- `src/server/session-manager.ts` – Persists access/refresh tokens, scopes, and resources per session.
- `src/server/mcp.ts` – Creates sessions, stores auth context, and persists it back to Redis via `sessionManager`.
- `tests/unit/server/oauth-middleware.test.ts` & `tests/unit/middleware/session-auth.test.ts` – Updated unit coverage for both middleware layers.

## 4. Known Issues & Debugging Context
- `MCP-JAM-Inspector-OAuth-Analysis.md` – Historical analysis of redirect loops; useful for regression checks.
- `src/documentation/mcpjam-inspector-oauth21-dcr-report.md` – Inspector testing results and required discovery endpoints.
- `src/documentation/testing-oauth-and-mcp.md` – Testing strategies (CLI mock flows, oauth2c usage, etc.).
- Common pitfalls:
  1. **Cookie-less clients** – ChatGPT and Claude never persist cookies; rely on Redis state keyed by `state`.
  2. **Discovery metadata** – Bridge must publish `.well-known` endpoints with MCP extension; clients reject otherwise.
  3. **JWT verification** – MCP server requires `OAUTH_BRIDGE_JWT_SECRET`; mismatches yield 401s.
  4. **Redis consistency** – Sessions must include access + refresh tokens; absence triggers re-auth challenges.

## 5. Type Definitions & Contracts
- `src/types/` – MCP-specific type definitions used across tool handlers.
- `packages/oauth-bridge/src/state/state-store.ts` – Bridge state interfaces (authorization requests, grants, token payloads).
- `src/server/auth-types.ts` – MCP auth info contract used by middleware and handlers.

## 6. Configuration & Environment
- Bridge env vars:
  - `BRIDGE_ISSUER`, `BRIDGE_BASE_URL`, `BRIDGE_JWT_SECRET`, `BRIDGE_REDIRECT_URIS`
  - `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID`
- MCP env vars:
  - `OAUTH_BRIDGE_JWT_SECRET`, `OAUTH_BRIDGE_ISSUER`, `OAUTH_BRIDGE_AUDIENCE`
  - `MCP_PUBLIC_BASE`, `OAUTH_AS_BASE`
- Redis is required locally (`docker-compose.yml`) to persist session data.
- `config/mittwald-scopes.json` remains the authoritative scope catalogue for tool validation.

## 7. Testing & Quality Assurance
- Bridge tests: `packages/oauth-bridge/tests/token-flow.test.ts`
- Middleware tests: `tests/unit/server/oauth-middleware.test.ts`, `tests/unit/middleware/session-auth.test.ts`
- MCP tool tests (unchanged): under `tests/integration` and `tests/functional`.
- Postman collections (`tests/postman/`) still capture API contracts if needed for manual verification.

## Quick Reading Order for New Work
1. `docs/2025-09-27-openai-connector-oauth-guidance.md`
2. `packages/oauth-bridge/src/*`
3. `src/server/oauth-middleware.ts`
4. `src/middleware/session-auth.ts`
5. `src/server/mcp.ts` + `src/server/session-manager.ts`

## Important Notes
- OAuth bridge stores state keyed by `state`/`code` instead of cookies.
- MCP server must trust the bridge JWT secret; keep staging and production secrets aligned.
- Redis is the single source of truth for active sessions and Mittwald tokens.
- Claude vs ChatGPT have different redirect URIs; ensure `BRIDGE_REDIRECT_URIS` includes all variants.
