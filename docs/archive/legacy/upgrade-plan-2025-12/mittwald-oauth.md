# mittwald-oauth Upgrade Plan (OAuth 2.1 + DCR)

Repository: `/Users/robert/Code/mittwald-oauth/mittwald-oauth`

## Current Architecture (quick read)
- **Express-based OAuth 2.1 AS** using `@jmondi/oauth2-server`; supports Authorization Code + PKCE, Dynamic Client Registration, Mittwald upstream token exchange, Mittwald token encryption at rest, bcrypt client secrets, rate limiting, helmet/CORS, CSRF protections, and audit/performance logging. DB via `knex`/PostgreSQL; migrations + seeds; token refresh safety window configurable.
- **Flows**: MCP clients register → authorize → AS exchanges with Mittwald ID (`MITTWALD_*` endpoints) → issues access/refresh tokens and client credentials. Admin + Mittwald proxy routes exist; tests cover unit/integration/playwright inspector flows.

## MCP Alignment & Gaps (2025-11-25)
- **Authorization guidance** – MCP 2025 security sections emphasize resource indicators, issuer/audience binding, PKCE-only public clients, and discovery metadata.
  - Action: ensure issued tokens embed Mittwald resource indicators and aud/iss claims mapped to MCP expectations; document supported scopes per `MITTWALD-OAUTH-CONFIG.md`.
- **Discovery/identity** – Needs `.well-known/mcp.json` (or equivalent) exposing auth endpoints, supported grant types, scopes, and protocol versions for MCP Registry/clients; also `.well-known/oauth-authorization-server` should include MCP metadata fields (`mcp.client_id`, redirect URIs).
- **Async task readiness** – If acting as AS for MCP servers that will issue async tasks, ensure token TTL/refresh policies support long-lived task polling and webhooks; consider event hooks for task progress auth.
- **Dynamic client registration** – Align with 2025 guidance: confidential clients, rotation, registration access tokens, deletion endpoints, metadata validation parity with MCP discovery cards.
- **Security posture** – Reconfirm CSRF exclusions, rate limits per endpoint, strict content-type validation, and logging redaction in light of 2025 supply-chain advisories (e.g., malicious MCP servers).

## Dependency & Runtime Modernization
- Major lagging deps (from `npm outdated`): `@jmondi/oauth2-server` 3.4 → 4.2, `express` 4.21 → 5.2, `uuid` 9 → 13, `helmet` 7 → 8, `express-rate-limit` 7 → 8, `jest` 29 → 30, `playwright/@playwright/test` 1.55 → 1.57, `@typescript-eslint/*` 6 → 8, `eslint` 8 → 9, `dotenv` 16 → 17, `bcrypt` 5 → 6, `joi` 17 → 18, `@types/*` and `typescript` 5.3 → 5.9.
- Action: plan phased upgrades (runtime deps first, then tooling). Validate Express 5 middleware signature changes, oauth2-server v4 breaking changes, uuid v13 ESM-only behavior, bcrypt/joi updates.

## Upgrade Work Plan
1) **Baseline deps + TypeScript** – Upgrade TypeScript/ts-jest/eslint stack; run Jest + Playwright suites; address type/tsconfig changes.
2) **Runtime deps** – Migrate to Express 5, oauth2-server v4, uuid 13, bcrypt 6; adjust middleware, auth grants, token model per breaking changes; refresh helmet/rate-limit configs.
3) **Discovery metadata** – Add `.well-known/mcp.json` and enrich `.well-known/oauth-authorization-server` with MCP fields; publish redirect URI catalogue; optionally add registry manifest for public listing.
4) **Authorization hardening** – Enforce resource indicators, aud/iss binding for issued tokens, PKCE-only for public clients, configurable confidential client auth methods; document secret rotation cadence and encryption key rotation.
5) **Client registration lifecycle** – Validate DCR conformance with SEP guidance: registration access tokens, delete/update, metadata validation, secret rotation endpoints; add tests.
6) **Operational checks** – Re-run migrations, DB health, rate limit tuning, logging redaction; ensure health endpoint reflects DB + crypto readiness; containerize with updated Node LTS.

## Validation Strategy
- Test suites: `npm run test` (Jest), `npm run test:integration`, `npm run test:playwright` (Inspector flow), `npm run lint`.
- OAuth conformance: run OAuth 2.1/DCR checks; verify PKCE enforcement; inspect JWT/opaque token structure for aud/iss/resource indicators.
- Discovery: curl `.well-known/mcp.json` and `.well-known/oauth-authorization-server`; validate against MCP/AS schemas; integrate with MCP Inspector using 2025-11 profile.
