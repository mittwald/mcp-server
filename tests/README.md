# Test Guide

This repository uses a layered test strategy covering linting, type safety, Redis-backed session flows, the OAuth bridge, and MCP end-to-end behaviour. All commands below assume `pnpm` from the repo root.

## Quick Commands
- `pnpm lint`
- `pnpm type-check`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:e2e` *(requires Docker with Compose)*

## Suite Overview
### Unit Tests (`tests/unit/**`)
Focus: JWT verification, session management, CLI wrappers.
- `server/oauth-middleware.test.ts`
- `server/session-manager.test.ts`
- `utils/cli-wrapper.test.ts`
- Bridge-specific unit tests in `packages/oauth-bridge/tests`

### Integration Tests (`tests/integration/**`)
Integration now exercises the real OAuth bridge using a configurable Mittwald stub:
- `mittwald-integration.test.ts` drives `/authorize → /mittwald/callback → /token`, validates PKCE, confidential clients, and upstream failure propagation.
- Additional suites cover Redis-backed session flows and CLI behaviour.

### End-to-End (`tests/e2e/**`)
The E2E harness starts the bridge + MCP server via Docker Compose and seeds a local Mittwald stub.
- `claude-ai-oauth-flow.test.ts` performs discovery, DCR registration, full OAuth, and calls `/mcp` to list tools.
- `all-clients-compatibility.test.ts` verifies public and confidential clients coexist, including downtime handling.
- Compose definition: `tests/e2e/docker-compose.test.yml`

## Running the E2E Stack Locally
1. Install Docker Desktop (or Docker Engine v20+) with Compose v2.
2. Ensure no services are already bound to the chosen host ports (defaults are dynamic; see test logs).
3. Run `pnpm test:e2e` to execute the Vitest suite. The harness will:
   - Start the Mittwald stub on the host
   - Launch Compose (`redis`, `oauth-bridge`, `mcp-server`)
   - Wait for `/health` endpoints before executing tests
4. On failure, clean up containers with:
   ```bash
   docker compose -f tests/e2e/docker-compose.test.yml --project-name <name-from-logs> down --volumes --remove-orphans
   ```

## Troubleshooting
- **E2E port conflicts**: set `BRIDGE_HOST_PORT` / `MCP_HOST_PORT` before running `pnpm test:e2e` to pin host ports.
- **Mittwald stub offline**: `tests/e2e/setup.ts` exposes `setMittwaldMode` for tests; reset to `online` in teardown.
- **CI environments**: the new workflow in `.github/workflows/tests.yml` runs unit, integration, and (optionally) e2e jobs. Ensure Docker is available for the e2e job.

For architectural context and deployment guidance read `ARCHITECTURE.md` and `docs/INDEX.md`.
