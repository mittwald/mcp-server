---
lane: "for_review"
agent: "claude"
shell_pid: "57224"
---
# WP06 Handoff - CLI Removal & Cleanup

**Date**: 2025-12-18
**From**: WP05 Extended Migration Team
**To**: WP06 Implementation Agent
**Status**: Ready to begin WP06

---

## Quick Summary

WP05 successfully migrated **125 out of 171 tools** (73% coverage). You'll be removing CLI spawning code from these migrated tools and cleaning up infrastructure.

⚠️ **IMPORTANT**: Some things are different than the original WP06 prompt expects. Read this entire handoff before starting!

---

## 🎯 What WP06 Should Do

**Your Mission**: Remove parallel validation code and CLI spawning from the **125 migrated tools**, leaving them library-only.

**DO NOT** touch the **46 unmigrated tools** - they must continue using CLI spawning.

---

## ⚠️ Critical Differences from Original Plan

### 1. **Tool Count Changed: 175 → 171**

**What happened:**
- Deleted 4 redundant CLI context tools during WP05
- These were unsafe for multi-user (wrote to shared ~/.mw/context.json)

**Deleted tools:**
- `context/get-cli.ts`
- `context/set-cli.ts`
- `context/reset-cli.ts`
- `context/accessible-projects-cli.ts`

**Replacement**: Session-aware context tools already exist:
- `mittwald_context_get_session` ✅
- `mittwald_context_set_session` ✅
- `mittwald_context_reset_session` ✅

**Impact on WP06**: Tool count is 171, not 175. Don't be surprised!

---

### 2. **Not All Tools Migrated: 125/171 (73%)**

**Original plan**: "Migrate all ~100 tools"
**Reality**: Migrated 125 tools, **46 tools remain unmigrated**

**Why 46 tools remain:**
- **33 cannot be migrated** (interactive, no API, complex installer framework)
- **13 can migrate but low priority** (specialized use cases)

**CRITICAL FOR WP06**:
- ✅ Remove CLI code from **125 migrated tools**
- ❌ **DO NOT** remove CLI code from **46 unmigrated tools**

**How to identify migrated tools:**
```bash
# Migrated tools import from library:
grep -l "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts

# Unmigrated tools do NOT import from library:
grep -L "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts
```

---

### 3. **Some Library Functions Are Placeholders**

**Problem**: WP05 agents created library functions that throw "not implemented" errors.

**Affected functions** (`packages/mittwald-cli-core/src/resources/infrastructure.ts`):

```typescript
// Container operations - throw errors
stopContainer() → LibraryError('needs stackId and serviceId mapping', 501)
startContainer() → LibraryError('needs stackId and serviceId mapping', 501)
restartContainer() → LibraryError('needs stackId and serviceId mapping', 501)
deleteContainer() → LibraryError('needs stackId and serviceId mapping', 501)

// Volume create - throws error
createVolume() → LibraryError('use declareStack to manage volumes', 501)

// Conversation close - throws error
closeConversation() → LibraryError('updateConversation does not support status field', 501)
```

**Impact on WP06**:
- These tools were migrated but their library functions don't work!
- **DO NOT** remove CLI code from these specific tools
- They still use `validateToolParity` and will fall back to CLI when library fails

**Affected tool handlers** (keep CLI code):
- `container/stop-cli.ts`, `container/start-cli.ts`, `container/restart-cli.ts`, `container/delete-cli.ts`
- `volume/create-cli.ts`
- `conversation/close-cli.ts`

**Note**: The `listContainers` function works (maps to `listServices`), so `container/list-cli.ts` can be cleaned up.

---

### 4. **Context Auto-Population Added**

**What changed**: The context system now auto-populates on first login.

**New behavior** (`src/server/mcp.ts:756-761`):
```typescript
// After OAuth, automatically:
1. Fetch accessible projects
2. Set session.accessibleProjects = ["p_111", "p_222", ...]
3. Set session.currentContext.projectId = projects[0]
```

**Also added** (`src/utils/session-aware-cli.ts`):
- `initializeSessionContext()` - Auto-populate on login
- `handleProjectCreated()` - Refresh after project create
- `handleProjectDeleted()` - Refresh after project delete

