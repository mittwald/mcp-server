# Agent B2: Stack Taxonomy Alignment

## Your Identity
You are **Agent B2**, responsible for **aligning Stack tool naming with the current CLI taxonomy**. The CLI renamed `container stack` → `stack`, but MCP tools still use the old naming. Your job is to fix this inconsistency.

## Your Mission
Rename all stack-related tools and handlers from `container/stack-*` → `stack/*` and update tool names from `mittwald_container_stack_*` → `mittwald_stack_*`.

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis and taxonomy drift explanation
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (B) details, section 2.2

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 260-267 show stack commands marked as "missing"
6. **`mw-cli-coverage.json`** - Search for "stack" to see the gap

### Code to Understand
7. **`src/utils/tool-scanner.ts`** - How tools are discovered
8. **`src/constants/tool/mittwald-cli/container/`** - Current location of stack tools
9. Look for files matching `*stack*.ts` in the container directory

### Reference Work
10. **`docs/migrations/registry-rename-2025-10.md`** - Review Agent B1's migration notes (if available)
11. Follow the same pattern as Agent B1's registry rename

## Your Task List

### Task B2.1: Audit Current Stack Tools
- [ ] List all stack-related files:
  ```bash
  find src/constants/tool/mittwald-cli/container -name "*stack*" -type f
  ```
- [ ] Document current tools in a checklist:
  - [ ] `mittwald_container_stack_delete`
  - [ ] `mittwald_container_stack_deploy`
  - [ ] `mittwald_container_stack_list`
  - [ ] `mittwald_container_stack_ps`
- [ ] Note their current file paths and tool names
- [ ] Commit with message: `docs(stack): audit current stack tool structure`

### Task B2.2: Create New Stack Directory Structure
- [ ] Create directory: `src/constants/tool/mittwald-cli/stack/`
- [ ] Create directory: `src/handlers/tools/mittwald-cli/stack/` (if handlers exist separately)
- [ ] Commit with message: `feat(stack): create new stack directory structure`

### Task B2.3: Move and Rename Stack Tool Files
For each stack tool:
- [ ] **Delete**: Copy `container/stack-delete-cli.ts` → `stack/delete-cli.ts`
- [ ] **Deploy**: Copy `container/stack-deploy-cli.ts` → `stack/deploy-cli.ts`
- [ ] **List**: Copy `container/stack-list-cli.ts` → `stack/list-cli.ts`
- [ ] **Ps**: Copy `container/stack-ps-cli.ts` → `stack/ps-cli.ts`
- [ ] Commit with message: `refactor(stack): move tool files to new directory structure`

