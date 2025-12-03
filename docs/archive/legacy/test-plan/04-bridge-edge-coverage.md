# Plan: Secure OAuth Bridge Edge Cases

## Agent Brief
You are the LLM engineer ensuring the stateless OAuth bridge handles every edge case. Build exhaustive tests around registration, metadata, and `/token` behavior. Follow the steps exactly—cover both success and failure paths, and update documentation where called out.

## Goal
Expand automated coverage for the stateless OAuth bridge to ensure client registration, JWT issuance, and error handling are robust across edge scenarios.

## Deliverables
1. Tests for dynamic client registration lifecycle (POST/GET/DELETE) across auth methods.
2. Validation of metadata endpoints (`/.well-known/*`, `/jwks`) responses.
3. Coverage for token exchange error paths (PKCE mismatch, expired grants, Mittwald failures).

## Work Breakdown

### Phase 1: Registration Lifecycle
- [ ] **Add tests to `packages/oauth-bridge/tests/`**:
  - [ ] `register` with `token_endpoint_auth_method=client_secret_post` returns secret and stores hashed entry.
  - [ ] GET with missing/invalid registration access token yields 401 + WWW-Authenticate header.
  - [ ] DELETE removes client and prevents further token exchanges.
- [ ] **Mock state store** to inspect stored metadata after registration.

### Phase 2: Metadata & Discovery
- [ ] **Write tests for `.well-known/oauth-authorization-server`**
  - Assert issuer, endpoints, scope lists, MCP metadata block.
- [ ] **Test `.well-known/oauth-protected-resource`**
  - Confirm resource URI and capabilities.
- [ ] **Ensure `/jwks` returns empty keys array with no-cache headers**.

### Phase 3: Token Endpoint Edge Cases
- [ ] **PKCE validation**
  - Supply wrong `code_verifier`; expect `invalid_grant` with descript message.
- [ ] **Expired or re-used authorization code**
  - Simulate `grant.used = true`; ensure 400 response.
- [ ] **Redirect mismatch**
  - Provide different `redirect_uri`; expect `invalid_grant`.
- [ ] **Client auth failures**
  - Missing/incorrect Basic auth header for `client_secret_basic` clients.
  - Missing `client_secret` for `client_secret_post`.
- [ ] **Mittwald exchange errors**
  - Mock `fetch` rejection → expect 502 with `temporarily_unavailable`.
  - Non-JSON Mittwald response → expect 500 with clear message.

### Phase 4: Redis-backed State Store
- [ ] **If Redis enabled (`BRIDGE_STATE_STORE=redis`)**
  - Use Testcontainers Redis instance.
  - Verify TTL behavior for authorization requests and grants.
  - Ensure cleanup after token exchange.

### Phase 5: Coverage Metrics & Docs
- [ ] Run `pnpm --filter @mittwald/oauth-bridge test --coverage` to capture baseline.
- [ ] Document how to run bridge-specific tests in `packages/oauth-bridge/README.md`.

## Definition of Done
- All new tests pass locally and in CI.
- Bridge coverage reports show exercises for `/authorize`, `/token`, `/register`, `.well-known`, and error paths.
- Regression (e.g., forgetting to check PKCE) produces failing tests.
