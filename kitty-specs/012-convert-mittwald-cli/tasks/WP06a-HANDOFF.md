---
lane: "done"
agent: "codex"
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
  grep -v "container/stop\\|container/start\\|container/restart\\|container/delete\\|volume/create\\|conversation/close"
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
```

## Activity Log

- 2025-12-18T14:49:09Z – codex – shell_pid=57224 – lane=done – User request to close handoff as well.
