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

## Static Analysis Findings (2025-12-10)

### Evidence Review

**Source**: Session log `access-001-create-sftp-user-2025-12-09T21-33-52.jsonl`

**Truncated Token Observed**:
```
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_o
```

**Token Structure**:
- UUID: `c8e06919-aa0c-447e-b57f-c1508f64a76f` (36 chars)
- Secret: `-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE` (44 chars)
- Suffix: `mittwald_o` (10 chars)
- **Total**: 92 visible chars (expected ~100 with full suffix)

**Truncation Pattern**: Token consistently ends at `:mittwald_o` instead of full suffix like `:mittwald_oauth_xyz`

### Static Code Analysis Results

**Files Analyzed**:
1. ✅ `packages/oauth-bridge/src/services/mittwald.ts` - No truncation found
2. ✅ `packages/oauth-bridge/src/services/bridge-tokens.ts` - Full object embedded in JWT
3. ✅ `src/server/oauth-middleware.ts` - No truncation in JWT extraction
4. ✅ `src/server/session-manager.ts` - No truncation in Redis storage/retrieval
5. ✅ `src/utils/cli-wrapper.ts` - No truncation before CLI invocation
6. ✅ Separate oauth bridge repo `~/Code/mittwald-oauth/mittwald-oauth` - No explicit 100-char truncation found

**Libraries Checked**:
- `jose` (v6.1.2): No documented payload size limits
- `ioredis`: No default string length limits found
- `pino` / `winston`: No maxStringLength configuration found

### Hypotheses Under Investigation