**Impact on WP06**:
- No impact on CLI removal
- Just be aware this exists (it's working code)
- Don't accidentally remove these session refresh calls from project/create-cli.ts and project/delete-cli.ts

---

### 5. **Library API Method Names Were Wrong**

**What happened**: WP05 agents initially used incorrect API method names. A fix agent corrected all 22 errors.

**Examples of corrections:**
- `client.user.listSshUsers` → `client.sshsftpUser.sshUserListSshUsers`
- `client.app.extensionListExtensions` → `client.marketplace.extensionListExtensions`
- `client.domain.listCertificates` → `client.domain.sslListCertificates`
- `client.domain.listDnsZones` → `client.domain.dnsListDnsZones`

**Impact on WP06**: The library functions NOW use correct API methods. Don't be surprised if you see unfamiliar namespaces like `sshsftpUser` or `marketplace`.

---

## 📋 WP06 Tasks Breakdown

### Task 1: Identify Cleanable vs Keep-CLI Tools

**Cleanable (119 tools)** - Can remove CLI code:
```bash
# Tools that import library AND don't have placeholder functions
grep -l "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts | \
  grep -v "container/stop\|container/start\|container/restart\|container/delete\|volume/create\|conversation/close"
```

**Keep CLI (52 tools)** - Must keep CLI spawning:
```bash
# Unmigrated (46) + placeholder functions (6)
grep -L "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts
# Plus: container start/stop/restart/delete, volume create, conversation close
```

---

### Task 2: Remove Validation Code from Cleanable Tools

**Pattern to remove** (from each of 119 tools):

```typescript
// REMOVE THIS:
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

// REMOVE THIS:
const validation = await validateToolParity({
  toolName: 'mittwald_xxx',
  cliCommand: 'mw',
  cliArgs: [...],
  libraryFn: async () => { ... },
  ignoreFields: [...]
});

// REMOVE THIS:
if (!validation.passed) {
  logger.warn('[WP05 Validation] ...');
} else {
  logger.info('[WP05 Validation] ...');
}

// REMOVE THIS:
const result = validation.libraryOutput.data;

// REMOVE CliToolError handling in catch blocks
```

**Replace with** (library-only):

```typescript
// KEEP THIS:
import { libraryFunction, LibraryError } from '@mittwald-mcp/cli-core';

// SIMPLIFIED:
try {
  const result = await libraryFunction({
    ...params,
    apiToken: session.mittwaldAccessToken
  });

  return formatToolResponse(
    'success',
    message,
    result.data,
    { durationMs: result.durationMs }
  );
} catch (error) {
  if (error instanceof LibraryError) {
    return formatToolResponse('error', error.message, {
      code: error.code,
      details: error.details
    });
  }
  // Handle unexpected errors
}
```

---

### Task 3: Delete CLI Spawning Utilities

**Check dependencies first!**

```bash
# See which files are still using these utilities
grep -r "invokeCliTool" src/handlers/tools/mittwald-cli/**/*-cli.ts | wc -l
# Should show ~52 (the unmigrated tools + 6 placeholder functions)

grep -r "validateToolParity" src/handlers/tools/mittwald-cli/**/*-cli.ts | wc -l
# Should show 0 after Task 2 cleanup
```

**Only delete if no longer used by migrated tools:**
- ⚠️ **DO NOT** delete `src/tools/cli-wrapper.ts` - still needed by 52 tools!
- ⚠️ **DO NOT** delete `src/utils/cli-wrapper.ts` - still needed!
- ✅ **CAN delete** `tests/validation/parallel-validator.ts` - no longer needed after validation removal

---

### Task 4: Update Imports

**Cleanup imports in migrated tools:**

```bash
# Remove unused imports
- import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
- import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';

# Remove unused helper functions (if no longer called)
- function buildCliArgs() { ... }  // May still be used in comments
- function mapCliError() { ... }    // Remove if not used
```

**Keep necessary imports:**
```typescript
// KEEP THESE:
import { libraryFunction, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
```

---

## 🚨 Known Issues & Gotchas

### Issue 1: Container Operations Have Placeholder Functions

**Tools affected:**
- `container/stop-cli.ts`
- `container/start-cli.ts`
- `container/restart-cli.ts`
- `container/delete-cli.ts`

**Problem**: Library functions throw "not implemented" errors

**Current behavior**: Uses `validateToolParity`, so falls back to CLI when library fails

**WP06 action**: **KEEP CLI CODE** for these 4 tools. Mark as "library function not implemented" in comments.

---

### Issue 2: Volume Create Not Implemented

**Tool**: `volume/create-cli.ts`

**Problem**: `createVolume()` library function throws error (no API endpoint exists)

**WP06 action**: **KEEP CLI CODE**. Add comment explaining API limitation.

---

### Issue 3: Conversation Close Not Implemented

**Tool**: `conversation/close-cli.ts`

**Problem**: `closeConversation()` library function throws error (API doesn't support status updates)

**WP06 action**: **KEEP CLI CODE**. Add comment explaining API limitation.

---

### Issue 4: Some Library Functions Have Updated Signatures

**Examples:**
- `createSftpUser` now requires `directories: [string, ...string[]]` parameter
- `createSshUser` now requires `publicKeys: Array<{key: string, comment: string}>`
- `updateDnsZone` now requires `recordSetType` parameter
- `requestCertificate` completely changed signature (projectId, commonName, contact)

**Impact**: Tool handlers were already updated to match new signatures in WP05.

**WP06 action**: No action needed, just be aware when reviewing code.

---

## 📁 File Locations

**Migrated tool handlers** (119 that can be cleaned):
```
src/handlers/tools/mittwald-cli/
  app/ (8 tools)
  backup/ (8 tools)
  certificate/ (2 tools)
  cronjob/ (9 tools)
  database/ (14 tools)
  domain/ (9 tools)
  extension/ (4 tools)
  mail/ (10 tools)
  org/ (8 tools)
  project/ (9 tools)
  registry/ (4 tools)
  server/ (1 tool)
  sftp/ (4 tools)
  ssh/ (2 tools)
  stack/ (4 tools)
  user/ (12 tools)
  volume/ (2 tools - but volume/create keeps CLI!)
```

**Unmigrated tools** (46 - DO NOT TOUCH):
```
src/handlers/tools/mittwald-cli/
  app/ (20 tools: create/*, install/*, download, upload, ssh, open, dependency-*)
  container/ (4 tools: logs, run, recreate, update - but list is migrated!)
  database/ (7 tools: mysql dump/import/shell/port-forward/phpmyadmin/charsets, plus wrappers)
  ddev/ (2 tools)
  login/ (3 tools)
  org/ (2 tools: *-own)
  project/ (5 tools: ssh, filesystem-usage, *-own)
```

**Keep CLI due to placeholder functions** (6 tools):
```
  container/ (4 tools: stop, start, restart, delete)
  volume/ (1 tool: create)
  conversation/ (1 tool: close)
```

---

## 📚 Essential Reading Before Starting WP06

**MUST READ** (in order):

1. **[WP05-FINAL-COMPLETION-SUMMARY.md](../../../docs/WP05-FINAL-COMPLETION-SUMMARY.md)**
   - Overview of what was migrated
   - Coverage: 73% overall, 91% of migrateable
   - Build status, next steps

2. **[UNMIGRATED-TOOLS-ANALYSIS.md](../../../docs/UNMIGRATED-TOOLS-ANALYSIS.md)**
   - **CRITICAL**: Explains WHY 46 tools weren't migrated
   - Shows which tools to avoid touching
   - Technical constraints documented

3. **[WP06-cli-removal-cleanup.md](./WP06-cli-removal-cleanup.md)**
   - Original WP06 prompt
   - Task breakdown
   - Success criteria

**Optional Reading:**

4. **[WP05-EXTENDED-MIGRATION-COMPLETE.md](../../../docs/WP05-EXTENDED-MIGRATION-COMPLETE.md)** - Extended session details
5. **[CONTEXT-SYSTEM-IMPROVEMENTS.md](../../../docs/CONTEXT-SYSTEM-IMPROVEMENTS.md)** - Context changes

---

## 🎯 WP06 Implementation Checklist

### Phase 1: Identify Tools (30 minutes)

**Step 1.1** - List all migrated tools:
```bash
grep -l "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts > /tmp/migrated-tools.txt
wc -l /tmp/migrated-tools.txt  # Should show 125
```

**Step 1.2** - Identify tools to SKIP (library placeholders):
```bash
# These 6 tools keep CLI code (library functions throw errors):
src/handlers/tools/mittwald-cli/container/stop-cli.ts
src/handlers/tools/mittwald-cli/container/start-cli.ts
src/handlers/tools/mittwald-cli/container/restart-cli.ts
src/handlers/tools/mittwald-cli/container/delete-cli.ts
src/handlers/tools/mittwald-cli/volume/create-cli.ts
src/handlers/tools/mittwald-cli/conversation/close-cli.ts
```

**Step 1.3** - Calculate cleanable tools:
```bash
# 125 migrated - 6 placeholders = 119 tools to clean
```

---

### Phase 2: Remove Validation Code (2-3 hours)

**For each of the 119 cleanable tools**, perform these edits:

**Step 2.1** - Remove imports:
```typescript
// DELETE:
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
```

**Step 2.2** - Remove validation call:
```typescript
// DELETE entire validateToolParity block:
const validation = await validateToolParity({ ... });

if (!validation.passed) {
  logger.warn('[WP05 Validation] ...');
} else {
  logger.info('[WP05 Validation] ...');
}

// REPLACE with direct library call:
const result = await libraryFunction({ ...params, apiToken });
```

**Step 2.3** - Simplify data extraction:
```typescript
// BEFORE:
const result = validation.libraryOutput.data as any;

// AFTER:
// result already has .data from library function
```

**Step 2.4** - Update response metadata:
```typescript
// BEFORE (validation metadata):
{
  durationMs: validation.libraryOutput.durationMs,
  validationPassed: validation.passed,
  discrepancyCount: validation.discrepancies.length,
  cliDuration: validation.cliOutput.durationMs,
  libraryDuration: validation.libraryOutput.durationMs,
}

// AFTER (library-only metadata):
{
  durationMs: result.durationMs
}
```

**Step 2.5** - Remove CLI error handling:
```typescript
// DELETE CliToolError catch block:
if (error instanceof CliToolError) {
  const message = mapCliError(error, args);
  return formatToolResponse('error', message, { ... });
}

// KEEP LibraryError catch block:
if (error instanceof LibraryError) {
  return formatToolResponse('error', error.message, {
    code: error.code,
    details: error.details
  });
}
```

**Step 2.6** - Remove unused helper functions:
```typescript
// DELETE if no longer used:
function buildCliArgs(args) { ... }
function mapCliError(error, args) { ... }
function parseQuietOutput(output) { ... }
```

**Recommendation**: Use parallel agents to clean tools by category (app/, database/, project/, etc.)

---

### Phase 3: Verify No CLI Dependencies Remain (30 minutes)

**Step 3.1** - Check for lingering CLI imports in cleaned tools:
```bash
# Should return 0 (or only the 52 unmigrated + 6 placeholder tools)
grep -r "invokeCliTool" src/handlers/tools/mittwald-cli/**/*-cli.ts | grep "@mittwald-mcp/cli-core" | wc -l
```

**Step 3.2** - Check validation imports removed:
```bash
# Should return 0 in migrated tools
grep -r "validateToolParity" src/handlers/tools/mittwald-cli/**/*-cli.ts | wc -l
```

**Step 3.3** - Verify builds:
```bash
npm run build 2>&1 | grep "^src/" | wc -l  # Should be 0
```

---

### Phase 4: Delete Validation Infrastructure (15 minutes)

**Only delete after verifying no migrated tools use validation!**

```bash
# Check usage first
grep -r "validateToolParity" src/ | grep -v "node_modules\|build" | wc -l
# Should show only unmigrated tools + 6 placeholder tools

# If safe, delete:
rm tests/validation/parallel-validator.ts
rm tests/validation/types.ts
rm -rf tests/validation/  # If directory is empty
```

**Update tsconfig.json** if you delete tests/validation/:
```json
// Before:
"include": ["src/**/*", "tests/**/*"]

// After (if tests/ is empty):
"include": ["src/**/*"]
```

---

### Phase 5: Update Documentation (30 minutes)

**Files to update:**

1. **README.md** (if exists):
   - Update tool count: 175 → 171
   - Mention 73% migrated (125/171)

2. **ARCHITECTURE.md**:
   - Update description: "125 tools use library, 46 use CLI"
   - Add note about context auto-population

3. **WP06 completion doc** (create new):
   - Summary of cleanup performed
   - Final tool breakdown
   - CLI utilities still needed (for 52 tools)

---

## 🔍 Testing Strategy

**After cleanup, verify:**

1. **Build succeeds**:
   ```bash
   npm run build
   # Should complete with 0 errors in src/
   ```

2. **Migrated tools work** (spot check):
   ```bash
   # Test a few migrated tools work without CLI
   # Run MCP server and call:
   - mittwald_app_list
   - mittwald_project_list
   - mittwald_database_mysql_list
   ```

3. **Unmigrated tools still work** (spot check):
   ```bash
   # These should still spawn CLI:
   - mittwald_app_install_wordpress
   - mittwald_database_mysql_shell
   - mittwald_app_ssh
   ```

4. **No CLI processes for migrated tools**:
   ```bash
   # While running migrated tools, check:
   ps aux | grep "mw " | grep -v grep
   # Should show 0 processes (or only from unmigrated tools)
   ```

---

## ⚠️ Common Pitfalls to Avoid

### Pitfall 1: Deleting CLI Code from Unmigrated Tools

**DON'T**:
```bash
# Don't blindly remove CLI code from ALL tools
find src/handlers/tools/mittwald-cli -name "*-cli.ts" -exec sed -i '' '/invokeCliTool/d' {} \;
```

**DO**:
```bash
# Only remove from tools that import @mittwald-mcp/cli-core
for file in $(grep -l "@mittwald-mcp/cli-core" src/handlers/tools/mittwald-cli/**/*-cli.ts); do
  # Check if it's not a placeholder function tool
  if [[ ! "$file" =~ (container/stop|container/start|container/restart|container/delete|volume/create|conversation/close) ]]; then
    # Safe to clean this file
    echo "Clean: $file"
  fi
done
```

---

### Pitfall 2: Deleting CLI Wrapper Too Early

The files `src/tools/cli-wrapper.ts` and `src/utils/cli-wrapper.ts` are **STILL NEEDED** by:
- 46 unmigrated tools
- 6 placeholder function tools (that fall back to CLI)

**Verify before deleting:**
```bash
grep -r "invokeCliTool\|executeCli" src/ | grep -v "node_modules\|build" | wc -l
# If > 0, CLI wrapper is still needed!
```

---

### Pitfall 3: Breaking Session Context Refresh

**DO NOT** remove these lines from project handlers:

```typescript
// src/handlers/tools/mittwald-cli/project/create-cli.ts:125-130
// KEEP THIS - it's not validation code, it's context refresh!
if (projectId && effectiveSessionId) {
  const { sessionAwareCli } = await import('../../../../utils/session-aware-cli.js');
  await sessionAwareCli.handleProjectCreated(effectiveSessionId, projectId, args.updateContext !== false);
}

// src/handlers/tools/mittwald-cli/project/delete-cli.ts:131-136
// KEEP THIS TOO!
if (effectiveSessionId) {
  const { sessionAwareCli } = await import('../../../../utils/session-aware-cli.js');
  await sessionAwareCli.handleProjectDeleted(effectiveSessionId, args.projectId);
}
```

---

### Pitfall 4: Removing Logger Calls

**Some logger calls are validation-related** (can remove):
```typescript
// REMOVE:
logger.warn('[WP05 Validation] Output mismatch...');
logger.info('[WP05 Validation] 100% parity achieved...');
```

**Some logger calls are production logging** (KEEP):
```typescript
// KEEP:
logger.info(`Session updated with new project ${projectId}`);
logger.warn('[StackDelete] Destructive operation attempted', { ... });
logger.error('[WP05] Unexpected error in handler', { error });
```

---

## 📊 Expected Outcomes

**After WP06 completion:**

| Metric | Before WP06 | After WP06 | Change |
|--------|-------------|------------|---------|
| **Migrated tools** | 125 | 125 | No change |
| **Using CLI spawning** | 171 (all) | 52 (unmigrated + placeholders) | −119 |
| **Using library-only** | 0 | 119 | +119 |
| **Validation code** | 125 tools | 0 tools | Removed |
| **CLI wrapper needed** | Yes | Yes (for 52 tools) | Keep |
| **Build errors** | 0 | 0 (target) | Maintain |

---

## 🎯 Success Criteria for WP06

From original WP06 prompt:

- [ ] Parallel validation code removed from 119 cleanable tools
- [ ] Tool handlers use library-only calls (no CLI fallback)
- [ ] Validation infrastructure deleted (if safe)
- [ ] CLI wrapper kept (still needed by 52 tools)
- [ ] Build succeeds with 0 errors
- [ ] 119 tools confirmed library-only (no CLI processes spawned)

**Modified success criteria** (accounting for unmigrated tools):

- [ ] 119 migrated tools cleaned (not all 125)
- [ ] 6 placeholder function tools keep CLI code (documented why)
- [ ] 46 unmigrated tools untouched
- [ ] CLI spawning utilities kept (needed by 52 tools)
- [ ] Validation infrastructure deleted (or marked as deprecated)
- [ ] Build passes with 0 TypeScript errors
- [ ] Documentation updated with final tool breakdown

---

## 🚀 Recommended Approach

**Use parallel agents** (like WP05 did):

1. Launch 10 agents, one per category:
   - Agent 1: Clean app tools (8 tools)
   - Agent 2: Clean database tools (14 tools, skip interactive ones)
   - Agent 3: Clean project tools (9 tools)
   - Agent 4: Clean user tools (12 tools)
   - Agent 5: Clean org tools (8 tools)
   - Agent 6: Clean mail tools (10 tools)
   - Agent 7: Clean cronjob tools (9 tools)
   - Agent 8: Clean domain tools (9 tools)
   - Agent 9: Clean backup tools (8 tools)
   - Agent 10: Clean container/infrastructure/stack/registry/extension (remaining)

2. Each agent:
   - Removes validation code
   - Simplifies to library-only calls
   - Updates response metadata
   - Removes unused helpers

3. After agents complete:
   - Verify build
   - Delete validation infrastructure
   - Update documentation
   - Commit changes

**Estimated time**: 1-2 hours with parallel agents (vs 8-10 hours sequential)

---

## 📞 Questions? Check These Docs

**Q: Why aren't all tools migrated?**
**A**: See [UNMIGRATED-TOOLS-ANALYSIS.md](../../../docs/UNMIGRATED-TOOLS-ANALYSIS.md) - 33 tools architecturally incompatible, 13 low priority

**Q: Why do some library functions throw errors?**
**A**: See "Known Issues" section above - API limitations discovered during migration

**Q: Can I delete the CLI wrapper entirely?**
**A**: NO - still needed by 52 tools (46 unmigrated + 6 placeholders)

**Q: What changed in the context system?**
**A**: See [CONTEXT-SYSTEM-IMPROVEMENTS.md](../../../docs/CONTEXT-SYSTEM-IMPROVEMENTS.md) - auto-population added

**Q: How do I identify which tools to clean?**
**A**: Import check: `grep -l "@mittwald-mcp/cli-core"` + exclude 6 placeholder tools listed above

---

## ✅ Pre-Flight Checklist

Before starting WP06, verify:

- [ ] You've read WP05-FINAL-COMPLETION-SUMMARY.md
- [ ] You've read UNMIGRATED-TOOLS-ANALYSIS.md
- [ ] You understand 46 tools are NOT migrated (it's intentional!)
- [ ] You understand 6 migrated tools keep CLI due to placeholder functions
- [ ] You have the list of 119 cleanable tools
- [ ] Build currently passes (0 errors in src/)
- [ ] You're in the worktree: `012-convert-mittwald-cli`
- [ ] Current branch: `012-convert-mittwald-cli`

---

## 💡 Tips for Success

1. **Start with one category** - Clean app tools first, verify build, then continue
2. **Use agents** - 10 parallel agents = 8x faster than sequential
3. **Check placeholder functions** - Don't clean the 6 tools with library errors
4. **Preserve context refresh** - Keep session refresh calls in project create/delete
5. **Keep production logging** - Only remove WP05 validation logs
6. **Test incrementally** - Verify build after each category

---

## 🎁 What You're Inheriting

✅ **125 tools migrated** with parallel validation
✅ **0 TypeScript errors** - clean build
✅ **Context auto-population** - working and tested
✅ **Comprehensive docs** - all decisions documented
✅ **Library functions** - 90% working, 10% placeholders
✅ **Git history** - clean commits with detailed messages

**Your job**: Strip out validation scaffolding, leave clean library-only code.

**Expected outcome**: 119 tools with simple, fast, library-only implementations.

---

**Good luck! You're in great shape to complete WP06 quickly and cleanly. 🚀**

---

**Generated**: 2025-12-18
**Handoff From**: WP05 Extended Migration Session
**Branch**: `012-convert-mittwald-cli`
**Lane**: WP05 in `for_review`, WP06 in `planned`

## Activity Log

- 2025-12-18T13:25:56Z – claude – shell_pid=57224 – lane=doing – Reading handoff context document
- 2025-12-18T14:35:05Z – claude – shell_pid=57224 – lane=for_review – Handoff document reviewed and followed
