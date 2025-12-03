---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
  - "T007"
  - "T008"
  - "T009"
title: "DCR Access Token Enforcement"
phase: "Phase 1 - Critical Security (P0)"
lane: "for_review"
assignee: "claude"
agent: "claude"
shell_pid: "76276"
history:
  - timestamp: "2025-12-03T14:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-03T14:55:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "76276"
    action: "Started implementation - DCR Access Token Enforcement"
---

# Work Package Prompt: WP01 – DCR Access Token Enforcement

## Objectives & Success Criteria

- **Primary Objective**: Fix the HIGH severity DCR vulnerability by implementing proper registration_access_token validation
- **Success Criteria**:
  - DCR GET/PUT/DELETE endpoints require valid registration_access_token
  - Invalid/missing/expired tokens return 401 Unauthorized
  - Tokens for wrong client return 403 Forbidden
  - POST /register issues registration_access_token in response
  - Tokens are persisted in Redis with client_id binding

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 1, FR-001 to FR-003
- **Data Model**: `kitty-specs/003-december-2025-security/data-model.md` - Registration Access Token entity
- **Contract**: `kitty-specs/003-december-2025-security/contracts/registration-token.md` - Full API contract
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 1 (Redis storage patterns)

**Architectural Constraints**:
- Use Redis for token storage (consistent with session-manager.ts patterns)
- Store only SHA-256 hash of token, never plaintext
- Key pattern: `reg_token:{client_id}`
- Default TTL: 30 days (configurable via DCR_TOKEN_TTL_DAYS environment variable)

## Subtasks & Detailed Guidance

### Subtask T001 – Create registration-token-store.ts

**Purpose**: Implement Redis-backed storage for registration access tokens.

**Steps**:
1. Create new file `src/server/registration-token-store.ts`
2. Define `RegistrationToken` interface with fields: tokenHash, clientId, issuedAt, expiresAt, revoked
3. Implement `RegistrationTokenStore` class following `SessionManager` patterns
4. Add methods: `createToken()`, `validateToken()`, `revokeToken()`, `getTokenForClient()`
5. Use singleton pattern with `getInstance()`

**Files**:
- CREATE: `src/server/registration-token-store.ts`
- REFERENCE: `src/server/session-manager.ts` (for patterns)

**Notes**:
- Use `redisClient` from `src/utils/redis-client.ts`
- Key prefix: `reg_token:`
- Use structured logging via `logger.ts`

### Subtask T002 – Implement token generation

**Purpose**: Generate cryptographically secure tokens with proper entropy.

**Steps**:
1. In `createToken()`, use `crypto.randomBytes(32)` for 256-bit entropy
2. Encode as base64url: `.toString('base64url')`
3. Compute SHA-256 hash before storage: `crypto.createHash('sha256').update(token).digest('hex')`
4. Return plaintext token to caller (shown once, stored as hash)

**Files**:
- MODIFY: `src/server/registration-token-store.ts`

**Notes**:
- Plaintext token is returned only during creation
- Never log or persist the plaintext token

### Subtask T003 – Implement token validation

**Purpose**: Validate tokens against stored records with proper security checks.

**Steps**:
1. In `validateToken(clientId, providedToken)`:
   - Compute SHA-256 hash of provided token
   - Lookup stored record by clientId
   - Use timing-safe comparison for hash matching
   - Check `expiresAt > Date.now()`
   - Check `revoked === false`
2. Return validation result with specific error reason

**Files**:
- MODIFY: `src/server/registration-token-store.ts`

**Notes**:
- Use `crypto.timingSafeEqual()` for hash comparison
- Return specific error codes: 'invalid', 'expired', 'revoked', 'not_found'

### Subtask T004 – Create dcr-auth.ts middleware

**Purpose**: Express middleware to authenticate DCR management requests.

**Steps**:
1. Create `packages/oauth-bridge/src/middleware/dcr-auth.ts`
2. Parse `Authorization: Bearer <token>` header
3. Extract `client_id` from request path params
4. Call `registrationTokenStore.validateToken(clientId, token)`
5. Return 401 on invalid token, 403 on wrong client, continue on success

**Files**:
- CREATE: `packages/oauth-bridge/src/middleware/dcr-auth.ts`

**Notes**:
- Follow existing middleware patterns in oauth-bridge
- Set appropriate error response format per RFC 7592

### Subtask T005 – Modify DCR routes for authentication

**Purpose**: Apply authentication middleware to DCR management endpoints.

**Steps**:
1. Locate DCR routes in `packages/oauth-bridge/src/routes/` (likely register.ts or similar)
2. Import `dcrAuthMiddleware` from new middleware file
3. Apply middleware to GET /register/:client_id
4. Apply middleware to PUT /register/:client_id
5. Apply middleware to DELETE /register/:client_id
6. Leave POST /register unauthenticated (creates new client)

