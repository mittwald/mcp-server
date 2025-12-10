# Implementation Plan: Fix Token Truncation in MCP Pipeline

**Branch**: `009-fix-token-truncation` | **Date**: 2025-12-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/009-fix-token-truncation/spec.md`

## Summary

Fix Mittwald access token truncation causing 403 errors in 60% of test failures. Systematically investigate token flow through OAuth Bridge → Session Storage → Retrieval → CLI Wrapper using temporary debug logging to identify exact truncation point. Apply surgical fix at identified location. Add lightweight token format validation at key boundaries. Include minimal regression prevention tests. Expected outcome: test pass rate improves from 19.4% to 40-50%.

## Technical Context

**Language/Version**: TypeScript (Node.js runtime per existing codebase)
**Primary Dependencies**: Existing MCP server dependencies (no new dependencies)
**Storage**: In-memory session storage (current implementation)
**Testing**: Existing test framework in `tests/` directory
**Target Platform**: Fly.io (Node.js server environment)
**Project Type**: Single server project (MCP server + OAuth bridge)
**Performance Goals**: No performance impact (minimal validation overhead)
**Constraints**:
- Temporary instrumentation must be removed after fix
- Surgical fix only - no defensive programming elsewhere
- Lightweight validation - minimal ongoing overhead
**Scale/Scope**: 4 pipeline stages, ~5-10 files affected, 2-3 new test cases

**Planning Decisions**:
- **Investigation Approach**: Temporary debug logging at pipeline boundaries (remove after fix)
- **Validation Strategy**: Lightweight format checks at key boundaries only
- **Test Coverage**: Regression prevention tests (minimal, not comprehensive)
- **Health Checks**: Skip - rely on validation during actual tool usage
- **Philosophy**: "Fix it once, shouldn't happen again" - minimal ongoing overhead

## Constitution Check

*GATE: Must pass before Phase 0 research*

**Status**: No active constitution found - proceeding with standard best practices

**Best Practices Applied**:
- ✅ Minimal complexity - surgical fix approach
- ✅ Test coverage for regression prevention
- ✅ Clear documentation of token flow
- ✅ No unnecessary abstractions or frameworks

## Project Structure

### Documentation (this feature)

```
kitty-specs/009-fix-token-truncation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Investigation findings (Phase 0)
├── data-model.md        # Token pipeline data model (Phase 1)
├── quickstart.md        # Quick reference for token debugging (Phase 1)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── contracts/           # Token validation contracts (Phase 1)
```

### Source Code (repository root)

```
src/
├── server/
│   ├── session-manager.ts       # [INVESTIGATE] Session storage
│   └── oauth-middleware.ts      # [INVESTIGATE] Token retrieval
├── utils/
│   ├── cli-wrapper.ts            # [INVESTIGATE] CLI invocation
│   └── token-validation.ts       # [NEW] Lightweight validation
└── handlers/
    └── tools/                    # [INVESTIGATE] Tool handlers

packages/oauth-bridge/
├── src/
│   ├── routes/
│   │   └── token.ts              # [INVESTIGATE] Token generation
│   └── state/
│       └── state-store.ts        # [INVESTIGATE] Session storage

tests/
├── unit/
│   └── token-validation.test.ts  # [NEW] Validation tests
└── integration/
    └── token-flow.test.ts        # [NEW] End-to-end token test
