# Agent D2: Project, Org & Context Handlers Migration

**Agent ID**: D2
**Task**: Migrate project, org, and context handlers from cli-wrapper to cli-adapter
**Duration**: 1 day
**Priority**: High (org tools have C4 destructive patterns)
**Dependencies**: None

---

## Objective

Migrate project, organization, and context handlers from direct `cli-wrapper` imports to the `cli-adapter` pattern. Preserve Agent C4's destructive operation safety patterns in org tools.

---

## Context

**Current State**:
- Multiple handlers in project/, org/, and context/ import from cli-wrapper
- Org tools implement C4 destructive operation safety pattern
- ESLint shows `no-restricted-imports` warnings

**Target State**:
- All handlers use `invokeCliTool()` from cli-adapter
- C4 safety patterns preserved (confirm flags, audit logging)
- Zero ESLint warnings
- All tests passing

---

## Scope

### Project Handlers
**Location**: `src/handlers/tools/mittwald-cli/project/`
**Files**: Check directory for cli-wrapper imports
- Likely: `list-cli.ts`, `get-cli.ts`, `create-cli.ts`, etc.

### Organization Handlers ⚠️
**Location**: `src/handlers/tools/mittwald-cli/org/`
**Files** (implement C4 patterns - DO NOT BREAK):
- `delete-cli.ts` (destructive)
- `invite-cli.ts`
- `membership-list-cli.ts`
- `membership-list-own-cli.ts`
- `membership-revoke-cli.ts` (destructive)
- `list-cli.ts`
- `get-cli.ts`

**CRITICAL**: Org tools use Agent C4's destructive operation safety pattern:
- `confirm: boolean` flag (required)
- Audit logging with `sessionId`/`userId`
- `logger.warn()` before destructive operations

### Context Handlers
**Location**: `src/handlers/tools/mittwald-cli/context/`
**Files**:
- `accessible-projects-cli.ts`
- Others as discovered

**Total Estimated**: 10-12 handlers

---

## Migration Pattern

### Standard Migration (Non-Destructive)

**Before**:
```typescript
import { executeCli } from '../../tools/cli-wrapper.js';

export const handleProjectListCli = async (args: any, context: any) => {
  const argv = ['project', 'list', '--output', 'json'];
  const result = await executeCli({ argv, context, toolName: 'mittwald_project_list' });
  return formatToolResponse('success', 'Projects retrieved', { projects: JSON.parse(result.stdout) });
};
```

**After**:
```typescript
import { invokeCliTool } from '@/tools/index.js';

export const handleProjectListCli = async (args: any, context: any) => {
  const argv = ['project', 'list', '--output', 'json'];
  const result = await invokeCliTool({ toolName: 'mittwald_project_list', argv, context });
  return formatToolResponse('success', 'Projects retrieved', { projects: JSON.parse(result.result) });
};
```

### Destructive Operation Migration (C4 Pattern) ⚠️

**CRITICAL**: Preserve C4 safety pattern

**Before**:
```typescript
import { executeCli } from '../../tools/cli-wrapper.js';
import { logger } from '@/utils/logger.js';

export const handleOrgDeleteCli = async (args: any, context: any) => {
  // C4 Pattern: Confirm validation
  if (args.confirm !== true) {
    return formatToolResponse('error', 'Organization deletion requires confirm=true. This operation is destructive and cannot be undone.');
  }

  // C4 Pattern: Audit logging
  logger.warn('[Org Delete] Destructive operation attempted', {
    orgId: args.orgId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'delete', args.orgId, '--force'];
  const result = await executeCli({ argv, context, toolName: 'mittwald_org_delete' });

  return formatToolResponse('success', 'Organization deleted', { orgId: args.orgId });
};
```

**After** (ONLY change import and API call):
```typescript
import { invokeCliTool } from '@/tools/index.js'; // ✅ ONLY CHANGE THIS
import { logger } from '@/utils/logger.js';

export const handleOrgDeleteCli = async (args: any, context: any) => {
  // C4 Pattern: Confirm validation (PRESERVE)
  if (args.confirm !== true) {
    return formatToolResponse('error', 'Organization deletion requires confirm=true. This operation is destructive and cannot be undone.');
  }

  // C4 Pattern: Audit logging (PRESERVE)
  logger.warn('[Org Delete] Destructive operation attempted', {
    orgId: args.orgId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'delete', args.orgId, '--force'];
  const result = await invokeCliTool({ toolName: 'mittwald_org_delete', argv, context }); // ✅ NEW API

  return formatToolResponse('success', 'Organization deleted', { orgId: args.orgId });
};
```

**DO NOT REMOVE**:
- `if (args.confirm !== true)` check
- `logger.warn()` call with context
- Error message about destructive operation

---

## Implementation Steps

### Morning (4 hours): Project & Context Handlers

1. Identify all project handlers with cli-wrapper imports:
   ```bash
   grep -r "from.*cli-wrapper" src/handlers/tools/mittwald-cli/project/ -l
   ```

