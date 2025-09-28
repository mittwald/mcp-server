# Testing

This repository ships with a layered test strategy that covers linting, type safety, unit behaviour, integration with Redis, OAuth server compliance, and full MCP end-to-end flows. The commands below assume you are working from the repository root.

## Quick Start Commands
- `npm run lint` — ESLint with the shared config for the entire workspace.
- `npm run type-check` — Typescript `--noEmit` verification to catch typing regressions early.
- `npm run test:unit` — Vitest unit suites under `tests/unit`.
- `npm run test:integration` — Integration suites that interact with Redis and the HTTP server.
- `npm run test:oauth` — Focused OAuth unit + integration suites (resource server).
- `npm run test:e2e:mcp` — Scripted MCP + OAuth end-to-end exercise (spawns mock services).
- `pnpm --filter @mittwald/oauth-bridge test` — Run tests inside the OAuth bridge package.

## Suite Overview
### Unit Tests
Located in `tests/unit/**` and `src/**/__tests__`. These suites execute without external services and focus on:
- request authentication helpers (`src/server/oauth-middleware.ts`)
- session storage (`src/server/session-manager.ts`)
- CLI wrappers and argument handling (`src/utils/cli-wrapper.ts`, `src/utils/session-aware-cli.ts`)

### Integration Tests
Located in `tests/integration/**`. They spin up Express handlers and Redis, validate session lifecycle, auth flows, and larger request/response payloads. Redis is expected on `redis://localhost:6379`; you can start it with `docker compose up redis`.

### OAuth Bridge Package
`packages/oauth-bridge` hosts the stateless OAuth bridge service. As tests are added they can be run with:
```bash
pnpm --filter @mittwald/oauth-bridge test
```
This reuses the shared Vitest configuration while allowing package-specific aliases.

### End-to-End & Tooling Scripts
- `npm run test:e2e:mcp` executes the scripted MCP OAuth flow using the mock OAuth server and CLI façade.
- `npm run test:cleanup` cleans residual functional test data when necessary.
- Deploy smoke tests should target the Fly.io staging apps (`mittwald-mcp-fly2`, `mittwald-oauth-server`) once credentials are configured.

## Environment Notes
- Copy `.env.example` to `.env` and populate secrets before running integration or end-to-end suites.
- Make SSL certificates available under `./ssl` if you enable HTTPS locally.
- HAR fixtures referenced in `oauth-debugging-context-2025-09-18.md` live under `~/Downloads` and should be attached manually when replaying flows.

For the detailed project-wide testing roadmap, see the "🧪 Full Project Testing Plan" section in `oauth-debugging-context-2025-09-18.md`.