```

**Structure Decision**: Using existing single-project structure. Investigation will trace tokens through 4 stages across OAuth bridge package and main MCP server. New validation utility added to `src/utils/`. Minimal test files added for regression prevention.

## Complexity Tracking

*No constitutional violations - proceeding with minimal complexity approach*

## Phase 0: Investigation & Research

### Objectives

1. Trace token flow through all 4 pipeline stages with temporary debug logging
2. Identify exact truncation point with evidence (before/after token values)
3. Document findings in research.md
4. Remove all temporary instrumentation after investigation complete

### Investigation Tasks

#### Task 1: Instrument OAuth Bridge Token Generation

**Files**: `packages/oauth-bridge/src/routes/token.ts`

**Actions**:
1. Add temporary debug logging at token generation point
2. Log full token format: `{uuid}:{secret}:{provider_suffix}`
3. Log token length and format validation
4. Note: Use `console.debug` with `[TOKEN-DEBUG]` prefix for easy filtering

**Evidence to Capture**:
- Token format at generation
- Token length
- Any transformations before storage

#### Task 2: Instrument Session Storage

**Files**:
- `packages/oauth-bridge/src/state/state-store.ts` (bridge side)
- `src/server/session-manager.ts` (MCP server side)

**Actions**:
1. Log token before storage (input)
2. Log token after storage retrieval (output)
3. Compare lengths and formats
4. Check for any serialization/deserialization issues

**Evidence to Capture**:
- Token before storage
- Token after retrieval
- Any differences indicating truncation

#### Task 3: Instrument Token Retrieval

**Files**: `src/server/oauth-middleware.ts`, `src/server/session-manager.ts`

**Actions**:
1. Log token when retrieved from session
2. Log token format and length
3. Check for any string operations or transformations

**Evidence to Capture**:
- Retrieved token format
- Any string slicing or manipulation

#### Task 4: Instrument CLI Wrapper

**Files**: `src/utils/cli-wrapper.ts`

**Actions**:
1. Log token before adding to CLI arguments
2. Log actual CLI command constructed (with token redacted for security)
3. Check argument construction for truncation

**Evidence to Capture**:
- Token passed to CLI wrapper
- Token in final CLI command
- Any truncation during argument building

#### Task 5: Run Instrumented Test

**Actions**:
1. Run single failing test: `access-001-create-sftp-user`
2. Collect all `[TOKEN-DEBUG]` logs
3. Analyze token format at each stage
4. Identify exact truncation point

**Expected Outcome**: Logs showing token going from full format to truncated format at specific boundary

### Research Documentation

**File**: `research.md`

**Contents**:
- **Investigation Summary**: Exact truncation point identified
- **Evidence**: Before/after token values at each stage
- **Root Cause Analysis**: Why truncation occurs (string slicing? buffer limit? serialization?)
- **Fix Approach**: Surgical fix at identified location
- **Verification Plan**: How to verify fix resolves issue

## Phase 1: Design & Implementation

### Data Model

**File**: `data-model.md`

**Entities**:

1. **Mittwald Access Token**
   - Format: `{uuid}:{secret}:{provider_suffix}`
   - Expected length: 100-500 characters
   - Components: UUID (36 chars), secret (variable), suffix (variable)
   - Validation: Must contain 2 colons, non-empty parts

2. **Token Validation Result**
   - Status: valid | invalid | truncated
   - Error message (if invalid)
   - Expected format vs actual format

3. **Pipeline Stage**
   - Stage name: oauth_bridge | session_storage | session_retrieval | cli_wrapper
   - Input token
   - Output token
   - Validation result

### Contracts

**Directory**: `contracts/`

**File**: `token-validation.md`

```markdown
# Token Validation Contract

## Token Format

### Valid Format
```
{uuid}:{secret}:{provider_suffix}
```

### Validation Rules

1. **Structure**: Must contain exactly 2 colons (3 parts)
2. **UUID Part**: Non-empty, appears to be UUID format
3. **Secret Part**: Non-empty
4. **Suffix Part**: Non-empty, typically starts with "mittwald_"

### Validation Function Signature

```typescript
interface TokenValidationResult {
  valid: boolean;
  error?: string;
  expectedFormat: string;
  actualFormat: string;
}

function validateMittwaldToken(token: string): TokenValidationResult
```

### Validation Points

