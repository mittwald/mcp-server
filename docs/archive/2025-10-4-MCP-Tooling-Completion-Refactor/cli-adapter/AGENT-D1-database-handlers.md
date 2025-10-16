# Agent D1: Database Handlers Migration

**Agent ID**: D1
**Task**: Migrate database handlers from cli-wrapper to cli-adapter
**Duration**: 1-2 days
**Priority**: High (high volume + credential security integration)
**Dependencies**: None

---

## Objective

Migrate all database handlers (MySQL + Redis) from direct `cli-wrapper` imports to the `cli-adapter` pattern. This eliminates `no-restricted-imports` warnings and establishes consistency across the codebase.

---

## Context

**Current State**:
- 18 database handlers import from `../../tools/cli-wrapper.js`
- ESLint shows `no-restricted-imports` warnings
- Handlers use inconsistent execution patterns

**Target State**:
- All handlers import from `@/tools/index.js` (cli-adapter)
- Zero ESLint warnings
- Consistent `invokeCliTool()` usage
- All tests passing

---

## Scope

### MySQL Handlers (10 files)
**Location**: `src/handlers/tools/mittwald-cli/database/mysql/`

1. `user-create-cli.ts` ✨ (uses credential security utilities - DO NOT BREAK)
2. `user-get-cli.ts`
3. `user-list-cli.ts`
4. `user-update-cli.ts` ✨ (uses credential security utilities - DO NOT BREAK)
5. `user-delete-cli.ts`
6. `create-cli.ts`
7. `get-cli.ts`
8. `list-cli.ts`
9. `charsets-cli.ts`
10. `versions-cli.ts`

**Excluded** (interactive/streaming):
- `port-forward-cli.ts` (requires persistent connection)
- `phpmyadmin-cli.ts` (interactive)
- `shell-cli.ts` (interactive)
- `dump-cli.ts` (may be streaming - evaluate)
- `import-cli.ts` (may be streaming - evaluate)

### Redis Handlers (4 files)
**Location**: `src/handlers/tools/mittwald-cli/database/redis/`

1. `create-cli.ts` ✨ (uses credential security utilities - DO NOT BREAK)
2. `get-cli.ts`
3. `list-cli.ts`
4. `versions-cli.ts`

**Total**: 14 handlers to migrate

### Excluded Interactive/Streaming Handlers
The following MySQL handlers remain on the legacy execution path because they
require interactive input or persistent connections that are incompatible with
the MCP request/response lifecycle. They are deferred to Agent E1 (Interactive
Commands Assessment) for a tailored approach.

- `phpmyadmin-cli.ts` – launches a browser-based phpMyAdmin session and cannot
  be automated without user interaction.
- `shell-cli.ts` – opens an interactive MySQL shell that expects a TTY
  connection.
- `port-forward-cli.ts` – establishes a long-running port forward and depends
  on streaming I/O.

Document any future changes for these handlers in the Agent E1 workstream.

---

## Migration Pattern

### Before (cli-wrapper)
```typescript
import { executeCli } from '../../tools/cli-wrapper.js';

export const handleMysqlUserListCli = async (args: any, context: any) => {
  const argv = ['database', 'mysql', 'user', 'list', '--database-id', args.databaseId];

  if (args.output === 'json') {
    argv.push('--output', 'json');
  }

  const result = await executeCli({
    argv,
    context,
    toolName: 'mittwald_mysql_user_list',
  });

  // Parse and format result
  return formatToolResponse('success', 'Users retrieved', { output: result.stdout });
};
```

### After (cli-adapter)
```typescript
import { invokeCliTool } from '@/tools/index.js';
import { formatToolResponse } from '@/tools/response-formatter.js';

export const handleMysqlUserListCli = async (args: any, context: any) => {
  const argv = ['database', 'mysql', 'user', 'list', '--database-id', args.databaseId];

  if (args.output === 'json') {
    argv.push('--output', 'json');
  }

  const result = await invokeCliTool({
    toolName: 'mittwald_mysql_user_list',
    argv,
    context, // cli-adapter injects context automatically
  });

  // Parse and format result
  return formatToolResponse('success', 'Users retrieved', { output: result.result });
};
```

