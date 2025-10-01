# Final Agent Briefing - CLI Migration Completion (2025-10-01)

You are the **Final Agent** responsible for completing the CLI migration project. Follow this briefing exactly to finish the remaining 9 tools and achieve 100% completion.

## 📊 **Current Project Status**
- **Total Tools**: 153
- **Completed**: 144 tools (94.1%)
- **Remaining**: 9 tools for you to complete
- **Git Status**: 234+ commits ahead (but stable for your work)

---

## 1. **Files To Review Before Starting**

### **✅ Study Successful Migration Examples**
- `src/handlers/tools/mittwald-cli/container/delete-cli.ts` (Agent 3 - excellent)
- `src/handlers/tools/mittwald-cli/app/copy-cli.ts` (Agent 1 - excellent)
- `src/handlers/tools/mittwald-cli/user/api-token/get-cli.ts` (Agent 8 - excellent)

**Target Pattern**:
- Imports `invokeCliTool & CliToolError` from `src/tools/index.js`
- Uses `buildCliArgs()` helper function
- Calls `invokeCliTool({ toolName, argv, parser })`
- Includes error mapping, quiet-mode parsing, and `formatToolResponse` with metadata

### **🔧 Technical References**
- `src/tools/cli-adapter.ts` - Learn `invokeCliTool` signature
- `src/tools/index.ts` - Available imports and types

### **📋 Your Clean Task List (IGNORE HISTORICAL DOCS)**
- **USE ONLY**: `docs/2025-10-01-final-agent-clean-tasklist.md`
- **AVOID**: All other documentation files (they have conflict history)

---

## 2. **Your Assignment - 9 Tools Total**

**From Agent 4** (5 MySQL tools):
1. `mittwald_database_mysql_delete`
2. `mittwald_database_mysql_dump`
3. `mittwald_database_mysql_get`
4. `mittwald_database_mysql_import`
5. `mittwald_database_mysql_list`

**From Agent 6** (2 project tools):
6. `mittwald_project_invite_get`
7. `mittwald_project_invite_list`

**From Agent 7** (2 misc tools):
8. `mittwald_sftp_user_update`
9. `mittwald_user_accessible_projects`

**Work Order**: Complete any order, but finish each tool completely before starting the next.

---

## 3. **Handler Migration Checklist**

### **Step 1: Analyze Current Handler**
- Open the file from your task list
- Understand required args, optional flags, current error handling
- Note any special behaviors (quiet mode, output formats)

### **Step 2: Apply Migration Pattern**
```typescript
// REPLACE these imports:
import { executeCli } from '../../../../utils/cli-wrapper.js';

// WITH:
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
```

**Required Functions**:
```typescript
function buildCliArgs(args: ToolArgs): string[] {
  const cliArgs: string[] = ['command', 'subcommand'];
  // Add your specific CLI arguments
  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  // Add domain-specific error handling
  if (combined.includes('not found')) {
    return `Resource not found. Error: ${error.stderr || error.message}`;
  }

  return error.message;
}
```

**Replace CLI execution**:
```typescript
// REPLACE:
const result = await executeCli('mw', cliArgs);

// WITH:
const result = await invokeCliTool({
  toolName: 'exact_tool_name_from_tasklist',
  argv: buildCliArgs(args),
  parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
});
```

**Error handling**:
```typescript
try {
  // invokeCliTool call

  return formatToolResponse(
    'success',
    'Success message',
    result.result,
    {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    }
  );
} catch (error) {
  if (error instanceof CliToolError) {
    return formatToolResponse('error', mapCliError(error), {
      exitCode: error.exitCode,
      stderr: error.stderr,
      stdout: error.stdout,
      suggestedAction: error.suggestedAction,
    });
  }

  return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
}
```

### **Step 3: Quality Verification**
- ✅ TypeScript compiles: `npm run type-check`
- ✅ Tests pass: `npm run test:unit --run tests/unit/tools/cli-adapter.test.ts`
- ✅ No `executeCli` imports remain
- ✅ Uses `invokeCliTool` pattern correctly

### **Step 4: Commit (One Tool at a Time)**
```bash
git add src/handlers/tools/mittwald-cli/[specific-file].ts
git commit -m "feat: migrate [tool_name] to CLI adapter

Migrate [tool_name] from legacy executeCli to invokeCliTool pattern.
Adds proper error handling, metadata tracking, and CLI adapter compliance.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 4. **🚫 AVOID These Files (Conflict Prevention)**

**DO NOT EDIT** (they have multi-agent conflict history):
- ❌ `docs/2025-09-29-cli-tool-inventory.json`
- ❌ `docs/2025-09-29-mcp-cli-hardening-plan.md`
- ❌ `docs/2025-09-29-cli-refactor-architecture.md`

**You have everything you need** in your clean task list document.

---

## 5. **Quality & Consistency Requirements**

### **✅ Required in Every Migration**
- `buildCliArgs()` function for argument construction
- `mapCliError()` function for CLI error handling
- `invokeCliTool()` with correct toolName and parser
- `CliToolError` handling in catch blocks
- `formatToolResponse()` with metadata (command, durationMs)
- Preserve original CLI behavior (flags, quiet mode, output formats)

### **✅ Code Quality Standards**
- ASCII only (unless existing file uses UTF-8)
- Minimal comments, focused on functionality
- Preserve existing CLI semantics exactly
- Structured objects for JSON outputs, raw text fallback on parse failure

---

## 6. **If You Encounter Issues**

### **🛑 STOP and Ask If:**
- CLI behavior is unclear or undocumented
- Conflicting patterns in reference implementations
- File missing or has unexpected structure
- Tests fail after migration
- TypeScript compilation errors

**Do not guess** - ask for clarification to maintain quality.

---

## 7. **Process for Each Tool**

1. **Read** legacy handler & study successful examples
2. **Migrate** to `invokeCliTool` pattern with all required functions
3. **Test** with `npm run type-check` and unit tests
4. **Commit** immediately (one tool per commit)
5. **Next tool** - repeat until all 9 complete

---

## 8. **Success Criteria**

**You are complete when**:
- ✅ All 9 tools use `invokeCliTool` pattern
- ✅ Zero `executeCli` usage in your assigned files
- ✅ TypeScript compilation passes
- ✅ Unit tests pass
- ✅ All commits clean and descriptive

---

## 9. **Git Safety Protocol**

### **✅ Safe Practices**
- **One tool per commit** - avoid batch commits
- **Stage only your files** - avoid cross-contamination
- **Commit immediately** after each tool completion
- **DO NOT REBASE** - use regular commits only

### **🚫 Conflict Avoidance**
- **Don't edit documentation files** (you have clean task list)
- **Don't batch multiple tools** in one commit
- **Don't modify agent assignments** or inventory structure

---

## 🎯 **Final Mission**

**Complete these 9 tools to achieve 100% project completion:**

**Agent 4 MySQL Tools** (5):
- mittwald_database_mysql_delete
- mittwald_database_mysql_dump
- mittwald_database_mysql_get
- mittwald_database_mysql_import
- mittwald_database_mysql_list

**Agent 6 Project Tools** (2):
- mittwald_project_invite_get
- mittwald_project_invite_list

**Agent 7 Misc Tools** (2):
- mittwald_sftp_user_update
- mittwald_user_accessible_projects

**Timeline**: 4-5 hours estimated for complete project finish
**Reference**: Use `docs/2025-10-01-final-agent-clean-tasklist.md` for detailed implementation guidance

**You are the final agent - finish strong and achieve 100% completion! 🏁**