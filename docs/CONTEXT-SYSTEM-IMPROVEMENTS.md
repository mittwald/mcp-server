# Context System Improvements - Auto-Population & Session Refresh

**Date**: 2025-12-18
**Feature**: Smart session context management with auto-population
**Status**: ✅ IMPLEMENTED

---

## Summary

Improved the MCP session context system to automatically populate accessible projects and default context on first login, plus keep the session fresh when projects are created or deleted.

---

## What Was Already Built (Prior to Today)

### 1. Session-Based Context Storage

Every MCP session stores context in Redis:
```typescript
interface UserSession {
  currentContext: {
    projectId?: string;
    serverId?: string;
    orgId?: string;
  };
  accessibleProjects?: string[];
}
```

### 2. Automatic Context Injection

The `session-aware-cli.ts` automatically injects context into CLI tool calls:
- Checks if tool supports `--project-id` flag
- If session has `currentContext.projectId` set
- And LLM didn't provide `projectId` explicitly
- **Automatically injects**: `--project-id p_xxx` into CLI command

### 3. Session-Aware Context Tools

These tools were already migrated and working:
- `mittwald_context_set_session` - Set context for current session
- `mittwald_context_get_session` - Get current session context
- `mittwald_context_reset_session` - Clear session context

---

## What We Improved Today

### Problem 1: Empty Context on First Login

**Before:**
```typescript
// User logs in
session.currentContext = {}  // Empty!
session.accessibleProjects = undefined  // Not fetched!

// LLM tries to list apps
await mittwald_app_list();
// ❌ Error: projectId required
```

**After:**
```typescript
// User logs in → AUTO-POPULATION kicks in
session.accessibleProjects = ["p_111", "p_222", "p_333"]  // ✅ Fetched!
session.currentContext = { projectId: "p_111" }  // ✅ First project set!

// LLM tries to list apps
await mittwald_app_list();
// ✅ Auto-injects p_111 → works immediately!
```

**Implementation:**
- Added `sessionAwareCli.initializeSessionContext()` method
- Called automatically in `src/server/mcp.ts` after OAuth callback
- Only runs on FIRST login (checks if `existing?.accessibleProjects` is empty)
- Non-fatal if it fails (logs warning, continues)

**Code location:**
- `src/utils/session-aware-cli.ts:273-305` - initialization method
- `src/server/mcp.ts:756-761` - OAuth callback integration

---

### Problem 2: Stale Context After Project Create

**Before:**
```typescript
// User creates new project
await mittwald_project_create({...});
// Returns: { projectId: "p_new" }

// Session NOT updated
session.accessibleProjects = ["p_111", "p_222"]  // ❌ Missing p_new!
session.currentContext.projectId = "p_111"  // ❌ Still old project!

// LLM can't discover new project
await mittwald_app_list({projectId: "p_new"});  // Works
await mittwald_app_list();  // Uses p_111 context ❌ Wrong project!
```

**After:**
```typescript
// User creates new project
await mittwald_project_create({...});
// Returns: { projectId: "p_new" }

// Session AUTOMATICALLY updated
session.accessibleProjects = ["p_111", "p_222", "p_new"]  // ✅ Added!
session.currentContext.projectId = "p_new"  // ✅ Auto-switched!

// LLM can work with new project immediately
await mittwald_app_list();  // Uses p_new context ✅ Correct!
```

**Implementation:**
- Added `sessionAwareCli.handleProjectCreated()` method
- Called automatically in `project/create-cli.ts` after successful creation
- Adds new projectId to `accessibleProjects` array
- Sets new project as active context (if `updateContext !== false`)

**Code location:**
- `src/utils/session-aware-cli.ts:332-379` - creation handler
- `src/handlers/tools/mittwald-cli/project/create-cli.ts:125-130` - integration

---

### Problem 3: Stale Context After Project Delete

**Before:**
```typescript
// User deletes project
await mittwald_project_delete({projectId: "p_111"});

// Session NOT updated
session.accessibleProjects = ["p_111", "p_222"]  // ❌ Includes deleted!
session.currentContext.projectId = "p_111"  // ❌ Points to deleted project!

// Next tool call fails
await mittwald_app_list();
// Uses deleted p_111 → ❌ Error: project not found
```

