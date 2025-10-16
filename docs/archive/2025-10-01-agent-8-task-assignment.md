# Agent 8 Task Assignment - CORRECTED (2025-10-01)

## Current Situation Assessment

The previous Agent 8 work has been audited and the inventory corrected to reflect reality. Agent 8 has **partial completion** that was incorrectly tracked.

## ✅ **ALREADY COMPLETED** (Do NOT redo these)

The following 3 tools are **ALREADY MIGRATED** and working correctly:

1. **mittwald_user_api_token_get** ✅
   - File: `src/handlers/tools/mittwald-cli/user/api-token/get-cli.ts`
   - Status: Uses `invokeCliTool` correctly
   - Quality: Good implementation with proper error handling

2. **mittwald_user_api_token_list** ✅
   - File: `src/handlers/tools/mittwald-cli/user/api-token/list-cli.ts`
   - Status: Uses `invokeCliTool` correctly
   - Quality: Good implementation with JSON parsing

3. **mittwald_user_api_token_revoke** ✅
   - File: `src/handlers/tools/mittwald-cli/user/api-token/revoke-cli.ts`
   - Status: Uses `invokeCliTool` correctly
   - Quality: Good implementation with proper response handling

## 🔄 **REMAINING WORK FOR NEW AGENT 8**

The following **10 tools** still need migration from legacy `executeCli` to the new `invokeCliTool` adapter:

### **Primary Tasks (10 tools to migrate)**

1. **mittwald_user_get** ❌
   - File: `src/handlers/tools/mittwald-cli/user/get-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

2. **mittwald_user_session_get** ❌
   - File: `src/handlers/tools/mittwald-cli/user/session/get-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

3. **mittwald_user_session_list** ❌
   - File: `src/handlers/tools/mittwald-cli/user/session/list-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

4. **mittwald_user_ssh_key_create** ❌
   - File: `src/handlers/tools/mittwald-cli/user/ssh-key/create-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

5. **mittwald_user_ssh_key_delete** ❌
   - File: `src/handlers/tools/mittwald-cli/user/ssh-key/delete-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

6. **mittwald_user_ssh_key_get** ❌
   - File: `src/handlers/tools/mittwald-cli/user/ssh-key/get-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

7. **mittwald_user_ssh_key_import** ❌
   - File: `src/handlers/tools/mittwald-cli/user/ssh-key/import-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

8. **mittwald_user_ssh_key_list** ❌
   - File: `src/handlers/tools/mittwald-cli/user/ssh-key/list-cli.ts`
   - Current: Uses `executeCli`
   - Required: Migrate to `invokeCliTool` pattern

### **Additional Files (2 unknown tools)**

9. **Database index CLI** ❓
   - File: `src/constants/tool/mittwald-cli/database/index-cli.ts`
   - Current: Unknown tool/handler
   - Required: Assess and migrate if needed

10. **Login status CLI** ❓
    - File: `src/constants/tool/mittwald-cli/login/status-cli.ts`
    - Current: Unknown tool/handler
    - Required: Assess and migrate if needed

## 📋 **Migration Checklist for New Agent 8**

For each tool, follow this pattern:

### **Step 1: Code Migration**
1. Change import from `import { executeCli } from '../../../../utils/cli-wrapper.js'`
2. To: `import { invokeCliTool, CliToolError } from '../../../../tools/index.js'`
3. Replace `executeCli('mw', cliArgs)` calls with `invokeCliTool({ toolName: '...', argv, parser })`
4. Add proper error handling with `CliToolError`
5. Ensure `formatToolResponse` usage with metadata

### **Step 2: Quality Requirements**
- ✅ **buildCliArgs()** function for argument construction
- ✅ **Error mapping** function for CLI error handling
- ✅ **Type safety** with proper TypeScript interfaces
- ✅ **Parser function** for output processing
- ✅ **Metadata inclusion** in responses

### **Step 3: Documentation**
1. Update tool status to "migrated" in `docs/2025-09-29-cli-tool-inventory.json`
2. Add notes: "converted to invokeCliTool"
3. Log completion in hardening plan document

## 🎯 **Success Criteria**

Agent 8 will be considered complete when:
- ✅ All 10 remaining tools use `invokeCliTool` pattern
- ✅ No `executeCli` imports remain in Agent 8 files
- ✅ All tools pass TypeScript compilation
- ✅ Inventory tracking is accurate and up-to-date
- ✅ Documentation is updated

## 📊 **Current Agent 8 Status**
- **Completed**: 3/13 tools (23%)
- **Remaining**: 10/13 tools (77%)
- **Status**: **WORK IN PROGRESS** (not finished as previously claimed)

---

**Document Created**: 2025-10-01
**Purpose**: Clean start for new Agent 8 with accurate current state
**Priority**: High - completes user management tool migration