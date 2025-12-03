# mittwald-mcp Upgrade Plan (MCP server + OAuth bridge)

Repository: `/Users/robert/Code/mittwald-mcp`

## Current Architecture (quick read)
- **MCP server (Express, TS)** – Validates OAuth bridge JWTs with `jose`, hydrates sessions from Redis (`src/server/session-manager.ts`, `src/middleware/session-auth.ts`), and executes Mittwald CLI commands with per-request tokens. Tooling includes destructive-operation guardrails and credential-safety helpers (redaction/sanitization/tests).
- **OAuth bridge (packages/oauth-bridge, Koa)** – Stateless PKCE proxy to Mittwald OAuth. Exposes discovery (`.well-known/oauth-authorization-server`), `/authorize`, Mittwald callback, `/token`, and dynamic client registration with optional client secrets for confidential MCP clients. Signs HS256 JWTs embedding Mittwald access/refresh tokens; shares secret with MCP server via `OAUTH_BRIDGE_JWT_SECRET`. State/session cached in Redis in production.
- **Session flow** – Bridge exchanges Mittwald codes → returns JWT; MCP middleware verifies → stores Mittwald tokens + context in Redis. Optional direct Mittwald bearer validation (`ENABLE_DIRECT_BEARER_TOKENS`).

## MCP Spec Compliance (2025-11-25) – Gaps & Actions
- **Protocol version & SDK** – On `@modelcontextprotocol/sdk` 1.13.0 (current 1.24.x). Upgrade to gain 2025-11 features: async tasks, structured content stability, titles/meta fields, elicitation capability flags, improved auth handling.
  - Action: bump SDK; ensure `initialize` advertises supported versions (2025-11-25, 2025-06-18 fallback) and capability flags for elicitation/structured output.
- **Async tasks primitive** – Tools currently synchronous. Need task orchestration API (start → poll/subscribe → result) per SEP-1391.
  - Action: design task manager (Redis-backed) plus tool contract updates; surface `tasks/create`, `tasks/get`, `tasks/list` if SDK exposes helpers; add progress callbacks/log streaming.
- **Structured output / resource links** – Verify tools return schemas/outputSchema and populate `structuredContent`/resource links per 2025-06-18+ rules.
  - Action: audit tool responses for schema metadata; add `_meta`, `title` fields; ensure resource URIs use stable scheme (mittwald://project/<id>?context=...).
- **Elicitation** – Ensure server advertises elicitation support and can request user input where required (e.g., destructive actions needing confirmation or missing parameters).
  - Action: integrate SDK elicitation helpers; add validation paths that trigger `elicit` instead of failing.
- **Server identity & discovery** – No `.well-known/mcp.json` today.
  - Action: serve `.well-known/mcp.json` + optional `/.well-known/ai-plugin.json` mapping, exposing server metadata, auth methods (OAuth bridge), supported transports (stdio/HTTP if applicable), protocol versions, registry card.
- **Transport/statelessness** – Validate current transport (likely stdio/HTTP). For scalability align with streamable HTTP guidance; document stateless session cache strategy.
- **Security alignment** – Re-check against 2025 security section: aud/iss binding on JWTs, resource indicators, token rotation/expiry, CSRF for HTTP transports, log redaction, registry signing keys if published.
  - Action: add resource indicator enforcement when exchanging Mittwald tokens; tighten JWT audience/issuer checks; ensure Redis TTL aligns with token expiry; rotate bridge secrets policy.

## Dependency & Runtime Modernization
- Outdated key deps (per `npm outdated`): `@modelcontextprotocol/sdk@1.13.0 → 1.24.x`, `@mittwald/api-client` 4.169 → 4.270, `zod` 3.x → 4.x, `vitest`/`@vitest/*` 3.2 → 4.0, `express` 5.1 → 5.2, `dotenv` 16 → 17, `typescript` 5.8 → 5.9, `@types/node` 22 → 24, `koa` 2 → 3, `@koa/router` 13 → 15, `pino` 9 → 10.
- Node target currently `>=20.12.0`; validate with SDK/tooling after upgrades (Node 22/23+ may be required by some deps).
- Action: stage upgrades in bundles (runtime deps, test/lint deps), run `npm test`, integration/e2e (`npm run test:all`, `test:e2e:mcp`). Watch for breaking changes in `koa` v3 and `zod` v4 schemas.

## Compliance/Upgrade Work Plan
1) **Baseline upgrades** – Update SDK + type deps; align TypeScript config with SDK 2025-11 schemas; refresh mittwald API client and jose minor. Verify `initialize` negotiation logic and capability flags.
2) **Discovery & registry** – Implement `.well-known/mcp.json` endpoint; optionally publish registry manifest and signed card; document in README.
3) **Async task support** – Add task manager abstraction, wire into tools needing long-running operations; expose progress events and retrieval endpoints per SDK.
4) **Structured output & elicitation** – Audit tools; add output schemas/resource links; introduce elicitation for missing params/confirmations; extend tests.
5) **OAuth hardening** – Enforce aud/iss/resource indicator checks on bridge JWT; ensure Redis TTL mirrors Mittwald token lifetimes; add secret rotation procedure; update docs/env samples.
6) **Operational checks** – Re-run security/destructive-operation lint/tests; validate Redis persistence for bridge state; confirm logging redaction; update Dockerfiles to pinned Node LTS supporting new deps.

## Validation Strategy
- Unit + integration: `npm run test:unit`, `npm run test:integration`, OAuth flows (`npm run test:oauth`), functional/e2e suites.
- MCP compliance: run `npm run inspector` with 2025-11-25 profile; confirm version negotiation and capability flags.
- Registry/discovery: curl `.well-known/mcp.json`; validate against spec schema if published.
- Performance/regression: watch Redis load with async task polling; consider rate limits on task APIs.