**Files**:
- MODIFY: `packages/oauth-bridge/src/routes/register.ts` (or equivalent)

**Notes**:
- POST /register creates client and issues token
- GET/PUT/DELETE require the issued token

### Subtask T006 – Modify POST /register response

**Purpose**: Issue registration_access_token when new client is registered.

**Steps**:
1. In POST /register handler, after successful client creation:
2. Call `registrationTokenStore.createToken(clientId, ttlDays)`
3. Add `registration_access_token` to response body
4. Add `registration_client_uri` with management endpoint URL

**Files**:
- MODIFY: `packages/oauth-bridge/src/routes/register.ts` (or equivalent)

**Notes**:
- Token shown only in this response
- Client must store token for future management operations

### Subtask T007 – Add token expiry to response

**Purpose**: Include token expiration timestamp in registration response.

**Steps**:
1. Calculate expiry timestamp: `issuedAt + (ttlDays * 24 * 60 * 60 * 1000)`
2. Add `registration_access_token_expires_at` as Unix timestamp (seconds)
3. Use 0 for "never expires" if configured without TTL

**Files**:
- MODIFY: `packages/oauth-bridge/src/routes/register.ts` (or equivalent)

**Notes**:
- Per RFC 7592, this field helps clients track token lifecycle

### Subtask T008 – Create unit tests for token store

**Purpose**: Verify token store CRUD operations and security properties.

**Steps**:
1. Create `tests/unit/registration-token-store.test.ts`
2. Test createToken() returns valid base64url token
3. Test validateToken() accepts valid token
4. Test validateToken() rejects wrong token
5. Test validateToken() rejects expired token
6. Test validateToken() rejects revoked token
7. Test revokeToken() marks token as revoked

**Files**:
- CREATE: `tests/unit/registration-token-store.test.ts`

**Notes**:
- Mock Redis client for unit tests
- Use vitest patterns from existing tests

### Subtask T009 – Create integration tests for DCR

**Purpose**: Verify end-to-end DCR token flow with real Redis.

**Steps**:
1. Create `tests/integration/dcr-token.integration.test.ts`
2. Test: POST /register returns registration_access_token
3. Test: GET /register/:id with valid token returns 200
4. Test: GET /register/:id with invalid token returns 401
5. Test: GET /register/:id with wrong client's token returns 403
6. Test: DELETE /register/:id with valid token succeeds

**Files**:
- CREATE: `tests/integration/dcr-token.integration.test.ts`

**Notes**:
- Requires running Redis (use docker-compose)
- Clean up test clients after each test

## Test Strategy

**Required Tests** (per spec FR-015, FR-016):
- Unit tests for token store (T008)
- Integration tests for DCR endpoints (T009)

**Test Commands**:
```bash
npm run test:unit -- registration-token-store
npm run test:integration -- dcr-token
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing clients | Existing clients have no tokens; document re-registration requirement |
| Redis unavailable | Return 503 Service Unavailable (existing pattern) |
| Token leakage in logs | Never log plaintext tokens; only log client_id |
| Timing attacks | Use crypto.timingSafeEqual for hash comparison |

## Definition of Done Checklist

- [ ] registration-token-store.ts created and passes unit tests
- [ ] dcr-auth.ts middleware created
- [ ] GET/PUT/DELETE /register/:client_id require valid token
- [ ] POST /register returns registration_access_token
- [ ] Integration tests pass
- [ ] No plaintext tokens in logs
- [ ] Documentation updated (if applicable)

## Review Guidance

- Verify token generation uses 256-bit entropy
- Verify hash comparison is timing-safe
- Verify error responses match RFC 7592 format
- Verify Redis key TTL is set correctly
- Check that existing OAuth flows still work

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-03T14:55:00Z – claude – lane=doing – Started implementation
- 2025-12-03T15:10:00Z – claude – lane=for_review – Implementation complete. All 46 tests pass. Created:
  - `packages/oauth-bridge/src/registration-token-store.ts` (256-bit entropy, SHA-256 hashing, timing-safe comparison)
  - `packages/oauth-bridge/src/registration-token-store-factory.ts` (factory for Redis instantiation)
  - `packages/oauth-bridge/src/middleware/dcr-auth.ts` (Bearer token validation middleware)
  - `packages/oauth-bridge/tests/unit/registration-token-store.test.ts` (23 unit tests)
  - `packages/oauth-bridge/tests/helpers/mock-token-store.ts` (test helper)
  - `packages/oauth-bridge/tests/integration/dcr-token.integration.test.ts` (14 integration tests)
  - Modified `register.ts`, `app.ts`, `server.ts`, `index.ts`, `token-flow.test.ts`
