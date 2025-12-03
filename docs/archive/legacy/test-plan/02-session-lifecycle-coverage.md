# Plan: Expand Coverage of MCP Session Lifecycle

## Agent Brief
You are the LLM engineer responsible for proving the Redis-backed session lifecycle works under success and failure conditions. Execute every task below precisely, adding or modifying tests, utilities, and documentation as described. Keep the focus on deterministic coverage—no manual steps.

## Goal
Thoroughly test Redis-backed session management, authentication refresh, and MCP handler orchestration to prevent regressions in token persistence and session reuse.

## Deliverables
1. Unit/integration tests that prove `SessionManager` refreshes and destroys sessions correctly under varied conditions.
2. Coverage for `MCPHandler` server rehydration and transport cleanup.
3. Regression tests for `session-auth` middleware behavior when Redis state changes.

## Work Breakdown

### Phase 1: SessionManager Focused Tests
- [ ] **Introduce Redis Test Harness**
  - Use `ioredis-mock` for pure unit tests.
  - For refresh behavior that depends on TTL, add optional Testcontainers-based Redis harness.
- [ ] **Write tests for refresh success path**
  - Mock `refreshMittwaldAccessToken` to return new tokens.
  - Assert updated session stored with recalculated TTL.
- [ ] **Write tests for refresh failure path**
  - Simulate `MittwaldTokenServiceError` and ensure session is destroyed.
  - Verify that subsequent `getSession` returns `null`.
- [ ] **Cover missing refresh token scenario**
  - Ensure session without `mittwaldRefreshToken` is destroyed on expiration attempt.
- [ ] **Validate TTL calculations**
  - Assert `calculateTtl` never returns negative/zero, respects minimum 60s.

### Phase 2: MCPHandler Behavior
- [ ] **Create transport spy**
  - Implement lightweight stub for `StreamableHTTPServerTransport` to capture connection/close calls.
- [ ] **Test server recreation**
  - Simulate session refresh that updates access token; assert `createServer` invoked again and old server closed.
- [ ] **Test session cleanup interval**
  - Use fake timers to advance beyond `SESSION_TIMEOUT_MS`; ensure sessions removed and transport closed.
- [ ] **Validate error logging does not crash**
  - Inject failing handler to confirm errors propagate but server continues processing.

### Phase 3: Middleware Contract Tests
- [ ] **session-auth happy path**
  - Seed Redis session (using mock harness) and assert middleware populates `req.auth` + `req.user`.
- [ ] **Expired session handling**
  - Seed session with past `expiresAt`; ensure middleware deletes key and returns challenge.
- [ ] **Missing token fields**
  - Provide session lacking `mittwaldAccessToken`; ensure 401 challenge.
- [ ] **Scope parsing**
  - Confirm `scope` vs `scopes[]` fields handled uniformly.

### Phase 4: Documentation & Examples
- [ ] Document new tests in `tests/README.md` under “Session Lifecycle”.
- [ ] Provide snippets showing how to run Redis-dependent suites locally (e.g., `pnpm test:session`).

## Definition of Done
- New tests live under `tests/unit/server/` or `tests/integration/session/` and run via dedicated script.
- `SessionManager` and `MCPHandler` coverage metrics increase (track with `vitest --coverage`).
- Regressions such as a failed refresh silently leaving stale sessions are caught by tests.