**After:**
```typescript
// User deletes project
await mittwald_project_delete({projectId: "p_111"});

// Session AUTOMATICALLY updated
session.accessibleProjects = ["p_222"]  // ✅ Removed p_111!
session.currentContext.projectId = undefined  // ✅ Cleared!

// Next tool call prompts for context
await mittwald_app_list();
// ❌ Error: projectId required (but clear error, not "not found")
```

**Implementation:**
- Added `sessionAwareCli.handleProjectDeleted()` method
- Called automatically in `project/delete-cli.ts` after successful deletion
- Removes deleted projectId from `accessibleProjects` array
- Clears `currentContext.projectId` if it was the deleted project

**Code location:**
- `src/utils/session-aware-cli.ts:381-422` - deletion handler
- `src/handlers/tools/mittwald-cli/project/delete-cli.ts:131-136` - integration

---

### Bonus: Removed Redundant CLI Context Tools

**Deleted 4 tools** that were broken for multi-user scenarios:
- ❌ `context/get-cli.ts` - Read CLI's ~/.mw/context.json (shared across users!)
- ❌ `context/set-cli.ts` - Write CLI's ~/.mw/context.json (race conditions!)
- ❌ `context/reset-cli.ts` - Delete CLI's context file
- ❌ `context/accessible-projects-cli.ts` - Spawn `mw project list` (slow)

**Why deleted:**
- All used shared local file `~/.mw/context.json` (unsafe for concurrent users)
- Redundant with session-aware tools (same functionality, better implementation)
- Spawn CLI processes (unnecessary overhead)

**Replaced by:**
- ✅ `mittwald_context_set_session` - Already migrated, session-safe
- ✅ `mittwald_context_get_session` - Already migrated, session-safe
- ✅ `mittwald_context_reset_session` - Already migrated, session-safe
- ✅ `mittwald_user_accessible_projects` - Already migrated (but rarely needed now!)

---

## How It Works Now

### First Login Flow

```
1. User authenticates via OAuth
   ↓
2. mcp.ts creates session with empty context
   ↓
3. mcp.ts calls sessionAwareCli.initializeSessionContext()
   ↓
4. Fetches: await sessionAwareCli.getAccessibleProjects(sessionId)
   → Returns: ["p_111", "p_222", "p_333"]
   ↓
5. Updates session:
   - accessibleProjects = ["p_111", "p_222", "p_333"]
   - currentContext = { projectId: "p_111" }  // First project
   ↓
6. User's first tool call works immediately!
   mittwald_app_list() → auto-injects p_111 ✅
```

### Project Create Flow

```
1. LLM calls: mittwald_project_create({description: "New", serverId: "s_xxx"})
   ↓
2. Project created → projectId: "p_new"
   ↓
3. Handler calls: sessionAwareCli.handleProjectCreated(sessionId, "p_new")
   ↓
4. Session updated:
   - accessibleProjects: ["p_111", "p_222", "p_333", "p_new"]  // Added
   - currentContext: { projectId: "p_new" }  // Auto-switched
   ↓
5. Subsequent tools use new project automatically
   mittwald_app_list() → auto-injects p_new ✅
```

### Project Delete Flow

```
1. LLM calls: mittwald_project_delete({projectId: "p_111"})
   ↓
2. Project deleted
   ↓
3. Handler calls: sessionAwareCli.handleProjectDeleted(sessionId, "p_111")
   ↓
4. Session updated:
   - accessibleProjects: ["p_222", "p_333"]  // Removed p_111
   - currentContext: { projectId: undefined }  // Cleared (was active)
   ↓
5. Next tool requires explicit projectId
   mittwald_app_list() → ❌ Error: projectId required
   mittwald_app_list({projectId: "p_222"}) → ✅ Works
```

---

## Edge Cases Handled

### Multiple Projects
- Auto-population sets FIRST project as default
- LLM can override by passing explicit `projectId`
- LLM can change default via `mittwald_context_set_session`

### No Projects
- Auto-population sets `currentContext = {}`
- Tools that require projectId will error clearly
- User must create a project first

### Project Creation with updateContext Flag
- `updateContext: false` → Don't set as active context (keep current)
- `updateContext: true` (default) → Set as active context
- New project always added to `accessibleProjects` regardless

