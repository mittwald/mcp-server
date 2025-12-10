# Research: Token Truncation Investigation

**Feature**: 009-fix-token-truncation
**Date**: 2025-12-10
**Status**: Ready for Investigation

## Research Question

**Primary Question**: Where exactly in the OAuth Bridge → Session Storage → Retrieval → CLI Wrapper pipeline are Mittwald access tokens being truncated?

**Sub-Questions**:
1. At which pipeline stage does truncation occur?
2. What is the root cause (string slicing, buffer limit, serialization issue)?
3. What is the exact code location?
4. Why does the token end at `:mittwald_o` specifically?

## Methodology

### Investigation Approach

**Phase**: Systematic instrumentation with temporary debug logging

**Steps**:
1. Add `[TOKEN-DEBUG]` logging at each pipeline boundary
2. Run failing test: `access-001-create-sftp-user`
3. Collect logs showing token format at each stage
4. Identify exact truncation point
5. Analyze root cause
6. Remove instrumentation after investigation

### Pipeline Stages to Instrument

```
Stage 1: OAuth Bridge Token Generation
  └─> packages/oauth-bridge/src/routes/token.ts

Stage 2: Session Storage (Bridge Side)
  └─> packages/oauth-bridge/src/state/state-store.ts

Stage 3: Session Retrieval (MCP Server Side)
  └─> src/server/session-manager.ts
  └─> src/server/oauth-middleware.ts

Stage 4: CLI Wrapper Invocation
  └─> src/utils/cli-wrapper.ts
```

## Evidence Collection

### Evidence Format

For each pipeline stage:
```
[TOKEN-DEBUG] Stage: {stage_name}
[TOKEN-DEBUG] Token length: {length}
[TOKEN-DEBUG] Token format: {redacted_format}
[TOKEN-DEBUG] Token parts: [{part1_len}, {part2_len}, {part3_len}]
```

### Expected vs Actual

**Expected Token Format**:
```
{uuid}:{secret}:{provider_suffix}
Example: c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_xyz
Length: ~100-150 characters
Parts: [36 chars, 40-60 chars, 15-30 chars]
```

**Actual Token (Truncated)**:
```
{uuid}:{secret}:mittwald_o
Example: c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_o
Length: ~90-100 characters
Parts: [36 chars, 40-60 chars, 10 chars] ← TRUNCATED!
```

## Investigation Checklist

### Pre-Investigation
- [x] Identify failing test case (access-001-create-sftp-user)
- [x] Review test logs showing 403 error with truncated token
- [x] Confirm truncation pattern: ends at `:mittwald_o`

### Stage 1: OAuth Bridge
- [x] Add logging to token generation
- [x] Verify token format at generation point
- [x] Check if truncation occurs before storage
- [x] Document token length and format

### Stage 2: Session Storage
- [x] Add logging before storage (input)
- [x] Add logging after retrieval (output)
- [x] Compare input vs output lengths
- [x] Check for serialization issues

### Stage 3: Session Retrieval
- [x] Add logging when retrieving from session
- [x] Check for string operations or transformations
- [x] Verify retrieved token matches stored token

### Stage 4: CLI Wrapper
- [x] Add logging before adding token to arguments
- [x] Check CLI command construction
- [x] Verify token in final command

### Analysis
- [ ] Identify exact stage where truncation occurs (pending test execution)
- [ ] Determine root cause (code line, operation)
- [ ] Document why truncation happens
- [ ] Propose surgical fix

### Cleanup
- [ ] Remove all `[TOKEN-DEBUG]` logging
- [ ] Commit only the fix, not instrumentation

## Instrumentation Added (2025-12-10)

**Status**: All 4 pipeline stages instrumented with debug logging. Ready for test execution.

### Files Modified

1. **packages/oauth-bridge/src/services/mittwald.ts**
   - Lines 59-66: Token generation instrumentation
   - Lines 109-116: Token refresh instrumentation
   - Logs: `[TOKEN-DEBUG] oauth_bridge_generation` and `[TOKEN-DEBUG] oauth_bridge_refresh`

2. **src/server/session-manager.ts**
   - Lines 75-84: Session storage INPUT instrumentation (before Redis write)
   - Lines 113-122: Session storage OUTPUT instrumentation (after Redis read)
   - Logs: `[TOKEN-DEBUG] session_storage_input` and `[TOKEN-DEBUG] session_storage_output`

