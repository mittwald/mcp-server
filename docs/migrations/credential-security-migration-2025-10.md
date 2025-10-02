# Credential Security Migration Guide

**Target**: All existing tools that handle passwords, tokens, or API keys
**Deadline**: 2025-11-01
**Priority**: 🔥 HIGH - Security issue

## Scope

This migration applies to tools that:
- Generate passwords or tokens
- Update passwords or tokens
- Display credential values in responses
- Log commands containing credentials

## Affected Tools

Run this command to identify tools:
```bash
git grep -l "password\|token\|api-key\|secret" src/handlers/ | \
  grep -v user-create-cli.ts | \
  grep -v user-update-cli.ts
```

## Migration Steps

### Step 1: Update Password Generation

**Before**:
```typescript
const password = args.password || Math.random().toString(36).slice(2);
```

**After**:
```typescript
import { generateSecurePassword } from '../../utils/credential-generator.js';

const passwordGenerated = !args.password;
const password = args.password ?? generateSecurePassword({ length: 24 }).value;
```

### Step 2: Update Response Building

**Before**:
```typescript
return formatToolResponse('success', message, {
  userId,
  password: password  // ❌ Always returned
}, {
  command: result.meta.command  // ❌ Contains --password secret
});
```

**After**:
```typescript
import { buildSecureToolResponse } from '../../utils/credential-response.js';

return buildSecureToolResponse('success', message, {
  userId,
  password: passwordGenerated ? password : undefined,  // ✅ Only if generated
  passwordGenerated
}, {
  command: result.meta.command,  // ✅ Auto-redacted
  durationMs: result.meta.durationMs
});
```

### Step 3: Update Tests

Add credential leakage validation:
```typescript
it('does not leak password in response metadata', async () => {
  const response = await handleTool({ password: 'test-secret' });
  const payload = JSON.parse(response.content[0]?.text ?? '{}');

  expect(payload.meta.command).not.toContain('test-secret');
  expect(payload.meta.command).toContain('[REDACTED]');
});
```

## Verification

After migration:
```bash
npm run test:security  # New test suite (Task S1.6)
```

## Rollout Plan

- **Week 1**: High-priority tools (user management, API tokens)
- **Week 2**: Medium-priority tools (database credentials)
- **Week 3**: Low-priority tools (SSH keys, certificates)
- **Week 4**: Verification and cleanup

---

**Questions?** See `docs/CREDENTIAL-SECURITY.md`
