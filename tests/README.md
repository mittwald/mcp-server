# Test Guide

Layered test strategy covering linting, type safety, Redis-backed session flows, the OAuth bridge,
and MCP end-to-end behaviour. All commands run with `npm` from the repository root.

For functional testing against the deployed endpoint using real coding agents, start with
`docs/FUNCTIONAL-TESTING-OPERATIONS.md`.

## Quick Commands

```bash
npm run lint
npm run type-check
npm run test          # everything
npm run test:unit
npm run test:integration
npm run test:bridge   # OAuth bridge package suite
npm run test:e2e
npm run test:security
npm run test:smoke
```

## Suite Overview

### Unit (`tests/unit/**`)
Handlers, tool definitions, utilities, middleware, metrics, session management and JWT
verification. `tests/unit/tools/tool-annotations.test.ts` enforces that every registered tool
declares a title and the three behavioural hints.

The OAuth bridge has its own unit suite under `packages/oauth-bridge/tests/`, run with
`npm run test:bridge`.

### Integration (`tests/integration/**`)
- `direct-token-cli.integration.test.ts` — direct Mittwald API token path
- `mittwald-integration.test.ts` — Mittwald-specific API constraints

### End-to-End (`tests/e2e/**`)
Full OAuth + MCP cycles against a stubbed Mittwald (`mittwald-stub-server.ts`):
- `claude-ai-oauth-flow.test.ts`
- `all-clients-compatibility.test.ts`
- `security-validation.e2e.test.ts`

`docker-compose.test.yml` brings up the stack these need. See `tests/e2e/README.md`.

### Security (`tests/security/**`)
Credential-leak regression and shell-injection fuzzing.

### Smoke (`tests/smoke/**`)
Post-deploy OAuth checks against a running deployment.

### Functional (`tests/functional/**`)
No vitest suite lives here — the directory holds the use-case library
(`tests/functional/use-case-library/`), the scenario corpus executed by the agent-native E2E
harness in `evals/`. See `docs/FUNCTIONAL-TESTING-OPERATIONS.md`.

## Environment Notes

- Redis must be reachable at `REDIS_URL` (`docker compose up redis` locally).
- The OAuth bridge needs its Mittwald configuration in the environment; see
  `packages/oauth-bridge/.env.example`.
- E2E suites need the bridge and MCP server running together with the **same** JWT secret
  (`BRIDGE_JWT_SECRET` / `OAUTH_BRIDGE_JWT_SECRET`).

For architectural context read `ARCHITECTURE.md`; for deployment read `DEPLOY.md`.
