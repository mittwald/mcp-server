---
work_package_id: "WP07"
subtasks:
  - "T039"
  - "T040"
  - "T041"
  - "T042"
  - "T043"
  - "T044"
  - "T045"
  - "T046"
title: "E2E & Security Test Coverage"
phase: "Phase 4 - Validation (P3)"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-03T14:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP07 – E2E & Security Test Coverage

## Objectives & Success Criteria

- **Primary Objective**: Comprehensive E2E and security tests validating all security hardening from WP01-WP06
- **Success Criteria**:
  - Full OAuth flow with PKCE completes successfully
  - Session establishment and MCP tool execution verified
  - Negative tests catch security violations
  - All tests pass in CI environment

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 7, FR-015 to FR-018
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 7 (test patterns)

**Architectural Constraints**:
- Use existing mock-oauth2-server from docker-compose
- Extend vitest for e2e test patterns
- Tests must be idempotent and parallelizable
- No external network dependencies (mock all external services)

## Subtasks & Detailed Guidance

### Subtask T039 – Create OAuth flow E2E test

**Purpose**: Verify complete OAuth + PKCE flow end-to-end.

**Steps**:
1. Create `tests/e2e/oauth-flow.e2e.test.ts`
2. Test complete flow:
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from 'vitest';
   import { createServer } from '../../src/index.js';

   describe('OAuth Flow E2E', () => {
     let server: Server;
     let baseUrl: string;

     beforeAll(async () => {
       server = await createServer({ port: 0 }); // Random port
       baseUrl = `http://localhost:${server.address().port}`;
     });

     afterAll(async () => {
       await server.close();
     });

     it('completes full OAuth flow with PKCE', async () => {
       // 1. Generate PKCE pair
       const codeVerifier = generateCodeVerifier();
       const codeChallenge = generateCodeChallenge(codeVerifier);

       // 2. Initiate authorization
       const authResponse = await fetch(`${baseUrl}/authorize`, {
         method: 'POST',
         body: JSON.stringify({
           client_id: 'test-client',
           redirect_uri: 'http://localhost:3000/callback',
           code_challenge: codeChallenge,
           code_challenge_method: 'S256',
           scope: 'openid profile',
         }),
       });

       expect(authResponse.status).toBe(302);
       const authUrl = authResponse.headers.get('location');

       // 3. Simulate user authorization (via mock OAuth server)
       // ... mock returns authorization code

       // 4. Exchange code for tokens
       const tokenResponse = await fetch(`${baseUrl}/token`, {
         method: 'POST',
         body: new URLSearchParams({
           grant_type: 'authorization_code',
           code: authCode,
           code_verifier: codeVerifier,
           client_id: 'test-client',
           redirect_uri: 'http://localhost:3000/callback',
         }),
       });

       expect(tokenResponse.status).toBe(200);
       const tokens = await tokenResponse.json();
       expect(tokens.access_token).toBeDefined();
       expect(tokens.refresh_token).toBeDefined();
     });
   });
   ```

**Files**:
- CREATE: `tests/e2e/oauth-flow.e2e.test.ts`
- CREATE: `tests/e2e/helpers/pkce.ts` (PKCE helpers)
- CREATE: `tests/e2e/helpers/mock-oauth.ts` (mock server helpers)

**Notes**:
- Use mock-oauth2-server for IdP simulation
- Generate unique state per test for isolation

### Subtask T040 – Add session establishment test

**Purpose**: Verify session is created after successful OAuth flow.

**Steps**:
1. Extend oauth-flow.e2e.test.ts or create separate file
2. Test session creation:
   ```typescript
   it('establishes session after token exchange', async () => {
     // Complete OAuth flow (from T039)
     const tokens = await completeOAuthFlow();

     // Verify session exists
     const sessionResponse = await fetch(`${baseUrl}/api/session`, {
       headers: {
         'Authorization': `Bearer ${tokens.access_token}`,
       },
     });

     expect(sessionResponse.status).toBe(200);
     const session = await sessionResponse.json();
     expect(session.userId).toBeDefined();
     expect(session.expiresAt).toBeGreaterThan(Date.now());
   });
   ```
3. Test session retrieval with session cookie

**Files**:
- MODIFY: `tests/e2e/oauth-flow.e2e.test.ts`

**Notes**:
- Session should be bound to access token
- Verify session TTL matches expected value

### Subtask T041 – Add MCP tool execution test

**Purpose**: Verify authenticated MCP tool invocation works.

**Steps**:
1. Create `tests/e2e/mcp-tools.e2e.test.ts`
2. Test MCP tool execution with valid session:
   ```typescript
   describe('MCP Tool Execution', () => {
     it('executes tool with valid session', async () => {
       // Setup: Complete OAuth flow, establish session
       const session = await establishSession();

       // Execute MCP tool
       const toolResponse = await fetch(`${baseUrl}/mcp/tools/execute`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${session.accessToken}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           tool: 'project_list',
           arguments: {},
         }),
       });

       expect(toolResponse.status).toBe(200);
       const result = await toolResponse.json();
       expect(result.content).toBeDefined();
     });

     it('rejects tool execution without session', async () => {
       const toolResponse = await fetch(`${baseUrl}/mcp/tools/execute`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           tool: 'project_list',
           arguments: {},
         }),
       });

       expect(toolResponse.status).toBe(401);
     });
   });
   ```

**Files**:
- CREATE: `tests/e2e/mcp-tools.e2e.test.ts`

**Notes**:
- May need to mock Mittwald API responses
- Test with multiple tool types

### Subtask T042 – Create PKCE violation tests

**Purpose**: Verify missing or invalid PKCE is rejected.

**Steps**:
1. Add negative tests to oauth-flow.e2e.test.ts:
   ```typescript
   describe('PKCE Validation', () => {
     it('rejects authorization without code_challenge', async () => {
       const response = await fetch(`${baseUrl}/authorize`, {
         method: 'POST',
         body: JSON.stringify({
           client_id: 'test-client',
           redirect_uri: 'http://localhost:3000/callback',
           // Missing code_challenge
         }),
       });

       expect(response.status).toBe(400);
       const error = await response.json();
       expect(error.error).toBe('invalid_request');
     });

     it('rejects token exchange with wrong code_verifier', async () => {
       // Complete auth with one verifier
       const { authCode, codeVerifier } = await initiateAuth();

       // Exchange with different verifier
       const response = await fetch(`${baseUrl}/token`, {
         method: 'POST',
         body: new URLSearchParams({
           grant_type: 'authorization_code',
           code: authCode,
           code_verifier: 'wrong-verifier-that-does-not-match',
           client_id: 'test-client',
         }),
       });

       expect(response.status).toBe(400);
       const error = await response.json();
       expect(error.error).toBe('invalid_grant');
     });

     it('rejects empty code_verifier', async () => {
       const { authCode } = await initiateAuth();

       const response = await fetch(`${baseUrl}/token`, {
         method: 'POST',
         body: new URLSearchParams({
           grant_type: 'authorization_code',
           code: authCode,
           code_verifier: '',  // Empty
           client_id: 'test-client',
         }),
       });

       expect(response.status).toBe(400);
     });
   });
   ```

**Files**:
- MODIFY: `tests/e2e/oauth-flow.e2e.test.ts`

**Parallel?**: Yes - can be developed alongside T039-T041

### Subtask T043 – Create auth code replay tests

**Purpose**: Verify authorization codes can only be used once.

**Steps**:
1. Add replay tests:
   ```typescript
   describe('Auth Code Replay Prevention', () => {
     it('rejects reused authorization code', async () => {
       const { authCode, codeVerifier } = await initiateAuth();

       // First use - should succeed
       const firstResponse = await exchangeCode(authCode, codeVerifier);
       expect(firstResponse.status).toBe(200);

       // Second use - should fail
       const secondResponse = await exchangeCode(authCode, codeVerifier);
       expect(secondResponse.status).toBe(400);
       const error = await secondResponse.json();
       expect(error.error).toBe('invalid_grant');
     });

     it('rejects expired authorization code', async () => {
       const { authCode, codeVerifier } = await initiateAuth();

       // Wait for code to expire (or mock time)
       await sleep(11 * 60 * 1000); // 11 minutes > 10 minute TTL

       const response = await exchangeCode(authCode, codeVerifier);
       expect(response.status).toBe(400);
       const error = await response.json();
       expect(error.error).toBe('invalid_grant');
     });
   });
   ```

**Files**:
- MODIFY: `tests/e2e/oauth-flow.e2e.test.ts`

**Parallel?**: Yes - independent test scenarios

**Notes**:
- May need to mock time for expiry test
- Verify state is deleted after use (WP02)

### Subtask T044 – Create Redis failure handling tests

**Purpose**: Verify graceful handling when Redis is unavailable.

**Steps**:
1. Create `tests/e2e/redis-failure.e2e.test.ts`:
   ```typescript
   describe('Redis Failure Handling', () => {
     it('returns 503 when Redis is unavailable for session creation', async () => {
       // Stop Redis
       await stopRedis();

       try {
         const response = await fetch(`${baseUrl}/token`, {
           method: 'POST',
           body: new URLSearchParams({
             grant_type: 'authorization_code',
             code: 'test-code',
             code_verifier: 'test-verifier',
           }),
         });

         expect(response.status).toBe(503);
         const error = await response.json();
         expect(error.error).toBe('temporarily_unavailable');
       } finally {
         await startRedis();
       }
     });

     it('returns 503 when Redis is unavailable for session lookup', async () => {
       // Create session while Redis is up
       const session = await establishSession();

       // Stop Redis
       await stopRedis();

       try {
         const response = await fetch(`${baseUrl}/api/session`, {
           headers: {
             'Authorization': `Bearer ${session.accessToken}`,
           },
         });

         expect(response.status).toBe(503);
       } finally {
         await startRedis();
       }
     });
   });
   ```

**Files**:
- CREATE: `tests/e2e/redis-failure.e2e.test.ts`
- CREATE: `tests/e2e/helpers/docker.ts` (Redis start/stop helpers)

**Parallel?**: Yes - independent failure scenario tests

**Notes**:
- Requires docker-compose control from test
- Use testcontainers or docker-compose commands

### Subtask T045 – Add scope restriction tests

**Purpose**: Verify MCP tools respect granted scopes.

**Steps**:
1. Create `tests/e2e/scope-enforcement.e2e.test.ts`:
   ```typescript
   describe('Scope Enforcement', () => {
     it('allows tool execution within granted scope', async () => {
       const session = await establishSession({
         scopes: ['project:read', 'app:read'],
       });

       const response = await executeTool('project_list', {}, session);
       expect(response.status).toBe(200);
     });

     it('rejects tool execution outside granted scope', async () => {
       const session = await establishSession({
         scopes: ['project:read'],  // No app scope
       });

       const response = await executeTool('app_delete', { appId: '123' }, session);
       expect(response.status).toBe(403);
       const error = await response.json();
       expect(error.error).toBe('insufficient_scope');
     });

     it('handles missing scope gracefully', async () => {
       const session = await establishSession({
         scopes: [],  // No scopes
       });

       const response = await executeTool('project_list', {}, session);
       expect(response.status).toBe(403);
     });
   });
   ```

**Files**:
- CREATE: `tests/e2e/scope-enforcement.e2e.test.ts`

**Notes**:
- Depends on session tests from T040
- Map MCP tools to required OAuth scopes

### Subtask T046 – Document E2E test setup

**Purpose**: Help developers run E2E tests locally.

**Steps**:
1. Create `tests/e2e/README.md`:
   ```markdown
   # E2E Test Suite

   ## Prerequisites

   - Docker and docker-compose
   - Node.js 20+
   - Redis running (via docker-compose)

   ## Setup

   ```bash
   # Start test dependencies
   docker compose -f docker-compose.test.yml up -d

   # Wait for services to be ready
   npm run test:wait-for-services

   # Run E2E tests
   npm run test:e2e
   ```

   ## Test Structure

   ```
   tests/e2e/
   ├── oauth-flow.e2e.test.ts    # OAuth + PKCE flow tests
   ├── mcp-tools.e2e.test.ts     # MCP tool execution tests
   ├── scope-enforcement.e2e.test.ts  # Scope validation tests
   ├── redis-failure.e2e.test.ts # Failure handling tests
   └── helpers/
       ├── pkce.ts               # PKCE generation helpers
       ├── mock-oauth.ts         # Mock OAuth server helpers
       └── docker.ts             # Docker control helpers
   ```

   ## Running Individual Tests

   ```bash
   # Run specific test file
   npm run test:e2e -- oauth-flow

   # Run with verbose output
   npm run test:e2e -- --reporter=verbose

   # Run in watch mode
   npm run test:e2e -- --watch
   ```

   ## Debugging

   - Set `DEBUG=e2e:*` for detailed logging
   - Tests create isolated sessions; check Redis with `redis-cli`
   - Mock OAuth server logs available via `docker logs mock-oauth2-server`

   ## CI Configuration

   E2E tests run in GitHub Actions with:
   - Redis service container
   - Mock OAuth server container
   - 10-minute timeout per test file
   ```

**Files**:
- CREATE: `tests/e2e/README.md`
- MODIFY: `package.json` (add test:e2e script if missing)

**Parallel?**: Yes - documentation can be written alongside tests

## Test Strategy

**Test Commands**:
```bash
npm run test:e2e           # All E2E tests
npm run test:e2e:ci        # E2E with CI-specific config
npm run test:security      # Security-focused tests only
```

**Coverage Requirements**:
- OAuth flow: 100% happy path coverage
- PKCE: All validation paths tested
- Session: Creation, retrieval, expiry tested
- Scope: Allow and deny paths tested

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Flaky tests | Use explicit waits, not sleep; retry on network errors |
| Docker dependency | Document setup clearly; provide CI config |
| Slow test execution | Parallelize independent test files |
| Mock server divergence | Base mocks on Mittwald ID spec |

## Definition of Done Checklist

- [ ] OAuth flow E2E test passes
- [ ] Session establishment verified
- [ ] MCP tool execution verified
- [ ] PKCE violation tests pass
- [ ] Auth code replay tests pass
- [ ] Redis failure handling verified
- [ ] Scope enforcement verified
- [ ] Test documentation complete
- [ ] All tests pass in CI

## Review Guidance

- Verify tests are truly E2E (not unit tests in disguise)
- Check test isolation (no shared state between tests)
- Verify mock server responses match real Mittwald ID
- Run full suite multiple times to check for flakiness

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