1. **Before CLI Invocation** (cli-wrapper.ts)
   - Validate token format before adding to arguments
   - Log warning if invalid (don't block - let CLI handle auth)

### Error Messages

- `"Token truncated: expected format {uuid}:{secret}:{suffix}, got {uuid}:{secret}:{partial}"`
- `"Token malformed: expected 3 parts separated by colons, got N parts"`
- `"Token empty or missing"`
```

### Implementation Files

#### 1. Token Validation Utility

**File**: `src/utils/token-validation.ts` (NEW)

```typescript
/**
 * Lightweight token format validation
 * Checks Mittwald OAuth token structure without validating semantics
 */

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  expectedFormat: string;
  actualFormat: string;
}

export function validateMittwaldToken(token: string | undefined): TokenValidationResult {
  const expectedFormat = '{uuid}:{secret}:{provider_suffix}';

  if (!token) {
    return {
      valid: false,
      error: 'Token empty or missing',
      expectedFormat,
      actualFormat: 'empty'
    };
  }

  const parts = token.split(':');
  const actualFormat = `{${parts.length} parts}`;

  if (parts.length !== 3) {
    return {
      valid: false,
      error: `Token malformed: expected 3 parts separated by colons, got ${parts.length} parts`,
      expectedFormat,
      actualFormat
    };
  }

  const [uuid, secret, suffix] = parts;

  if (!uuid || !secret || !suffix) {
    return {
      valid: false,
      error: 'Token has empty parts',
      expectedFormat,
      actualFormat: `{${uuid?'uuid':'EMPTY'}:${secret?'secret':'EMPTY'}:${suffix?'suffix':'EMPTY'}}`
    };
  }

  return {
    valid: true,
    expectedFormat,
    actualFormat: `{uuid}:{secret}:{suffix:${suffix.length}chars}`
  };
}

/**
 * Redact sensitive token parts for logging
 */
export function redactToken(token: string): string {
  const parts = token.split(':');
  if (parts.length !== 3) return '[MALFORMED_TOKEN]';

  const [uuid, secret, suffix] = parts;
  return `${uuid.slice(0, 8)}...:[REDACTED]:${suffix}`;
}
```

#### 2. CLI Wrapper Enhancement

**File**: `src/utils/cli-wrapper.ts` (MODIFY)

**Changes**:
1. Add validation before CLI invocation
2. Log warning if token appears truncated
3. Don't block - let CLI handle actual auth failure

```typescript
import { validateMittwaldToken, redactToken } from './token-validation.js';

// In existing code where token is added to CLI args:
if (effectiveToken) {
  const validation = validateMittwaldToken(effectiveToken);

  if (!validation.valid) {
    console.warn(`[Token Validation] ${validation.error}`);
    console.warn(`[Token Validation] Expected: ${validation.expectedFormat}`);
    console.warn(`[Token Validation] Actual: ${validation.actualFormat}`);
    // Continue anyway - let CLI handle auth failure
  }

  effectiveArgs.push('--token', effectiveToken);
}
```

#### 3. Surgical Fix

**Files**: [Determined by investigation in Phase 0]

**Approach**:
- Fix exact truncation point identified in research
- No changes to other pipeline stages (surgical approach)
- Test fix resolves issue

### Testing

#### Test 1: Token Validation Unit Tests

**File**: `tests/unit/token-validation.test.ts` (NEW)

```typescript
import { validateMittwaldToken, redactToken } from '../../src/utils/token-validation';

describe('Token Validation', () => {
  it('validates correct token format', () => {
    const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_oauth_xyz';
    const result = validateMittwaldToken(token);
    expect(result.valid).toBe(true);
  });

  it('detects truncated tokens', () => {
    const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_o';
    const result = validateMittwaldToken(token);
    expect(result.valid).toBe(true); // Still valid format, just short suffix
  });

  it('detects malformed tokens', () => {
    const token = 'invalid:token';
    const result = validateMittwaldToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expected 3 parts');
  });

  it('detects empty tokens', () => {
    const result = validateMittwaldToken('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty or missing');
  });

  it('redacts sensitive token parts', () => {
    const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_oauth_xyz';
    const redacted = redactToken(token);
    expect(redacted).not.toContain('secretkey123');
    expect(redacted).toContain('[REDACTED]');
  });
});
```

#### Test 2: Token Flow Integration Test

**File**: `tests/integration/token-flow.test.ts` (NEW)

```typescript
/**
 * Regression test: Verify tokens maintain integrity through pipeline
 */