### Task B2.4: Update Tool Names and Metadata
For each moved file, update:
- [ ] Tool name: `mittwald_container_stack_delete` → `mittwald_stack_delete`
- [ ] Tool title/description: Remove "container" references
- [ ] CLI command segments: Verify they use `["stack", "delete"]` not `["container", "stack", "delete"]`
- [ ] Example for delete-cli.ts:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_stack_delete",  // Changed
    description: "Delete a container stack",
    inputSchema: { /* ... */ }
  };

  // In handler, ensure CLI command is:
  await invokeCliTool({
    toolName: "mittwald_stack_delete",
    argv: ["stack", "delete", stackId, ...],  // Verify segments!
    sessionId,
    parser: parseStackDeleteOutput
  });
  ```
- [ ] Pay special attention to `stack deploy` - it may have complex arguments
- [ ] Commit with message: `refactor(stack): update tool names to match CLI taxonomy`

### Task B2.5: Update Tool Scanner (if needed)
- [ ] Check if tool scanner automatically discovers the new `stack/` directory
- [ ] If not, update `src/utils/tool-scanner.ts` to include the new path
- [ ] Test discovery: `npm run build && node -e "require('./build/constants/tools.js').initializeTools().then(() => console.log('Tools loaded'))"`
- [ ] Commit with message: `fix(scanner): ensure stack tools are discovered`

### Task B2.6: Delete Old Files
- [ ] Remove old files from `src/constants/tool/mittwald-cli/container/stack-*.ts`
- [ ] Remove old handler files if they exist separately
- [ ] Commit with message: `refactor(stack): remove deprecated container/stack files`

### Task B2.7: Update Tests (if any)
- [ ] Search for test files referencing stack tools:
  ```bash
  grep -r "mittwald_container_stack" tests/
  ```
- [ ] Update test imports and tool names
- [ ] Run tests: `npm run test:unit`
- [ ] Commit with message: `test(stack): update tests for renamed stack tools`

### Task B2.8: Update Documentation
- [ ] Create migration notes: `docs/migrations/stack-rename-2025-10.md`
  ```markdown
  # Stack Tool Rename (October 2025)

  ## Breaking Changes
  The following tools have been renamed to align with CLI v1.11.2:

  | Old Name | New Name |
  |----------|----------|
  | mittwald_container_stack_delete | mittwald_stack_delete |
  | mittwald_container_stack_deploy | mittwald_stack_deploy |
  | mittwald_container_stack_list | mittwald_stack_list |
  | mittwald_container_stack_ps | mittwald_stack_ps |

  ## Migration Path
  Update your MCP client code to use the new tool names. The old names are no longer available as of version X.X.X.

  ## Notes
  - `stack deploy` now uses the updated CLI command structure
  - Docker Compose file parsing remains unchanged
  ```
- [ ] Add entry to `CHANGELOG.md` (if it exists)
- [ ] Update `README.md` if it references stack tools
- [ ] Commit with message: `docs(stack): add migration guide for renamed tools`

### Task B2.9: Regenerate Coverage Reports
- [ ] Run coverage generator (if Agent A1 completed): `npm run coverage:generate`
- [ ] Verify stack commands now show as "covered" in `docs/mittwald-cli-coverage.md`
- [ ] Commit with message: `docs(coverage): update reports after stack rename`

### Task B2.10: Verification & Testing
- [ ] Build project: `npm run build`
- [ ] Run type checking: `npm run type-check`
- [ ] Test tool discovery: Verify 4 stack tools appear in tool list
- [ ] Manual test (if possible): Call `mittwald_stack_list` via MCP Inspector
- [ ] Commit with message: `test(stack): verify renamed tools function correctly`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH task** (10 commits minimum)
- ✅ **Use conventional commit format**: `refactor(stack): description`
- ❌ **DO NOT rebase** - keep linear history
- ❌ **DO NOT squash commits** - coordinator needs to review each step
- ✅ **Push after every 2-3 commits**

### Code Quality
- Follow the exact same pattern as Agent B1 (registry rename)
- Do NOT change handler logic—only names and paths
- Ensure all imports are updated
- Run `npm run lint` before final commit

### Breaking Changes
- This is a **BREAKING CHANGE** for MCP clients
- Must be coordinated with Agent B1's registry changes
- Combined with B1, should trigger a major version bump

### When to Ask for Help
- ❓ Stack deploy tool has complex arguments that are unclear
- ❓ Tool scanner doesn't discover new stack directory
- ❓ CLI command segments differ from registry pattern
- ❓ Tests fail and you need debugging help
- ❓ **ANY time you're blocked for >20 minutes**

## Success Criteria
- [ ] All 4 stack tools moved from `container/` → `stack/`
- [ ] Tool names updated: `mittwald_container_stack_*` → `mittwald_stack_*`
- [ ] Old files deleted
- [ ] Tool scanner discovers new tools
- [ ] Tests pass (if any exist)
- [ ] Migration notes published
- [ ] Coverage reports updated (if Agent A1 complete)
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format

## Dependencies
**Blocking**: None - you can work in parallel with Agent B1!
**Recommended**: Review Agent B1's work to ensure consistency

**Blocked by you**: None

## Coordination with Agent B1
- You and Agent B1 are doing the **same type of work** on different tools
- **Compare notes** if you encounter unexpected issues
- **Use the same commit message style** for consistency
- **Share migration note template** to maintain uniform documentation

## Handoff to Coordinator
When complete, report:
1. ✅ List of renamed tools (old → new names)
2. ✅ New file structure
3. ✅ Migration notes location
4. ✅ Any differences from Agent B1's approach
5. ✅ Verification test results

## Estimated Effort
**1-2 days** (straightforward rename, mechanical work)

---

**Remember**: Mirror Agent B1's approach. Document thoroughly. Test carefully. Commit frequently. You've got this! 🎯
