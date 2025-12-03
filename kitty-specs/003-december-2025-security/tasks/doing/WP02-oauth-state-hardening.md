---
work_package_id: "WP02"
subtasks:
  - "T010"
  - "T011"
  - "T012"
  - "T013"
  - "T014"
  - "T015"
title: "OAuth State Replay Prevention"
phase: "Phase 2 - Security Hardening (P1)"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "81842"
history:
  - timestamp: "2025-12-03T14:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-03T15:20:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "81842"
    action: "Started implementation - OAuth State Replay Prevention"
---

# Work Package Prompt: WP02 – OAuth State Replay Prevention

## Objectives & Success Criteria

- **Primary Objective**: Prevent OAuth state replay attacks by enforcing single-use semantics
- **Success Criteria**:
  - State parameters can only be used once (delete-on-read)
  - Second use of same state returns error
  - PKCE code_verifier and code_challenge are never empty strings
  - Existing in-flight OAuth flows complete normally

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 2, FR-004, FR-005
- **Data Model**: `kitty-specs/003-december-2025-security/data-model.md` - OAuth State entity
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 2 (single-use enforcement)

**Architectural Constraints**:
- Modify existing `RedisStateStore` class
- Maintain backward compatibility with in-flight OAuth flows
- State records have 10-minute TTL (unchanged)

## Subtasks & Detailed Guidance

### Subtask T010 – Add consumed flag to AuthorizationRequestRecord

**Purpose**: Track whether a state parameter has been used.

**Steps**:
1. Open `packages/oauth-bridge/src/state/state-store.ts`
2. Add `consumed?: boolean` to `AuthorizationRequestRecord` interface
3. Default to `false` when not present (backward compatibility)

**Files**:
- MODIFY: `packages/oauth-bridge/src/state/state-store.ts`

**Notes**:
- Optional field for backward compatibility with existing records
- Existing records without flag treated as not consumed

### Subtask T011 – Implement getAndConsumeState method

**Purpose**: Atomic retrieve-and-delete operation for single-use enforcement.

**Steps**:
1. Open `packages/oauth-bridge/src/state/redis-state-store.ts`
2. Add method `getAndConsumeState(internalState: string): Promise<AuthorizationRequestRecord | null>`
3. Implementation:
   ```typescript
   async getAndConsumeState(internalState: string): Promise<AuthorizationRequestRecord | null> {
     const key = this.authRequestKey(internalState);
     const record = await this.redis.get(key);
     if (record) {
       await this.redis.del(key); // Delete immediately after read
       const parsed = JSON.parse(record);
       // Check expiry
       if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
         return null;
       }
       return parsed;
     }
     return null;
   }
   ```
4. Add to `StateStore` interface

**Files**:
- MODIFY: `packages/oauth-bridge/src/state/redis-state-store.ts`
- MODIFY: `packages/oauth-bridge/src/state/state-store.ts` (interface)

**Notes**:
- Delete-on-read ensures single use
- No need for consumed flag check since we delete immediately

### Subtask T012 – Update storeAuthorizationRequest for non-empty PKCE

**Purpose**: Ensure PKCE values are always stored, never empty strings.

**Steps**:
1. In `storeAuthorizationRequest()`, add validation before storing:
   ```typescript
   if (!record.codeVerifier || record.codeVerifier === '') {
     throw new Error('codeVerifier is required and cannot be empty');
   }
   if (!record.codeChallenge || record.codeChallenge === '') {
     throw new Error('codeChallenge is required and cannot be empty');
   }
   ```
2. Move validation to start of method before any Redis operations

**Files**:
- MODIFY: `packages/oauth-bridge/src/state/redis-state-store.ts`

**Notes**:
- This prevents the state from being stored with invalid PKCE

### Subtask T013 – Add PKCE validation per RFC 7636

**Purpose**: Validate codeVerifier length meets RFC requirements.

**Steps**:
1. Add validation for codeVerifier length:
   ```typescript
   if (record.codeVerifier.length < 43 || record.codeVerifier.length > 128) {
     throw new Error('codeVerifier must be 43-128 characters per RFC 7636');
   }
   ```
2. Validate codeChallenge is base64url format (optional, trust upstream)

**Files**:
- MODIFY: `packages/oauth-bridge/src/state/redis-state-store.ts`

**Notes**:
- RFC 7636 specifies verifier must be 43-128 characters
- codeChallenge is derived from verifier, so length validation is secondary

### Subtask T014 – Update OAuth callback handler

**Purpose**: Use getAndConsumeState instead of getState for callback processing.

**Steps**:
1. Locate OAuth callback handler (likely in routes or handlers directory)
2. Find where `getAuthorizationRequestByInternalState()` is called
3. Replace with `getAndConsumeState()`:
   ```typescript
   const authRequest = await stateStore.getAndConsumeState(state);
   if (!authRequest) {
     // State not found or already consumed
     return res.status(400).json({ error: 'invalid_state' });
   }
   ```
4. Remove any manual state deletion that follows

**Files**:
- MODIFY: `packages/oauth-bridge/src/routes/authorize.ts` (or callback handler)

**Notes**:
- State is now deleted atomically on successful retrieval
- Second use of same state returns null

### Subtask T015 – Add unit tests for single-use enforcement

**Purpose**: Verify state can only be used once.

**Steps**:
1. Create or extend `tests/unit/redis-state-store.test.ts`
2. Test: storeAuthorizationRequest with empty codeVerifier throws
3. Test: storeAuthorizationRequest with short codeVerifier throws
4. Test: getAndConsumeState returns record on first call
5. Test: getAndConsumeState returns null on second call (same state)
6. Test: Expired state returns null

**Files**:
- CREATE/MODIFY: `tests/unit/redis-state-store.test.ts`

**Notes**:
- Mock Redis for unit tests
- Test both happy path and error cases

## Test Strategy

**Required Tests**:
- Unit tests for state store (T015)
- PKCE validation tests
- Single-use verification tests

**Test Commands**:
```bash
npm run test:unit -- redis-state-store
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking in-flight OAuth flows | Existing records expire naturally (10 min TTL); changes affect new flows only |
| PKCE validation breaks clients | Only validate on store; existing records without PKCE still work until expiry |
| Race condition on consume | Redis GET + DEL is not atomic; consider GETDEL if available in Redis 6.2+ |

## Definition of Done Checklist

- [ ] AuthorizationRequestRecord has consumed flag (optional, for interface completeness)
- [ ] getAndConsumeState() implemented with delete-on-read
- [ ] PKCE validation rejects empty strings and short verifiers
- [ ] OAuth callback uses getAndConsumeState()
- [ ] Unit tests pass
- [ ] Existing OAuth flows still work

## Review Guidance

- Verify delete-on-read is atomic (or as close as possible)
- Check error messages are appropriate for OAuth error responses
- Verify backward compatibility with records missing new fields
- Test actual OAuth flow end-to-end

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