**Hypothesis 1: Runtime Serialization Issue**
- **Theory**: pino/winston logger serialization might have implicit limits affecting actual values
- **Likelihood**: Low (loggers shouldn't mutate original objects)
- **Test Needed**: Run instrumented code to capture actual token lengths at each stage

**Hypothesis 2: JWT Payload Limit**
- **Theory**: `jose` library or JWT spec might have undocumented limits
- **Likelihood**: Low (JWTs can be several KB)
- **Test Needed**: Decode actual JWT to check if Mittwald token inside is truncated

**Hypothesis 3: Redis/ioredis Configuration**
- **Theory**: Redis string value limit or ioredis default configuration
- **Likelihood**: Medium (Redis has no default string limits, but could be configured)
- **Test Needed**: Test session storage round-trip with long tokens

**Hypothesis 4: Environment/Runtime Configuration**
- **Theory**: Fly.io or Node.js environment variable affecting string serialization
- **Likelihood**: Medium (could be util.inspect defaults or environment settings)
- **Test Needed**: Deploy instrumented code to Fly.io and check runtime logs

## Findings

*Requires test execution with instrumentation to pinpoint exact location*

### Truncation Point Identified

**Status**: ✅ RESOLVED - No truncation bug exists

**Stage**: Mittwald OAuth API (source)

**File**: N/A - This is Mittwald's API response format, not our code

**Root Cause**: **MISCONCEPTION - "mittwald_o" is the CORRECT and COMPLETE suffix for OAuth tokens**

**Evidence from Fly.io logs (2025-12-10 12:19:01Z)**:
```
[TOKEN-DEBUG] mittwald_api_response_preview: {"access_token":"90ed91fa-b39d-4d8e-85e3-d65c0f3b2f55:gSIlFxf5OqxqcvsSlZunanIxE9FZJBu2kXYlXRlxqAc:mittwald_o"
[TOKEN-DEBUG] parsed_access_token_length: 91
[TOKEN-DEBUG] parsed_access_token_value: 90ed91fa-b39d-4d8e-85e3-d65c0f3b2f55:gSIlFxf5OqxqcvsSlZunanIxE9FZJBu2kXYlXRlxqAc:mittwald_o
[TOKEN-DEBUG] oauth_bridge_generation: length=91, parts=3, suffix_len=10
[TOKEN-DEBUG] oauth_bridge format: 90ed91fa...:[REDACTED]:mittwald_o
```

**Mittwald Token Format** (per [API docs](https://developer.mittwald.de/docs/v2/api/intro/)):
- Format: `{UUID}:{description}:{mittwald_type}`
- API tokens: `mittwald_a` (short suffix)
- OAuth tokens: `mittwald_o` (short suffix)
- **Short suffixes are BY DESIGN, not truncation**

### Root Cause Analysis

**Why "Truncation" Was Misdiagnosed**:

The original assumption was that tokens were being truncated from a longer format like `mittwald_oauth_xyz` to `mittwald_o`. Investigation revealed this is FALSE.

**Actual Token Format** (verified via instrumentation):
- OAuth tokens from Mittwald API: `{uuid}:{secret}:mittwald_o` (91 chars, suffix=10)
- This matches Mittwald's documented format: `{uuid}:{description}:{mittwald_type}`
- Known suffixes: `mittwald_a` (API), `mittwald_o` (OAuth)
- **Short suffixes are intentional design, not truncation**

**Code Context**:
```typescript
// packages/oauth-bridge/src/services/mittwald.ts:39-43
const text = await response.text();  // Full response from Mittwald
payload = JSON.parse(text);          // Correct parsing
// payload.access_token = "uuid:secret:mittwald_o" ← This IS the full token!
```

**Fix Approach**: **NO FIX NEEDED for truncation** - tokens are correct format.

**ACTUAL Root Cause Identified**: 🎯

**The `mw` CLI rejects OAuth tokens (`mittwald_o`) - it only accepts API tokens (`mittwald_a`)!**

**Evidence**:
1. ✅ Manual `mw` CLI with `mittwald_a` token: **SUCCESS** (created SFTP user 0fa500a5-d742-4d40-8a78-5b6c26e1e8cc)
2. ❌ MCP tools with `mittwald_o` token: **FAILS** (403 "verdict: abstain")
3. ✅ Both token types are 91 chars with 10-char suffixes (format is identical)
4. ✅ User has proper permissions (verified via successful CLI operations)

**Conclusion**: Token format is correct, but **token TYPE is incompatible with CLI**.

## Surgical Fix Design

### Fix Approaches (3 Options)

**Option 1: Use Mittwald TypeScript SDK Instead of CLI** (RECOMMENDED)
- **Location**: All MCP tool handlers in `src/handlers/tools/mittwald-cli/`
- **Change**: Replace CLI invocations with direct SDK calls
- **Benefit**: OAuth tokens work natively with SDK
- **Effort**: Medium (rewrite ~170 tool handlers)
- **Example**:
  ```typescript
  // Before: CLI-based
  await executeCli('mw', ['sftp-user', 'create', '--project-id', projectId, ...]);

  // After: SDK-based
  const client = new MittwaldAPIV2Client.newWithToken(oauthToken);
  await client.sshsftpUser.createSftpUser({ projectId, ...});
  ```

**Option 2: Exchange OAuth Token for API Token**
- **Location**: `src/server/session-manager.ts` or `src/utils/cli-wrapper.ts`
- **Change**: Add token exchange before CLI invocation
- **Benefit**: Minimal code changes, CLI tools work as-is
- **Blocker**: **Mittwald may not provide OAuth-to-API token exchange endpoint**
- **Requires**: Check if Mittwald API supports token exchange

**Option 3: Use Direct API Tokens Instead of OAuth**
- **Location**: Authentication flow in MCP server
- **Change**: Request API tokens during OAuth callback
- **Benefit**: Simple, guaranteed to work
- **Drawback**: May bypass OAuth security model
- **Requires**: Mittwald OAuth flow to return `mittwald_a` tokens

### Recommended Fix: Option 1 (SDK Migration)

**File**: Start with `src/handlers/tools/mittwald-cli/sftp/user-create-cli.ts`

**Current** (CLI-based):
```typescript
await invokeCliTool({
  toolName: 'mittwald_sftp_user_create',
  argv: ['sftp-user', 'create', '--description', desc, ...],
  sessionId
});
```

**Fixed** (SDK-based):
```typescript
import { getMittwaldClient } from '@/services/mittwald/mittwald-client';

const client = getMittwaldClient(session.mittwaldAccessToken); // OAuth token works!
const result = await client.sshsftpUser.createSftpUser({
  projectId,
  description,
  directories,
  ...
});
```

### Verification Plan

1. ✅ Verify CLI requires `mittwald_a` tokens (CONFIRMED via testing)
2. ✅ Verify OAuth returns `mittwald_o` tokens (CONFIRMED via instrumentation)
3. ⏭️ Test SDK with OAuth tokens to confirm compatibility
4. ⏭️ Migrate one tool handler (sftp-user-create) as proof of concept
5. ⏭️ Verify migrated tool works with OAuth tokens
6. ⏭️ Measure test pass rate improvement

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

**Summary**: Comprehensive instrumentation of the token pipeline revealed that **no truncation bug exists**. Mittwald's OAuth API intentionally returns tokens with short suffix `mittwald_o` (10 characters) as part of their token format design: `{uuid}:{secret}:{mittwald_type}`. This matches their documented API token format where suffixes are single-letter or short codes (`mittwald_a` for API, `mittwald_o` for OAuth). The 403 "verdict: abstain" errors affecting 60% of tests are NOT caused by malformed tokens, but likely by scope/permission mismatches between OAuth tokens and CLI operations.

**Confidence Level**: **High** - Verified via:
- ✅ Raw HTTP response from Mittwald API showing complete JSON with `mittwald_o` suffix
- ✅ Consistent 91-char length across multiple OAuth flows
- ✅ Mittwald API documentation confirming short suffix design pattern
- ✅ No code found that truncates tokens in our pipeline

**Revised Next Steps**:
1. ~~Implement surgical fix for truncation~~ **NOT NEEDED - no truncation**
2. **Investigate scope/permission configuration** for OAuth vs CLI tokens
3. **Test OAuth tokens with read-only operations** to verify token validity
4. **Review Mittwald OAuth client configuration** for proper permission grants
5. **Document correct token format** to prevent future misdiagnosis
