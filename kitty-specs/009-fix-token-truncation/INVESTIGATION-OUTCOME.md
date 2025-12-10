# Sprint 009 Investigation Outcome - CRITICAL CLARIFICATION

**Feature**: 009-fix-token-truncation
**Date**: 2025-12-10

---

## ⚠️ READ THIS FIRST

**If you're reading the 009-fix-token-truncation documentation, understand this:**

### What the Feature Name Suggests (WRONG)
The feature is named "fix-token-truncation" which implies tokens were being truncated.

### What Actually Happened (CORRECT)
**NO TRUNCATION EXISTS.** The bug was **OAuth scope configuration**, not token truncation.

---

## The Complete Journey

### Phase 1: Initial Hypothesis (INCORRECT)
**Believed**: Tokens truncated from `uuid:secret:mittwald_oauth_xyz` to `uuid:secret:mittwald_o`
**Evidence**: Session logs showed tokens ending at `mittwald_o` with 403 errors
**Assumption**: The suffix was incomplete/truncated

### Phase 2: Systematic Investigation (WP01)
**Method**: Instrumented 4 pipeline stages with [TOKEN-DEBUG] logging
- OAuth Bridge token generation
- Session storage (Redis) input/output
- JWT extraction in MCP server
- CLI wrapper invocation

### Phase 3: Discovery (BREAKTHROUGH)
**Deployed instrumented code to Fly.io and captured live OAuth flow**

**Finding 1**: Raw HTTP response from Mittwald shows `"access_token":"...:mittwald_o"`
- Token is 91 characters, suffix is 10 characters
- This is what Mittwald SENDS, not what we truncated

**Finding 2**: Mittwald token format documentation confirms short suffixes
- API tokens: `uuid:secret:mittwald_a` (10-char suffix)
- OAuth tokens: `uuid:secret:mittwald_o` (10-char suffix)
- **Short suffixes are BY DESIGN, not truncation**

### Phase 4: Validation Testing
**Tested manual `mw` CLI with API token (`mittwald_a`)**:
- ✅ SUCCESS - created SFTP user
- ✅ Has same permissions as OAuth user
- ✅ Same 91-character length

**Tested MCP tools with OAuth token (`mittwald_o`)**:
- ✅ `user_get`, `project_list`, `app_list` - SUCCESS
- ❌ `database_list`, `backup_list`, `sftp_user_create` - 403 FAIL

**Pattern identified**: Not all operations fail, only specific resource types!

### Phase 5: Root Cause Identification (ACTUAL BUG)

**Found the bug**: `packages/oauth-bridge/src/routes/authorize.ts:133`

```typescript
// BUG: Hardcoded to 4 default scopes
const mittwaldScopeString = MITTWALD_SCOPE_STRING;
// Always sends: "user:read customer:read project:read app:read"
```

**Configuration**: `config/mittwald-scopes.json`
- Supports 46 scopes (database:read, backup:read, sshuser:write, etc.)
- But only forwards 4 default scopes to Mittwald
- Client requests are VALIDATED but IGNORED

**Impact**:
- Operations needing default scopes (user, customer, project, app): ✅ Work
- Operations needing other scopes (database, backup, sftp, domain): ❌ 403 errors

### Phase 6: The Fix

**Changed**: `packages/oauth-bridge/src/routes/authorize.ts:133`

```typescript
// BEFORE:
const mittwaldScopeString = MITTWALD_SCOPE_STRING; // Hardcoded defaults

// AFTER:
const mittwaldScopeString = buildScopeString(filterUpstreamScopes(effectiveScopes));
// Forwards client's actual requested scopes
```

**Expected Impact**: Test pass rate 19.4% → 45-50%

---

## Why This Documentation Matters

### For Future Readers

1. **The feature name is misleading** - it's about scopes, not truncation
2. **The initial hypothesis was wrong** - investigation disproved it
3. **The actual bug was scope configuration** - one-line fix in authorize.ts
4. **OAuth tokens work perfectly** - format is correct, CLI compatibility is fine

### For LLMs Reading This Codebase

**DO NOT assume**:
- ❌ Tokens are/were truncated
- ❌ `mittwald_o` is an incomplete suffix
- ❌ OAuth tokens are incompatible with `mw` CLI
- ❌ There's a string manipulation bug in the pipeline

**DO understand**:
- ✅ `mittwald_o` is Mittwald's correct OAuth token format (10-char suffix by design)
- ✅ `mittwald_a` is Mittwald's API token format (also 10-char suffix)
- ✅ Both token types work with CLI when proper scopes are present
- ✅ The bug was scope configuration, not token format/truncation
- ✅ Fix: Forward client-requested scopes instead of hardcoded defaults

---

## Key Artifacts

1. **Investigation Evidence**: `research.md`
   - Complete pipeline instrumentation results
   - Raw HTTP responses from Mittwald API
   - Token format verification
   - Scope testing results

2. **Executive Summary**: `SPRINT-009-TOKEN-INVESTIGATION-FINDINGS.md`
   - High-level findings
   - Before/after understanding
   - Impact on Sprint 008 analysis

3. **The Fix**: Git commit `eb260bb`
   - One-line change in authorize.ts
   - Forwards actual scopes instead of defaults

4. **This Document**: `INVESTIGATION-OUTCOME.md`
   - Clarifies what actually happened
   - Prevents misinterpretation of feature name

---

## Lessons Learned

### What Worked Well
- ✅ Systematic instrumentation approach
- ✅ Runtime testing on Fly.io caught the truth
- ✅ Comparative testing (CLI vs MCP) identified scope issue
- ✅ Evidence-based investigation

### What Was Misleading
- ❌ Assumed "truncation" without verifying actual token format
- ❌ Didn't check Mittwald's documentation for token format
- ❌ Didn't test different resource types to identify scope pattern

### Key Takeaway
**Validate assumptions with evidence before building fixes.** The "truncation" was never actually verified against Mittwald's API documentation or token format design.