3. **src/server/oauth-middleware.ts**
   - Lines 172-180: JWT payload extraction instrumentation
   - Logs: `[TOKEN-DEBUG] oauth_middleware`

4. **src/utils/cli-wrapper.ts**
   - Lines 159-165: CLI token preparation instrumentation
   - Lines 203-214: Final CLI command instrumentation
   - Logs: `[TOKEN-DEBUG] cli_wrapper_input` and `[TOKEN-DEBUG] cli_wrapper_final`

### Debug Log Format

All logs follow the pattern:
```
[TOKEN-DEBUG] {stage}: length={N}, parts={N}, suffix_len={N}
[TOKEN-DEBUG] {stage} format: {uuid_prefix}...:[REDACTED]:{full_suffix}
```

Example:
```
[TOKEN-DEBUG] oauth_bridge_generation: length=150, parts=3, suffix_len=25
[TOKEN-DEBUG] oauth_bridge format: c8e06919...:[REDACTED]:mittwald_oauth_xyz
```

### Next Steps to Execute Investigation

**Option 1: Deploy to Fly.io (Recommended)**
```bash
# Trigger GitHub Actions deployment
git push origin 009-fix-token-truncation
# Monitor Fly.io logs after deployment
flyctl logs -a mittwald-mcp-fly2 --no-tail | grep "\[TOKEN-DEBUG\]"
```

**Option 2: Local OAuth Test (Requires Setup)**
```bash
# Set required environment variables
export AS_DCR_TOKEN="your-dcr-token"
export MCP_BASE="http://localhost:3000"
export AS_BASE="https://mittwald-oauth-server.fly.dev"

# Run OAuth flow
tsx scripts/e2e-mcp-oauth.ts 2>&1 | grep "\[TOKEN-DEBUG\]"
```

**Option 3: Check Existing Sessions**
If there's an active OAuth session, trigger any MCP tool call and check server logs for `[TOKEN-DEBUG]` output.

## Findings

*To be filled after test execution*

### Truncation Point Identified

**Stage**: [TBD - OAuth Bridge | Session Storage | Retrieval | CLI Wrapper]

**File**: [TBD - exact file path]

**Line**: [TBD - exact line number]

**Root Cause**: [TBD - describe the issue]

**Evidence**:
```
[Paste relevant logs here]
```

### Root Cause Analysis

**Why Truncation Occurs**: [TBD]

**Code Context**: [TBD - show relevant code snippet]

**Fix Approach**: [TBD - describe surgical fix]

## Surgical Fix Design

*To be filled after root cause identified*

### Fix Location

**File**: [TBD]
**Function**: [TBD]
**Line**: [TBD]

### Fix Implementation

**Before**:
```typescript
[TBD - show problematic code]
```

**After**:
```typescript
[TBD - show fixed code]
```

### Fix Rationale

[TBD - explain why this fix resolves the issue]

### Verification Plan

1. Run failing test: `access-001-create-sftp-user`
2. Verify token maintains full format
3. Verify test passes (no 403 error)
4. Run full test suite (31 tests)
5. Verify pass rate improves from 19.4% to 40-50%

## Alternative Causes Investigated

*Document other potential causes ruled out during investigation*

### Hypothesis 1: [TBD]
- **Evidence**: [TBD]
- **Conclusion**: Ruled out because [TBD]

### Hypothesis 2: [TBD]
- **Evidence**: [TBD]
- **Conclusion**: Ruled out because [TBD]

## References

- Sprint 008 Analysis: `/Users/robert/Code/mittwald-mcp/tests/functional/SPRINT-008-COMPREHENSIVE-ANALYSIS.md`
- Session Logs: `/Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/`
- Test Execution: `access-001-create-sftp-user-2025-12-09T21-33-52.jsonl`
- Error Pattern: `403 Forbidden - PermissionDenied - access denied; verdict: abstain`

## Conclusion

*To be completed after investigation*

**Summary**: [One paragraph describing what was found, where truncation occurs, and how it will be fixed]

**Confidence Level**: High | Medium | Low

**Next Steps**:
1. Implement surgical fix
2. Add lightweight validation
3. Create regression tests
4. Verify fix resolves issue
