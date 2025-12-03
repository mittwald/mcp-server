# Plan: Replace Placeholder Specs With Executable Tests

## Agent Brief
You are the LLM engineer assigned to eliminate placeholder assertions and ship real integration/E2E coverage for the stateless OAuth bridge + MCP server. Treat the tasks below as a checklist; produce code, fixtures, and documentation updates exactly where specified. Raise questions only if requirements conflict.

## Goal
Convert all placeholder integration/E2E suites into deterministic, automated tests that validate the stateless OAuth bridge plus MCP server against realistic scenarios.

## Deliverables
1. Automated integration tests that exercise the Mittwald OAuth proxy flow without external dependencies.
2. Revamped E2E harness that drives the bridge + MCP stack in Docker Compose, covering at least one full OAuth + tool invocation happy path.
3. Regression coverage for failure cases currently ignored (network faults, Mittwald errors).

## Work Breakdown

### Phase 1: Test Harness Foundations
- [ ] **Create Mittwald token stub module**
  - Location: `tests/utils/mittwald-stub.ts`
  - Responsibilities: intercept `fetch` calls to Mittwald endpoints, return configurable responses.
  - Expose helpers for success, OAuth error, network failure.
- [ ] **Extend remote test helpers for bridge stack**
  - Update `tests/utils/remote.js` (or create TS equivalent) to support base URLs for bridge + MCP.
  - Add helper that waits for health endpoints before running tests.

### Phase 2: Rewrite `tests/integration/mittwald-integration.test.ts`
- [ ] Replace placeholder `expect(true)` blocks with actual requests using `supertest` against an in-memory Koa app created via `packages/oauth-bridge/src/app.ts`.
- [ ] Cover scenarios:
  - [ ] Successful PKCE authorization + token exchange (mock Mittwald success via stub).
  - [ ] Mittwald token endpoint returns HTTP 502 (ensure bridge surfaces `temporarily_unavailable`).
  - [ ] Invalid redirect URI rejected with `invalid_request`.
  - [ ] Confidential client authentication enforced (incorrect client secret yields 401).
- [ ] Ensure tests clean state between runs (reset MemoryStateStore).

### Phase 3: Rebuild E2E Flow (`tests/e2e/claude-ai-oauth-flow.test.ts` & `all-clients-compatibility.test.ts`)
- [ ] Author Docker Compose fixture in `tests/e2e/docker-compose.test.yml` that launches:
  - OAuth bridge (pointing to mock Mittwald endpoints served by test process).
  - MCP server (pointing to bridge, Redis, using test config).
  - Redis container (if not using in-memory mock).
- [ ] Implement setup script (`tests/e2e/setup.ts`) that:
  - Builds/starts the Compose stack.
  - Waits for `/health` on bridge and MCP.
  - Seeds fake Mittwald discovery endpoints.
- [ ] Rewrite tests to perform:
  - [ ] Discovery → DCR registration → OAuth authorization → token exchange, verifying responses at each step.
  - [ ] Authenticated `/mcp` call that lists tools or invokes a simple tool.
  - [ ] Error path for Mittwald downtime (simulate by shutting down stub service mid-test).
- [ ] Ensure teardown stops Compose stack even on failure.

### Phase 4: Document Usage
- [ ] Update `tests/README.md` with instructions for running new integration/E2E suites (including prerequisites like Docker).
- [ ] Add CI job configuration (see `05-ci-operationalization.md`).

## Definition of Done
- All placeholder `expect(true)` assertions removed.
- `pnpm test:integration` and `pnpm test:e2e` execute meaningful assertions locally.
- Bridge flow regressions (e.g., PKCE mismatch) cause test failures.
