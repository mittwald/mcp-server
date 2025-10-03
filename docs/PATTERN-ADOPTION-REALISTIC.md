# Pattern Adoption Plan - Realistic Scope

**Date**: 2025-10-03
**Status**: READY FOR APPROVAL
**Replaces**: PROJECT-WIDE-PATTERN-ADOPTION.md (archived)
**Based On**: Ground-truth audit results

---

## Executive Summary

After conducting systematic audits of the codebase and CLI capabilities:

**Scope**: Implement C4 destructive operation safety pattern for 16 tools
**Effort**: 4.0 days
**Deliverable**: 100% C4 compliance across all destructive operations

**No work needed**:
- ✅ C6 dependency detection (volume only - already done)
- ✅ C2 array parameters (all 3 tools already correct)
- ❌ Project-wide dependency detection (infeasible - CLI doesn't expose relationships)

---

## Audit Findings

### Destructive Tools Inventory

**Total destructive tools**: 20

**C4 Fully Compliant** (4 tools - 20%):
1. ✅ org/delete-cli.ts
2. ✅ org/membership-revoke-cli.ts (fixed by user)
3. ✅ user/api-token/revoke-cli.ts (fixed by user)
4. ✅ volume/delete-cli.ts

**Non-Compliant** (16 tools - 80%):
1. backup/delete-cli.ts
2. backup/schedule-delete-cli.ts
3. container/delete-cli.ts
4. cronjob/delete-cli.ts
5. database/mysql/delete-cli.ts
6. database/mysql/user-delete-cli.ts
7. domain/virtualhost-delete-cli.ts
8. mail/address/delete-cli.ts
9. mail/deliverybox/delete-cli.ts
10. org/invite-revoke-cli.ts
11. project/delete-cli.ts
12. registry/delete-cli.ts
13. sftp/user-delete-cli.ts
14. ssh/user-delete-cli.ts
15. stack/delete-cli.ts
16. user/ssh-key/delete-cli.ts

---

## C4 Pattern Implementation

### Pattern Requirements (from Agent C4)

**Reference**: `docs/agent-reviews/AGENT-C4-REVIEW.md`

All destructive tools MUST implement:

1. **Confirm Flag in Schema**
```typescript
// src/constants/tool/mittwald-cli/<tool>-cli.ts
properties: {
  // ... other properties ...
  confirm: {
    type: 'boolean',
    description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
  }
},
required: ['<resourceId>', 'confirm']
```

2. **Confirm Validation in Handler**
```typescript
// src/handlers/tools/mittwald-cli/<tool>-cli.ts
export const handleDeleteCli = async (args, context) => {
  // C4 Pattern: Confirm validation (MUST be first check)
  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  // ... other validations ...
}
```

3. **Audit Logging with Context**
```typescript
// C4 Pattern: Audit logging (BEFORE CLI execution)
logger.warn('[ResourceDelete] Destructive operation attempted', {
  resourceId: args.resourceId,
  sessionId: context?.sessionId,
  userId: context?.userId,
});

// ... execute CLI command ...
```

---

## Implementation Plan

### Phase 1: Infrastructure Tools (2 days)

**Day 1** (4 hours):
1. backup/delete-cli.ts
2. backup/schedule-delete-cli.ts
3. cronjob/delete-cli.ts
4. mail/address/delete-cli.ts
5. mail/deliverybox/delete-cli.ts
6. domain/virtualhost-delete-cli.ts

**Testing**: Run tests for each, verify confirm flag works

**Day 2** (4 hours):
7. sftp/user-delete-cli.ts
8. ssh/user-delete-cli.ts
9. user/ssh-key/delete-cli.ts
10. org/invite-revoke-cli.ts

**Testing**: Run tests for each, verify confirm flag works

---

### Phase 2: Core Resources (2 days)

**Day 3** (4 hours):
11. container/delete-cli.ts
12. registry/delete-cli.ts
13. stack/delete-cli.ts

**Testing**: Run tests, verify confirm flag works

**Day 4** (4 hours):
14. database/mysql/delete-cli.ts
15. database/mysql/user-delete-cli.ts
16. project/delete-cli.ts

**Testing**: Run full test suite, verify all 20 tools compliant

---

## Implementation Template

For each tool, follow this checklist:

### Step 1: Update Tool Schema

**File**: `src/constants/tool/mittwald-cli/<domain>/<tool>-cli.ts`

```diff
 const tool: Tool = {
   name: 'mittwald_<resource>_delete',
   inputSchema: {
     type: 'object',
     properties: {
       resourceId: { type: 'string', description: '...' },
+      confirm: {
+        type: 'boolean',
+        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
+      }
     },
-    required: ['resourceId']
+    required: ['resourceId', 'confirm']
   }
 };
```

### Step 2: Update Args Interface

**File**: `src/handlers/tools/mittwald-cli/<domain>/<tool>-cli.ts`

```diff
 interface ResourceDeleteArgs {
   resourceId: string;
   projectId?: string;
+  confirm?: boolean;
 }
```

### Step 3: Add Confirm Validation

**File**: `src/handlers/tools/mittwald-cli/<domain>/<tool>-cli.ts`

```diff
 export const handleResourceDeleteCli = async (args, context) => {
+  // C4 Pattern: Confirm validation
+  if (args.confirm !== true) {
+    return formatToolResponse(
+      'error',
+      'Deletion requires confirm=true. This operation is destructive and cannot be undone.'
+    );
+  }
+
   // ... existing validations ...
```

### Step 4: Add/Update Audit Logging

**File**: `src/handlers/tools/mittwald-cli/<domain>/<tool>-cli.ts`

```diff
+  // C4 Pattern: Audit logging
+  logger.warn('[ResourceDelete] Destructive operation attempted', {
+    resourceId: args.resourceId,
+    sessionId: context?.sessionId,
+    userId: context?.userId,
+  });
+
   const argv = ['resource', 'delete', args.resourceId, '--quiet'];
```

### Step 5: Update Tests

**File**: `tests/unit/tools/<domain>/<tool>.test.ts`

```diff
+  it('requires confirm flag for deletion', async () => {
+    const response = await handleResourceDeleteCli({
+      resourceId: 'res-123',
+      projectId: 'p-123'
+      // Missing confirm: true
+    });
+    const payload = parseResponse(response);
+
+    expect(payload.status).toBe('error');
+    expect(payload.message).toContain('confirm=true');
+    expect(payload.message).toContain('destructive');
+    expect(mockInvokeCliTool).not.toHaveBeenCalled();
+  });

   it('deletes resource successfully', async () => {
     // ... mocks ...
     const response = await handleResourceDeleteCli({
       resourceId: 'res-123',
       projectId: 'p-123',
+      confirm: true
     });
     // ... assertions ...
   });
```

### Step 6: Update Documentation

**File**: `docs/tool-examples/<domain>.md` (if exists)

```diff
 ### Delete Resource
 ```json
 {
   "name": "mittwald_<resource>_delete",
   "arguments": {
     "resourceId": "res-123",
-    "projectId": "p-123"
+    "projectId": "p-123",
+    "confirm": true
   }
 }
 ```
+**WARNING**: This permanently deletes the resource! The `confirm: true` parameter is REQUIRED.
```

---

## Testing Strategy

### Per-Tool Testing
For each of the 16 tools:
- [ ] Add confirm flag to schema
- [ ] Add confirm validation to handler
- [ ] Add audit logging
- [ ] Update tests (add confirm requirement test)
- [ ] Update existing tests (add confirm: true)
- [ ] Run tool-specific tests: `npm test -- <tool-name>`

### Batch Testing
After each phase:
- [ ] Run domain tests: `npm test -- <domain>`
- [ ] Check ESLint: `npm run lint`
- [ ] Verify no regressions

### Final Validation
After Phase 2 complete:
- [ ] Run full test suite: `npm test`
- [ ] Re-run audit: `npx tsx scripts/audit-actual-patterns.ts`
- [ ] Verify 100% C4 compliance (20/20 tools)
- [ ] Check git diff for unintended changes

---

## Success Criteria

- [ ] All 20 destructive tools have `confirm: boolean` flag in schema
- [ ] All 20 tools validate `args.confirm === true`
- [ ] All 20 tools log with `logger.warn()` + sessionId/userId
- [ ] All tool tests pass
- [ ] Audit script shows 100% C4 compliance
- [ ] Documentation updated for all tools

---

## Commit Strategy

**Phase 1 Commit**:
```
feat(safety): implement C4 pattern for infrastructure tools (10 tools)

Destructive operation safety (confirm + validation + audit):
- backup/delete, backup/schedule-delete
- cronjob/delete
- mail/address/delete, mail/deliverybox/delete
- domain/virtualhost-delete
- sftp/user-delete, ssh/user-delete
- user/ssh-key/delete
- org/invite-revoke

All tools now require confirm=true with audit logging
Part 1/2 of C4 pattern adoption (10/16 tools)
```

**Phase 2 Commit**:
```
feat(safety): implement C4 pattern for core resource tools (6 tools)

Destructive operation safety (confirm + validation + audit):
- container/delete, registry/delete, stack/delete
- database/mysql/delete, database/mysql/user-delete
- project/delete

Part 2/2 of C4 pattern adoption (16/16 tools)
Completes: 100% C4 compliance across all destructive operations
```

---

## Out of Scope

### ❌ Dependency Detection (Except Volume)

**Reason**: CLI list commands don't expose relationship data (see `docs/DEPENDENCY-DETECTION-FEASIBILITY.md`)

**Exception**: Volume delete already has dependency detection (Agent C6)

**Impact**: No changes to volume/delete-cli.ts

---

### ❌ Array Parameter Migration

**Reason**: All 3 tools with array parameters already use correct C2 forEach pattern

**Tools Already Correct**:
- container/run-cli.ts
- container/update-cli.ts
- user/api-token/create-cli.ts

**Impact**: No work needed

---

## Risk Mitigation

### High Risk: Breaking Existing Tools
**Mitigation**:
- Test each tool after changes
- Run full test suite before committing
- Review git diff for unintended changes

### Medium Risk: Missing Tests
**Mitigation**:
- Add confirm requirement test for each tool
- Update existing tests to pass confirm: true
- Verify test coverage with `npm test -- --coverage`

### Low Risk: Documentation Drift
**Mitigation**:
- Update tool examples when changing schemas
- Review docs/ folder for references to changed tools

---

## Rollout Plan

### Week 1
- **Day 1-2**: Phase 1 (10 infrastructure tools)
- **Day 3-4**: Phase 2 (6 core resource tools)
- **Day 5**: Buffer for issues, final validation

### Approval Required
- [ ] Effort estimate acceptable (4 days)
- [ ] Scope approved (C4 only, no dependency detection)
- [ ] Resources available (1 developer)
- [ ] Priority aligns with roadmap

---

**Plan Status**: READY FOR APPROVAL
**Estimated Effort**: 4.0 days
**Deliverable**: 100% C4 compliance (20/20 destructive tools)
**Next Steps**: Review and approve, then begin Phase 1