describe('Token Flow Integration', () => {
  it('maintains token format through full pipeline', async () => {
    // Test token with known format
    const testToken = 'test-uuid:test-secret:mittwald_oauth_suffix';

    // Simulate storing in session
    const session = await sessionManager.createSession({
      mittwaldAccessToken: testToken
    });

    // Retrieve from session
    const retrieved = await sessionManager.getSession(session.id);

    // Verify no truncation
    expect(retrieved?.mittwaldAccessToken).toBe(testToken);
    expect(retrieved?.mittwaldAccessToken.split(':').length).toBe(3);
  });

  it('validates token before CLI invocation', async () => {
    // This test runs actual CLI wrapper with validation
    const result = await invokeCliTool({
      toolName: 'test_tool',
      argv: ['--help'],
      sessionId: 'test-session-with-token'
    });

    // Should complete without validation errors
    expect(result).toBeDefined();
  });
});
```

### Quickstart Guide

**File**: `quickstart.md`

```markdown
# Token Debugging Quick Reference

## Token Format

Mittwald OAuth tokens follow this format:
```
{uuid}:{secret}:{provider_suffix}
```

Example:
```
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_abc123
```

## Checking Token Integrity

### 1. Check Session Token

```typescript
import { sessionManager } from './src/server/session-manager';

const session = await sessionManager.getSession(sessionId);
console.log('Token length:', session?.mittwaldAccessToken?.length);
console.log('Token parts:', session?.mittwaldAccessToken?.split(':').length);
```

### 2. Validate Token Format

```typescript
import { validateMittwaldToken } from './src/utils/token-validation';

const result = validateMittwaldToken(token);
if (!result.valid) {
  console.error('Token validation failed:', result.error);
}
```

### 3. Debug CLI Invocation

Check logs for validation warnings:
```
[Token Validation] Token malformed: expected 3 parts separated by colons, got 2 parts
```

## Common Issues

**Symptom**: 403 "access denied; verdict: abstain"
**Cause**: Token truncated or malformed
**Check**: Validate token format, check token length

**Symptom**: Token ends with `:mittwald_o`
**Cause**: Truncation during storage or serialization
**Fix**: Applied in this feature (see research.md)
```

## Phase 2: Task Breakdown

*Created by `/spec-kitty.tasks` command - not part of this plan*

Tasks will be generated based on:
1. Investigation findings from Phase 0
2. Surgical fix implementation
3. Validation utility creation
4. Test creation
5. Cleanup of temporary instrumentation

## Success Criteria Mapping

- **SC-001**: Token truncation bug identified with precision → Phase 0 research.md documents exact location
- **SC-002**: Test pass rate improves to 40-50% → Verify with test suite after fix
- **SC-003**: Zero 403 errors for valid operations → Run full 31-test suite
- **SC-004**: Tokens maintain full format → Integration test verifies
- **SC-005**: Validation catches 100% of malformed tokens → Unit tests verify
- **SC-007**: Minimum 2-3 test cases → token-validation.test.ts + token-flow.test.ts
- **SC-008**: Error messages actionable → Validation messages include expected vs actual format

## Next Steps

1. ✅ Planning complete - ready for research phase
2. Run investigation with temporary instrumentation (Phase 0)
3. Document findings in research.md
4. Implement surgical fix based on findings
5. Add lightweight validation
6. Create regression tests
7. Remove temporary instrumentation
8. Run `/spec-kitty.tasks` to break down into work packages
