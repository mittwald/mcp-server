# Agent D3: Infrastructure Handlers Migration

**Agent ID**: D3
**Task**: Migrate remaining infrastructure handlers from cli-wrapper to cli-adapter
**Duration**: 1 day
**Priority**: Medium (cleanup remaining handlers)
**Dependencies**: None

---

## Objective

Migrate all remaining handlers from direct `cli-wrapper` imports to the `cli-adapter` pattern. This completes the CLI adapter migration project and eliminates all `no-restricted-imports` warnings.

---

## Context

**Current State**:
- Remaining handlers across cronjob, mail, domain, sftp, user, extension, and conversation topics
- All use direct cli-wrapper imports
- ESLint warnings present

**Target State**:
- All handlers use `invokeCliTool()` from cli-adapter
- Zero cli-wrapper imports in src/handlers/
- Zero ESLint `no-restricted-imports` warnings
- All tests passing

---

## Scope

### Cronjob Handlers
**Location**: `src/handlers/tools/mittwald-cli/cronjob/`
**Estimated**: 2-3 files

### Mail Handlers
**Location**: `src/handlers/tools/mittwald-cli/mail/`
**Subdirectories**:
- `mail/address/` (2-3 files)
- `mail/deliverybox/` (2-3 files)

### Domain Handlers
**Location**: `src/handlers/tools/mittwald-cli/domain/`
**Subdirectories**:
- `domain/dnszone/` (1-2 files)

### SFTP Handlers
**Location**: `src/handlers/tools/mittwald-cli/sftp/`
**Estimated**: 2-3 files

### User Handlers
**Location**: `src/handlers/tools/mittwald-cli/user/`
**Subdirectories**:
- `user/api-token/` (2-3 files)

### Extension Handlers
**Location**: `src/handlers/tools/mittwald-cli/extension/`
**Estimated**: 1-2 files

### Conversation Handlers
**Location**: `src/handlers/tools/mittwald-cli/conversation/`
**Estimated**: 1-2 files

**Total Estimated**: 15-20 handlers

---

## Migration Pattern

### Standard Migration (All Handlers)

**Before**:
```typescript
import { executeCli } from '../../tools/cli-wrapper.js';

export const handleCronjobListCli = async (args: any, context: any) => {
  const argv = ['cronjob', 'list', '--project-id', args.projectId];
  const result = await executeCli({ argv, context, toolName: 'mittwald_cronjob_list' });
  return formatToolResponse('success', 'Cronjobs retrieved', { output: result.stdout });
};
```

**After**:
```typescript
import { invokeCliTool } from '@/tools/index.js';

export const handleCronjobListCli = async (args: any, context: any) => {
  const argv = ['cronjob', 'list', '--project-id', args.projectId];
  const result = await invokeCliTool({ toolName: 'mittwald_cronjob_list', argv, context });
  return formatToolResponse('success', 'Cronjobs retrieved', { output: result.result });
};
```

**Changes**:
1. Import from `@/tools/index.js`
2. Use `invokeCliTool()` API
3. Access `result.result` instead of `result.stdout`

---

## Implementation Steps

### Discovery Phase (30 minutes)

1. Identify all remaining handlers with cli-wrapper imports:
```bash
grep -r "from.*cli-wrapper" src/handlers/tools/mittwald-cli/ -l | \
  grep -v database | \
  grep -v project | \
  grep -v org | \
  grep -v context
```

2. Group by directory and count:
```bash
grep -r "from.*cli-wrapper" src/handlers/tools/mittwald-cli/ -l | \
  grep -v database | grep -v project | grep -v org | grep -v context | \
  xargs -I {} dirname {} | sort | uniq -c
```

3. Create migration checklist in commit message template

### Migration Phase (6 hours)

**Hour 1**: Cronjob handlers
4. Migrate cronjob handlers (estimated 2-3 files)
5. Run tests: `npm test -- cronjob`

**Hour 2**: Mail address handlers
6. Migrate mail/address handlers (estimated 2-3 files)
7. Run tests: `npm test -- mail/address`

**Hour 3**: Mail deliverybox handlers
8. Migrate mail/deliverybox handlers (estimated 2-3 files)
9. Run tests: `npm test -- mail/deliverybox`

**Hour 4**: Domain handlers
10. Migrate domain/dnszone handlers (estimated 1-2 files)
11. Run tests: `npm test -- domain`

**Hour 5**: SFTP & User handlers
12. Migrate SFTP handlers (estimated 2-3 files)
13. Migrate user/api-token handlers (estimated 2-3 files)
14. Run tests: `npm test -- sftp` and `npm test -- user`

**Hour 6**: Extension, Conversation & Cleanup
15. Migrate extension handlers (estimated 1-2 files)
16. Migrate conversation handlers (estimated 1-2 files)
17. Run tests for each

### Verification Phase (1 hour)

