# Final Agent Clean Task List (2025-10-01)

## 🎯 **Final Sprint Status**

**Project Progress**: 144/153 tools migrated (94.1% complete)
**Remaining Work**: Only 9 tools left!

## 📋 **Clean Task List for Final Agent**

### **Remaining Tools by Current Assignment**

#### **Agent 4 - MySQL Database Tools (5 remaining)**
1. **mittwald_database_mysql_delete**
   - File: `src/handlers/tools/mittwald-cli/database/mysql/delete-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

2. **mittwald_database_mysql_dump**
   - File: `src/handlers/tools/mittwald-cli/database/mysql/dump-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

3. **mittwald_database_mysql_get**
   - File: `src/handlers/tools/mittwald-cli/database/mysql/get-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

4. **mittwald_database_mysql_import**
   - File: `src/handlers/tools/mittwald-cli/database/mysql/import-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

5. **mittwald_database_mysql_list**
   - File: `src/handlers/tools/mittwald-cli/database/mysql/list-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

#### **Agent 6 - Project Invite Tools (2 remaining)**
6. **mittwald_project_invite_get**
   - File: `src/handlers/tools/mittwald-cli/project/invite-get-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

7. **mittwald_project_invite_list**
   - File: `src/handlers/tools/mittwald-cli/project/invite-list-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

#### **Agent 7 - SFTP/Context Tools (2 remaining)**
8. **mittwald_sftp_user_update**
   - File: `src/handlers/tools/mittwald-cli/sftp/user-update-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

9. **mittwald_user_accessible_projects**
   - File: `src/handlers/tools/mittwald-cli/context/accessible-projects-cli.ts`
   - Required: Migrate from `executeCli` to `invokeCliTool`

## 🔧 **Migration Pattern (Use This Exact Template)**

### **Step 1: Update Imports**
```typescript
// REPLACE:
import { executeCli } from '../../../../utils/cli-wrapper.js';

// WITH:
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
```

### **Step 2: Add buildCliArgs Function**
```typescript
function buildCliArgs(args: ToolArgs): string[] {
  const cliArgs: string[] = ['command', 'subcommand'];
  // Add arguments based on tool requirements
  return cliArgs;
}
```

### **Step 3: Add Error Mapping Function**
```typescript
function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  // Add domain-specific error handling
  if (combined.includes('not found')) {
    return `Resource not found. Error: ${error.stderr || error.message}`;
  }

  return error.message;
}
```

### **Step 4: Replace CLI Execution**
```typescript
// REPLACE:
const result = await executeCli('mw', cliArgs);

// WITH:
const result = await invokeCliTool({
  toolName: 'tool_name_here',
  argv: buildCliArgs(args),
  parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
});
```

### **Step 5: Update Error Handling**
```typescript
try {
  // invokeCliTool call here
} catch (error) {
  if (error instanceof CliToolError) {
    const message = mapCliError(error);
    return formatToolResponse('error', message, {
      exitCode: error.exitCode,
      stderr: error.stderr,
      stdout: error.stdout,
      suggestedAction: error.suggestedAction,
    });
  }

  return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
}
```

## ✅ **Quality Requirements**

Each migrated tool must have:
- ✅ **buildCliArgs()** function
- ✅ **mapCliError()** function
- ✅ **invokeCliTool()** usage
- ✅ **CliToolError** handling
- ✅ **formatToolResponse()** with metadata
- ✅ **TypeScript compilation** passes

## 🚫 **Avoid Documentation Conflicts**

**DO NOT EDIT THESE FILES** (to avoid conflicts):
- ❌ `docs/2025-09-29-mcp-cli-hardening-plan.md`
- ❌ `docs/2025-09-29-cli-tool-inventory.json`

**This document is your complete task list** - no need to reference the conflicted historical documents.

## 🎯 **Success Criteria**

**Final Agent is complete when**:
- All 9 tools use `invokeCliTool` pattern
- No `executeCli` usage remains in any pending files
- TypeScript compilation passes
- All tools follow established quality patterns

## 📊 **Progress Tracking**

Mark tools complete as you finish them:

- [ ] mittwald_database_mysql_delete (Agent 4)
- [ ] mittwald_database_mysql_dump (Agent 4)
- [ ] mittwald_database_mysql_get (Agent 4)
- [ ] mittwald_database_mysql_import (Agent 4)
- [ ] mittwald_database_mysql_list (Agent 4)
- [ ] mittwald_project_invite_get (Agent 6)
- [ ] mittwald_project_invite_list (Agent 6)
- [ ] mittwald_sftp_user_update (Agent 7)
- [ ] mittwald_user_accessible_projects (Agent 7)

---

**Document Created**: 2025-10-01
**Purpose**: Clean task list avoiding historical document conflicts
**Target**: Single final agent to complete remaining 9 tools (94.1% → 100%)