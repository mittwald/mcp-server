# Test Guide

This repository uses a layered test strategy covering linting, type safety, Redis-backed session flows, the OAuth bridge, and MCP end-to-end behaviour. All commands below assume `pnpm` from the repo root.

## Quick Commands
- `pnpm lint`
- `pnpm type-check`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm --filter @mittwald/oauth-bridge test` (package-specific unit tests)

End-to-end flows will move into `pnpm test:e2e:mcp` as we stabilise the bridge-driven stack; see roadmap notes below.

## Suite Overview
### Unit Tests (`tests/unit/**`)
Focus: JWT verification, session management, CLI wrappers.
- `server/oauth-middleware.test.ts`
- `server/session-manager.test.ts`
- `utils/cli-wrapper.test.ts`
- `oauth-bridge/*` inside `packages/oauth-bridge/tests`

### Integration Tests (`tests/integration/**`)
Spin up Express handlers + Redis to verify:
- OAuth lifecycle and Mittwald token passthrough (`oauth-lifecycle.test.ts`)
- Scope persistence and refresh logic (`scope-validation.test.ts`)
- CLI token injection via `sessionAwareCli` (`cli-session.integration.test.ts`)
- Mittwald-specific API constraints (`mittwald-integration.test.ts`)

### End-to-End Roadmap (`tests/e2e/**`)
Legacy suites targeting the oidc-provider remain as references while we port them to the bridge:
- `all-clients-compatibility.test.ts`
- `claude-ai-oauth-flow.test.ts`

## Environment Notes
- Redis must be reachable at `REDIS_URL` (use `docker compose up redis` locally).
- The OAuth bridge expects Mittwald credentials via environment variables; see `ARCHITECTURE.md` for the list.
- End-to-end suites require the stateless bridge + MCP server running together; align secrets across both services.

## Next Steps
- Migrate remaining E2E suites to the stateless bridge stack.
- Add automated coverage for per-scope tool filtering once implemented.

For architectural context and deployment guidance read `ARCHITECTURE.md` and `docs/INDEX.md`.