18. Verify zero cli-wrapper imports:
```bash
grep -r "from.*cli-wrapper" src/handlers/tools/mittwald-cli/ -l
# Should return EMPTY
```

19. Run full test suite: `npm test`

20. Check ESLint: `npm run lint`
```bash
npm run lint 2>&1 | grep "no-restricted-imports"
# Should return NO matches
```

21. Build project: `npm run build` (catch any import errors)

---

## Testing Strategy

### Per-Handler Testing
For each migrated handler:
- [ ] Run handler-specific tests
- [ ] Verify CLI command construction unchanged
- [ ] Verify response format unchanged

### Batch Testing (Per Directory)
After completing each directory:
- [ ] Run directory tests: `npm test -- <directory>`
- [ ] Verify no regressions

### Full Suite Testing
After all migrations:
- [ ] Run: `npm test`
- [ ] All tests passing
- [ ] No new failures introduced

### ESLint Validation
Final check:
```bash
# Should show ZERO no-restricted-imports warnings
npm run lint 2>&1 | grep -c "no-restricted-imports"
# Output: 0
```

---

## Success Criteria

- [ ] All infrastructure handlers migrated
- [ ] Zero imports from `cli-wrapper` anywhere in `src/handlers/`
- [ ] All unit tests passing
- [ ] Zero ESLint `no-restricted-imports` warnings
- [ ] TypeScript build succeeds (`npm run build`)
- [ ] No regressions in functionality

---

## Risk Mitigation

### Medium Risk: High Volume
**Risk**: 15-20 handlers is many files to change in one day
**Mitigation**:
- Batch by directory and test incrementally
- Commit after each directory (atomic changes)
- Stop if issues found, don't rush

### Low Risk: Repetitive Changes
**Risk**: Copy-paste errors across similar handlers
**Mitigation**:
- Use IDE find/replace for imports
- Test after each batch
- Review git diff before committing

### Low Risk: Edge Cases
**Risk**: Some handlers may have unique patterns
**Mitigation**:
- Read handler code before changing
- Check test files for expected behavior
- Ask questions if uncertain

---

## Dependencies & Blockers

**None** - Can start immediately

**Related Work**:
- Agent D1 (database) - Can run in parallel
- Agent D2 (project/org) - Can run in parallel
- Completes CLI adapter migration when D1, D2, D3 all done

---

## Commit Strategy

**Option 1**: Single commit (if all goes smoothly)
```
refactor(handlers): migrate infrastructure handlers to cli-adapter (D3)

Migrated handlers from cli-wrapper to cli-adapter:
- Cronjob: 3 handlers
- Mail (address + deliverybox): 5 handlers
- Domain (dnszone): 2 handlers
- SFTP: 3 handlers
- User (api-token): 2 handlers
- Extension: 1 handler
- Conversation: 1 handler

Total: 17 handlers migrated
Zero cli-wrapper imports remaining
All tests passing

Part of Agent D3 (Infrastructure Handlers Migration)
Completes D-series migration (D1 + D2 + D3)
```

**Option 2**: Incremental commits (if issues arise)
```
Commit 1: refactor(cronjob): migrate to cli-adapter (D3)
Commit 2: refactor(mail): migrate address/deliverybox to cli-adapter (D3)
Commit 3: refactor(domain): migrate dnszone to cli-adapter (D3)
Commit 4: refactor(sftp,user): migrate to cli-adapter (D3)
Commit 5: refactor(extension,conversation): migrate to cli-adapter (D3)
```

---

## Completion Checklist

After completing D3:
- [ ] Run final validation script:
```bash
echo "Checking for cli-wrapper imports..."
WRAPPER_COUNT=$(grep -r "from.*cli-wrapper" src/handlers/ -l | wc -l)
echo "cli-wrapper imports found: $WRAPPER_COUNT"

echo "Checking ESLint warnings..."
LINT_COUNT=$(npm run lint 2>&1 | grep -c "no-restricted-imports")
echo "no-restricted-imports warnings: $LINT_COUNT"

echo "Running tests..."
npm test

if [ "$WRAPPER_COUNT" -eq 0 ] && [ "$LINT_COUNT" -eq 0 ]; then
  echo "✅ D3 COMPLETE - All handlers migrated"
  echo "✅ D-SERIES COMPLETE (D1 + D2 + D3)"
else
  echo "❌ Migration incomplete"
  exit 1
fi
```

- [ ] Update project status:
  - Mark D3 as complete in `docs/agent-prompts/cli-adapter/README.md`
  - If D1 and D2 also complete, mark D-series done

---

## Related Documentation

- **CLI Adapter**: `src/tools/cli-adapter.ts`
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md`
- **README**: `docs/agent-prompts/cli-adapter/README.md`

---

**Agent Status**: Ready to execute
**Estimated Effort**: 1 day
**Next Steps**: Run discovery phase to get exact file counts, then migrate by directory