2. Migrate each project handler:
   - Update import: `import { invokeCliTool } from '@/tools/index.js';`
   - Change API call: `invokeCliTool({ toolName, argv, context })`
   - Update result access: `result.result` instead of `result.stdout`

3. Migrate context handlers (accessible-projects, etc.)

4. Run tests: `npm test -- project` and `npm test -- context`

### Afternoon (4 hours): Organization Handlers ⚠️

5. Review Agent C4 documentation:
   - Read: `docs/agent-reviews/AGENT-C4-REVIEW.md`
   - Understand destructive operation pattern

6. Migrate org handlers **CAREFULLY**:
   - Start with non-destructive: `list-cli.ts`, `get-cli.ts`, `invite-cli.ts`
   - Test after each: `npm test -- org/<handler>`

7. Migrate destructive handlers:
   - `delete-cli.ts` - Verify confirm flag + audit logging intact
   - `membership-revoke-cli.ts` - Verify confirm flag + audit logging intact
   - Run: `npm test -- org/delete` and `npm test -- org/membership-revoke`

8. Verify C4 compliance:
   ```bash
   grep -A 5 "confirm !== true" src/handlers/tools/mittwald-cli/org/delete-cli.ts
   grep -A 5 "logger.warn" src/handlers/tools/mittwald-cli/org/delete-cli.ts
   ```

9. Run full test suite: `npm test`

10. Check ESLint: `npm run lint` (verify no warnings)

---

## Testing Strategy

### Unit Tests
For each handler:
- [ ] Run handler-specific tests
- [ ] Verify CLI command construction unchanged
- [ ] Verify response format unchanged

### C4 Safety Tests (Org Tools)
For destructive org tools:
- [ ] Run: `npm test -- org/delete`
- [ ] Run: `npm test -- org/membership-revoke`
- [ ] Verify confirm flag requirement in tests
- [ ] Verify audit logging in tests
- [ ] Check test expects `logger.warn()` call

### Integration Tests
- [ ] Test org delete without confirm (should fail)
- [ ] Test org delete with confirm (should succeed + log warning)
- [ ] Test membership revoke without confirm (should fail)
- [ ] Verify sessionId/userId in logs

### ESLint Validation
```bash
npm run lint 2>&1 | grep "no-restricted-imports.*(project|org|context)"
# Should return NO matches
```

---

## Success Criteria

- [ ] All project handlers migrated
- [ ] All org handlers migrated (C4 patterns intact)
- [ ] All context handlers migrated
- [ ] Zero imports from `cli-wrapper` in these directories
- [ ] All unit tests passing
- [ ] C4 destructive operation tests passing
- [ ] Zero ESLint `no-restricted-imports` warnings
- [ ] No regressions in functionality

---

## Risk Mitigation

### High Risk: C4 Safety Pattern Break
**Risk**: Migration removes confirm flags or audit logging
**Mitigation**:
- Review Agent C4 docs before migrating org tools
- Test destructive operations thoroughly
- Verify confirm flag in schema and handler
- Verify logger.warn() calls preserved
- Run org-specific tests after migration

### Medium Risk: Context Handler Complexity
**Risk**: accessible-projects has complex logic that might break
**Mitigation**:
- Test thoroughly after migration
- Compare before/after response formats
- Run integration tests if available

### Low Risk: Import Path Errors
**Risk**: Typos in import paths
**Mitigation**:
- Use IDE auto-import
- Run TypeScript build to catch errors

---

## Dependencies & Blockers

**None** - Can start immediately

**Related Work**:
- Agent C4 (org safety patterns) - DO NOT BREAK THIS
- Agent D1 (database handlers) - Can run in parallel

---

## Commit Strategy

**Commit 1**: Project and context handlers
```
refactor(handlers): migrate project/context handlers to cli-adapter (D2 phase 1)

- Migrate project handlers to invokeCliTool()
- Migrate context handlers to invokeCliTool()
- Remove cli-wrapper imports
- All tests passing

Part of Agent D2 (Project/Org/Context Migration)
```

**Commit 2**: Org handlers (C4 patterns preserved)
```
refactor(handlers): migrate org handlers to cli-adapter (D2 phase 2)

- Migrate org handlers to invokeCliTool()
- PRESERVE C4 destructive operation safety patterns
- Confirm flags and audit logging intact
- All tests passing

Part of Agent D2 (Project/Org/Context Migration)
⚠️ CRITICAL: C4 safety patterns preserved (confirm + audit)
```

---

## Related Documentation

- **Agent C4 Review**: `docs/agent-reviews/AGENT-C4-REVIEW.md` (Safety patterns)
- **Architecture**: `ARCHITECTURE.md` (Destructive Operation Safety section)
- **CLI Adapter**: `src/tools/cli-adapter.ts`
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md`

---

**Agent Status**: Ready to execute
**Estimated Effort**: 1 day
**Next Steps**: Start with project handlers (simpler), then org handlers (careful with C4)