**Key Changes**:
1. Import from `@/tools/index.js` instead of `../../tools/cli-wrapper.js`
2. Use `invokeCliTool()` instead of `executeCli()`
3. Access result via `result.result` instead of `result.stdout`
4. Context handling unchanged (cli-adapter manages internally)

---

## Special Considerations

### ⚠️ Credential Security Tools (HIGH PRIORITY)

These tools use Agent C3's credential security utilities:
- `database/mysql/user-create-cli.ts`
- `database/mysql/user-update-cli.ts`
- `database/redis/create-cli.ts`

**CRITICAL**: DO NOT break credential generation or redaction patterns

**Migration Checklist**:
- [ ] Verify `generateSecurePassword()` imports intact
- [ ] Verify `redactCredentialsFromCommand()` usage intact
- [ ] Verify `buildSecureToolResponse()` usage intact
- [ ] Run credential security tests: `npm test -- credential`
- [ ] Manual test: Create user, verify password not in response/logs

**Example (user-create-cli.ts)**:
```typescript
// BEFORE
import { executeCli } from '../../tools/cli-wrapper.js';
import { generateSecurePassword } from '@/utils/credential-generator.js';
import { redactCredentialsFromCommand } from '@/utils/credential-redactor.js';
import { buildSecureToolResponse } from '@/utils/credential-response.js';

export const handleMysqlUserCreateCli = async (args: any, context: any) => {
  const password = args.password ?? generateSecurePassword();
  const argv = ['database', 'mysql', 'user', 'create', '--database-id', args.databaseId, '--password', password];

  const sanitizedCommand = redactCredentialsFromCommand(argv.join(' '));
  logger.info('[MySQL User Create] Executing', { command: sanitizedCommand });

  const result = await executeCli({ argv, context, toolName: 'mittwald_mysql_user_create' });

  return buildSecureToolResponse('success', 'User created', {
    userId: result.stdout.trim(),
    passwordChanged: true, // DO NOT expose actual password
  });
};

// AFTER
import { invokeCliTool } from '@/tools/index.js'; // ✅ ONLY CHANGE THIS LINE
import { generateSecurePassword } from '@/utils/credential-generator.js';
import { redactCredentialsFromCommand } from '@/utils/credential-redactor.js';
import { buildSecureToolResponse } from '@/utils/credential-response.js';

export const handleMysqlUserCreateCli = async (args: any, context: any) => {
  const password = args.password ?? generateSecurePassword();
  const argv = ['database', 'mysql', 'user', 'create', '--database-id', args.databaseId, '--password', password];

  const sanitizedCommand = redactCredentialsFromCommand(argv.join(' '));
  logger.info('[MySQL User Create] Executing', { command: sanitizedCommand });

  const result = await invokeCliTool({ toolName: 'mittwald_mysql_user_create', argv, context }); // ✅ NEW API

  return buildSecureToolResponse('success', 'User created', {
    userId: result.result.trim(), // ✅ result.result instead of result.stdout
    passwordChanged: true,
  });
};
```

---

## Implementation Steps

### Day 1: MySQL Handlers

**Morning** (4 hours):
1. Migrate `charsets-cli.ts` (simple, no credentials)
2. Migrate `versions-cli.ts` (simple, no credentials)
3. Migrate `get-cli.ts` (simple, no credentials)
4. Migrate `list-cli.ts` (simple, no credentials)
5. Run tests: `npm test -- database/mysql`

**Afternoon** (4 hours):
6. Migrate `user-get-cli.ts` (simple, no credentials)
7. Migrate `user-list-cli.ts` (simple, no credentials)
8. Migrate `user-delete-cli.ts` (destructive, no credentials)
9. Migrate `create-cli.ts` (no credentials)
10. Run tests: `npm test -- database/mysql`

### Day 2: Credential Tools + Redis

**Morning** (4 hours):
11. **CAREFULLY** migrate `user-create-cli.ts` (CREDENTIALS)
    - Update import only
    - Verify credential utilities intact
    - Test password generation
    - Test response sanitization
    - Run: `npm test -- mysql/user-create`

12. **CAREFULLY** migrate `user-update-cli.ts` (CREDENTIALS)
    - Same precautions as #11
    - Run: `npm test -- mysql/user-update`

**Afternoon** (4 hours):
13. Migrate Redis `get-cli.ts` (simple)
14. Migrate Redis `list-cli.ts` (simple)
15. Migrate Redis `versions-cli.ts` (simple)

