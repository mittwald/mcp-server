# Sprint 009: OAuth Scope Configuration Fix

## ⚠️ IMPORTANT: Feature Name vs Actual Issue

**Feature directory name**: `009-fix-token-truncation`
**Actual issue fixed**: OAuth scope configuration bug

**There was NO token truncation.** Read this document before proceeding.

---

## TL;DR - What Was Actually Fixed

**Bug**: OAuth bridge forwarded only 4 hardcoded scopes to Mittwald, ignoring client requests
**File**: `packages/oauth-bridge/src/routes/authorize.ts` line 133
**Fix**: One line change - forward filtered client scopes instead of defaults
**Impact**: Fixes 403 errors for database, backup, SFTP, domain operations

---

## Why The Confusion?

### Initial Observation
Tests showed tokens like: `uuid:secret:mittwald_o` causing 403 "verdict: abstain" errors

### Initial Hypothesis (WRONG)
Assumed tokens were truncated from longer format like `mittwald_oauth_xyz` → `mittwald_o`

### Investigation Proved (CORRECT)
- `mittwald_o` is Mittwald's **correct and complete** OAuth token format (10-char suffix by design)
- `mittwald_a` is Mittwald's API token format (also 10-char suffix)
- Both are 91 characters total - **no truncation occurs**
- 403 errors from **missing scopes**, not bad token format

---

## Investigation Timeline

1. **Added instrumentation** to 4 pipeline stages (OAuth Bridge, Session, JWT, CLI)
2. **Deployed to Fly.io** and triggered live OAuth flow
3. **Captured evidence**: Raw Mittwald API response shows `mittwald_o` is complete
4. **Tested token types**: CLI with `mittwald_a` works, MCP with `mittwald_o` works for some operations
5. **Identified pattern**: Operations with default scopes work, others fail
6. **Found root cause**: `authorize.ts:133` hardcodes 4 scopes instead of forwarding client requests
7. **Implemented fix**: One-line change to forward actual scopes
8. **Verified**: Token format correct, OAuth tokens compatible with CLI when scopes present

---

## Critical Documents (Read in Order)

1. **THIS FILE** - Overview and clarification
2. **`INVESTIGATION-OUTCOME.md`** - Detailed investigation journey
3. **`research.md`** - Technical evidence and findings
4. **`SPRINT-009-TOKEN-INVESTIGATION-FINDINGS.md`** - Executive summary
5. **`spec.md`** - Original spec (hypothesis later disproven)
6. **`tasks.md`** - Work packages (WP02+ need revision based on findings)

---

## Key Files Modified

### The Fix (Production)
- `packages/oauth-bridge/src/routes/authorize.ts` - Forward actual scopes

### Investigation Artifacts (Temporary - to be removed)
- `packages/oauth-bridge/src/services/mittwald.ts` - Debug logging
- `src/server/session-manager.ts` - Debug logging
- `src/server/oauth-middleware.ts` - Debug logging
- `src/utils/cli-wrapper.ts` - Debug logging

---

## Test Results Summary

### Before Fix (4 default scopes only)
| Resource | Has Scope? | Result |
|----------|------------|--------|
| User operations | ✅ user:read | ✅ SUCCESS |
| Project operations | ✅ project:read | ✅ SUCCESS |
| App operations | ✅ app:read | ✅ SUCCESS |
| Database operations | ❌ missing database:read | ❌ 403 FAIL |
| Backup operations | ❌ missing backup:read | ❌ 403 FAIL |
| SFTP operations | ❌ missing sshuser:write | ❌ 403 FAIL |

### After Fix (client-requested scopes forwarded)
All operations should work when client requests appropriate scopes.

**Expected improvement**: Test pass rate 19.4% → 45-50%

---

## For Future Developers

### If you see "truncation" mentioned in docs/code:
- This refers to the **incorrect initial hypothesis**
- No truncation bug exists or existed
- Keep mentions for historical context but understand they were disproven

### The actual bug was:
```typescript
// packages/oauth-bridge/src/routes/authorize.ts:133
// BEFORE (bug):
const mittwaldScopeString = MITTWALD_SCOPE_STRING; // 4 hardcoded scopes

// AFTER (fix):
const mittwaldScopeString = buildScopeString(filterUpstreamScopes(effectiveScopes));
```

### To understand OAuth token format:
- Format: `{uuid}:{secret}:{mittwald_type}`
- OAuth: `mittwald_o` (10 chars)
- API: `mittwald_a` (10 chars)
- Length: ~91 characters
- **This is correct - not truncated**

---

## References

- [Mittwald API Documentation](https://developer.mittwald.de/docs/v2/api/intro/)
- [Mittwald CLI Documentation](https://developer.mittwald.de/docs/v2/cli/usage/intro/)
- OAuth Bridge: packages/oauth-bridge/
- MCP Server: src/
- Test Suite: tests/functional/

---

**Last Updated**: 2025-12-10
**Status**: Fix deployed, awaiting verification
**Next**: Test with fresh OAuth token containing all scopes
