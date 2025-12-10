# Quick Start: Token Truncation Debugging

**Feature**: 009-fix-token-truncation
**Purpose**: Quick reference for investigating and validating Mittwald access tokens

## Token Format Reference

### Expected Format

```
{uuid}:{secret}:{provider_suffix}
```

**Example**:
```
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_xyz
```

**Parts**:
- UUID: 36 characters (hyphenated)
- Secret: 40-60 characters (base64-like)
- Suffix: 15-30 characters (typically `mittwald_oauth_*`)

---

## Quick Checks

### 1. Check Token in Session

```bash
# From MCP server code or test harness
node -e "
const { sessionManager } = require('./dist/server/session-manager.js');
sessionManager.getSession('session-id').then(s => {
  const token = s?.mittwaldAccessToken;
  console.log('Length:', token?.length);
  console.log('Parts:', token?.split(':').length);
  console.log('Suffix:', token?.split(':')[2]);
});
"
```

### 2. Validate Token Format

```typescript
import { validateMittwaldToken } from './src/utils/token-validation';

const result = validateMittwaldToken(token);
console.log('Valid:', result.valid);
if (!result.valid) {
  console.log('Error:', result.error);
}
```

### 3. Test CLI with Token

```bash
# Use your authenticated mw CLI
mw sftp-user list --project-id p-ptwfms

# Test specific token
mw sftp-user list --project-id p-ptwfms --token "your:token:here"
```

---

## Investigation Workflow

### Step 1: Add Instrumentation

Add to each pipeline file:

```typescript
console.debug(`[TOKEN-DEBUG] ${stageName}: length=${token?.length}, parts=${token?.split(':').length}, suffix=${token?.split(':')[2]?.length}chars`);
```

**Locations**:
1. `packages/oauth-bridge/src/routes/token.ts` - after generation
2. `packages/oauth-bridge/src/state/state-store.ts` - before/after storage
3. `src/server/session-manager.ts` - after retrieval
4. `src/utils/cli-wrapper.ts` - before CLI invocation

### Step 2: Run Test

```bash
cd tests/functional
npm test -- --use-case access-001-create-sftp-user
```

### Step 3: Collect Logs

```bash
# Filter for token debug logs
grep "\[TOKEN-DEBUG\]" /path/to/logs

# Expected output showing truncation
[TOKEN-DEBUG] oauth_bridge: length=150, parts=3, suffix=20chars
[TOKEN-DEBUG] session_storage: length=150, parts=3, suffix=20chars
[TOKEN-DEBUG] session_retrieval: length=100, parts=3, suffix=10chars  ← TRUNCATED!
[TOKEN-DEBUG] cli_wrapper: length=100, parts=3, suffix=10chars
```

### Step 4: Identify Truncation Point

Look for first stage where length decreases.

### Step 5: Apply Fix

1. Navigate to identified file
2. Find root cause (string slicing, buffer limit, etc.)
3. Apply surgical fix
4. Test fix resolves issue

### Step 6: Cleanup

Remove all `[TOKEN-DEBUG]` logging added during investigation.

---

## Common Issues

### Issue: 403 "access denied; verdict: abstain"

**Symptom**: MCP tool calls fail with permission denied

**Check**:
```typescript
const token = session?.mittwaldAccessToken;
console.log('Token parts:', token?.split(':').length); // Should be 3
console.log('Suffix:', token?.split(':')[2]); // Should be "mittwald_oauth_*", not "mittwald_o"
```

**If suffix truncated**: Token truncation bug
**If suffix OK**: Actual permission issue (check Mittwald account)

### Issue: Token Not Found

**Symptom**: Session has no `mittwaldAccessToken`

**Check**:
```typescript
const session = await sessionManager.getSession(sessionId);
console.log('Has token:', !!session?.mittwaldAccessToken);
```

**If missing**: OAuth flow didn't complete or session expired
**If present**: Proceed with format validation

### Issue: CLI Returns 401 (Not 403)

**Symptom**: Unauthorized instead of Forbidden

**Difference**:
- **401**: Token invalid/expired (semantic issue)
- **403**: Token valid but insufficient permissions

**Check**: Token format is correct, but token itself is expired/invalid

---

## Validation API

### validateMittwaldToken()

```typescript
import { validateMittwaldToken } from './src/utils/token-validation';

const result = validateMittwaldToken(token);

// Result structure
{
  valid: boolean,
  error?: string,
  expectedFormat: string,
  actualFormat: string
}
```

**Returns**:
- `valid: true` - Token has correct structure
- `valid: false` - Token is malformed (check error field)

**Note**: Does NOT validate token semantics (expiration, signature, permissions)

### redactToken()

```typescript
import { redactToken } from './src/utils/token-validation';

const safe = redactToken(token);
console.log(safe); // "c8e06919...:[REDACTED]:mittwald_oauth_xyz"
```

**Use**: Safe logging of tokens in error messages and debug output

---

## Testing Quick Reference

### Run Unit Tests

```bash
npm test tests/unit/token-validation.test.ts
```

### Run Integration Test

```bash
npm test tests/integration/token-flow.test.ts
```

### Run Full Functional Suite

```bash
cd tests/functional
npm test -- --suite 007 --use-cases all
```

**Expected After Fix**:
- Pass rate: 40-50% (up from 19.4%)
- Zero 403 "verdict: abstain" errors for operations with proper user permissions

---

## Pipeline Stage Reference

### Stage 1: OAuth Bridge

**File**: `packages/oauth-bridge/src/routes/token.ts`
**Action**: Generates token from Mittwald OAuth response
**Check**: Token format at generation

### Stage 2: Session Storage

**Files**:
- `packages/oauth-bridge/src/state/state-store.ts` (bridge side)
- `src/server/session-manager.ts` (MCP side)

**Action**: Stores token in session
**Check**: Token before storage = token after retrieval

### Stage 3: Session Retrieval

**File**: `src/server/session-manager.ts`, `src/server/oauth-middleware.ts`
**Action**: Retrieves token for use
**Check**: Retrieved token format intact

### Stage 4: CLI Wrapper

**File**: `src/utils/cli-wrapper.ts`
**Action**: Passes token to mw CLI
**Check**: Token in CLI arguments matches retrieved token

---

## Success Verification

### After Fix Applied

1. ✅ Token maintains full format through all stages
2. ✅ Test `access-001-create-sftp-user` passes
3. ✅ No truncation warnings in logs
4. ✅ Pass rate improves to 40-50%

### Quick Verification Commands

```bash
# Run single failing test
cd tests/functional
npm test -- --use-case access-001-create-sftp-user

# Check for validation warnings
grep "\[Token Validation\]" logs/*.log

# Run full suite and check pass rate
npm test -- --suite 007 --use-cases all | grep "passed:"
```

---

## Support

**Spec**: [spec.md](spec.md)
**Research**: [research.md](research.md)
**Data Model**: [data-model.md](data-model.md)
**Contract**: [contracts/token-validation.md](contracts/token-validation.md)