16. **CAREFULLY** migrate Redis `create-cli.ts` (CREDENTIALS)
    - Same precautions as #11-12
    - Run: `npm test -- redis/create`

17. Run full test suite: `npm test`
18. Check ESLint: `npm run lint`
19. Verify zero `no-restricted-imports` warnings for database handlers

---

## Testing Strategy

### Unit Tests
For each migrated handler:
- [ ] Run handler-specific tests: `npm test -- <handler-name>`
- [ ] Verify CLI command construction unchanged
- [ ] Verify response format unchanged

### Credential Security Tests
For credential-handling tools:
- [ ] Run: `npm test -- tests/unit/utils/credential-generator.test.ts`
- [ ] Run: `npm test -- tests/unit/utils/credential-redactor.test.ts`
- [ ] Run: `npm test -- tests/unit/utils/credential-response.test.ts`
- [ ] Verify passwords not in test output
- [ ] Verify `[REDACTED]` appears in logs

### Integration Tests
- [ ] Create MySQL user via MCP
- [ ] Verify password not in response
- [ ] Verify password not in logs
- [ ] Create Redis database via MCP
- [ ] Verify password not in response

### ESLint Validation
```bash
npm run lint 2>&1 | grep "no-restricted-imports.*database"
# Should return NO matches
```

---

## Success Criteria

- [ ] All 14 database handlers migrated
- [ ] Zero imports from `cli-wrapper` in database handlers
- [ ] All unit tests passing
- [ ] All credential security tests passing
- [ ] No passwords in responses or logs
- [ ] Zero ESLint `no-restricted-imports` warnings
- [ ] No regressions in functionality

---

## Risk Mitigation

### High Risk: Credential Security Break
**Risk**: Migration breaks credential generation/redaction
**Mitigation**:
- Test credential tools last (after simple tools work)
- Run credential security tests after each migration
- Manual verification of password handling
- Keep Agent C3 review doc handy for reference

### Medium Risk: Response Format Changes
**Risk**: `result.result` vs `result.stdout` breaks parsers
**Mitigation**:
- Check each handler's result parsing
- Run all tests before committing
- Test with real CLI calls if possible

### Low Risk: Import Path Errors
**Risk**: Typos in import paths
**Mitigation**:
- Use IDE auto-import
- Run `npm run build` to catch import errors
- TypeScript will catch missing exports

---

## Dependencies & Blockers

**None** - Can start immediately

**Related Work**:
- Agent C3 (credential security) - DO NOT BREAK THIS
- Agent S1 (security utilities) - May benefit from this migration

---

## Commit Strategy

**Commit 1**: MySQL simple handlers (8 files)
```
refactor(database): migrate MySQL handlers to cli-adapter (D1 phase 1)

- Migrate charsets, versions, get, list, user-get, user-list, user-delete, create
- Remove cli-wrapper imports
- Use invokeCliTool() from cli-adapter
- All tests passing

Part of Agent D1 (Database Handlers Migration)
```

**Commit 2**: MySQL credential handlers (2 files)
```
refactor(database): migrate MySQL credential handlers to cli-adapter (D1 phase 2)

- Migrate user-create, user-update
- Preserve credential security utilities (C3 patterns)
- Verify password generation/redaction intact
- All credential tests passing

Part of Agent D1 (Database Handlers Migration)
⚠️ CRITICAL: Credential security patterns preserved
```

**Commit 3**: Redis handlers (4 files)
```
refactor(database): migrate Redis handlers to cli-adapter (D1 phase 3)

- Migrate get, list, versions, create
- Preserve credential security in create-cli
- All tests passing

Part of Agent D1 (Database Handlers Migration)
Completes D1 - All 14 database handlers migrated
```

---

## Related Documentation

- **Agent C3 Review**: `docs/agent-reviews/AGENT-C3-REVIEW.md` (Credential patterns)
- **Credential Security**: `docs/CREDENTIAL-SECURITY.md`
- **CLI Adapter**: `src/tools/cli-adapter.ts`
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md`

---

**Agent Status**: Ready to execute
**Estimated Effort**: 1-2 days
**Next Steps**: Start with Day 1 (simple MySQL handlers)