### Concurrent Project Operations
- Each session maintains independent context
- User A creates project → only User A's session updated
- User B's session unaffected (isolation maintained)

---

## API for Future Use

### For Tool Handlers

```typescript
import { sessionAwareCli } from '../../utils/session-aware-cli.js';

// After creating a project
await sessionAwareCli.handleProjectCreated(sessionId, newProjectId);

// After deleting a project
await sessionAwareCli.handleProjectDeleted(sessionId, deletedProjectId);

// To refresh project list (e.g., after bulk operations)
await sessionAwareCli.refreshAccessibleProjects(sessionId);

// Manual initialization (if needed)
await sessionAwareCli.initializeSessionContext(sessionId);
```

---

## Benefits

1. **Better UX**: Tools work immediately after login (no manual context setup)
2. **Fewer Errors**: Context stays in sync with actual resources
3. **Cleaner Code**: Removed 4 redundant CLI context tools
4. **Multi-User Safe**: All context operations are session-isolated in Redis
5. **Self-Healing**: Context auto-corrects after project create/delete

---

## Testing

**Manual test flow:**
1. Authenticate via OAuth → Check session has auto-populated projects
2. Call `mittwald_app_list` without projectId → Should use first project
3. Create new project → Check session updated with new project
4. Delete active project → Check context cleared
5. Concurrent users → Verify context isolation

**Verification:**
```bash
# After login, check session
mittwald_context_get_session
# Should return: { projectId: "p_first", ... }

# Create project
mittwald_project_create --description "Test" --server-id s_xxx
# Should return new projectId

# Check context updated
mittwald_context_get_session
# Should return: { projectId: "p_new", ... }
```

---

## Files Modified

1. `src/utils/session-aware-cli.ts` - Added 4 new methods (150 lines)
2. `src/server/mcp.ts` - Added auto-initialization call (5 lines)
3. `src/handlers/tools/mittwald-cli/project/create-cli.ts` - Added session refresh (5 lines)
4. `src/handlers/tools/mittwald-cli/project/delete-cli.ts` - Added session refresh (5 lines)

## Files Deleted

1. `src/handlers/tools/mittwald-cli/context/get-cli.ts` - Redundant
2. `src/handlers/tools/mittwald-cli/context/set-cli.ts` - Redundant
3. `src/handlers/tools/mittwald-cli/context/reset-cli.ts` - Redundant
4. `src/handlers/tools/mittwald-cli/context/accessible-projects-cli.ts` - Redundant
5. `src/constants/tool/mittwald-cli/context/get-cli.ts` - Redundant
6. `src/constants/tool/mittwald-cli/context/set-cli.ts` - Redundant
7. `src/constants/tool/mittwald-cli/context/reset-cli.ts` - Redundant
8. `src/constants/tool/mittwald-cli/context/accessible-projects-cli.ts` - Redundant

---

## Impact on Migration Statistics

**Tool count changed:**
- Total tools: 175 → 171 (removed 4 CLI context tools)
- Migrated tools: 118 → 118 (no change)
- Remaining: 57 → 53 (4 fewer)

**New coverage:**
- 118 / 171 = **69% overall coverage** (up from 67%)

**Realistic coverage (excluding unmigrateable):**
- Unmigrateable: 33 tools (down from 37)
- Migrateable: 171 - 33 = 138 tools
- Coverage: 118 / 138 = **85.5% of migrateable tools**

---

## Future Enhancements (Optional)

### 1. Smart Default Selection

Instead of always using first project, could use:
- Most recently accessed project
- Project with most activity
- User's "favorite" project (if metadata available)

### 2. Context Suggestions

When context is missing, suggest valid options:
```
Error: projectId required
Available projects:
  - p_111: "Production Website"
  - p_222: "Staging Environment"
  - p_333: "Development"

Tip: Set default with mittwald_context_set_session
```

### 3. Multi-Resource Context

Extend beyond projects:
- Auto-detect servers when working with infrastructure
- Auto-detect organizations when managing teams
- Cache resource names for better error messages

---

**Generated**: 2025-12-18
**Branch**: `012-convert-mittwald-cli`
