# Agent B1: Registry Taxonomy Alignment

## Your Identity
You are **Agent B1**, responsible for **aligning Registry tool naming with the current CLI taxonomy**. The CLI renamed `container registry` → `registry`, but MCP tools still use the old naming. Your job is to fix this inconsistency.

## Your Mission
Rename all registry-related tools and handlers from `container/registry-*` → `registry/*` and update tool names from `mittwald_container_registry_*` → `mittwald_registry_*`.

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis and taxonomy drift explanation
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (B) details, section 2.1

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 226-233 show registry commands marked as "missing"
6. **`mw-cli-coverage.json`** - Search for "registry" to see the gap

### Code to Understand
7. **`src/utils/tool-scanner.ts`** - How tools are discovered (will need to scan new paths)
8. **`src/constants/tool/mittwald-cli/container/`** - Current location of registry tools
9. Look for files matching `*registry*.ts` in the container directory

### Example Tool Structure
10. Read any registry tool file to understand the `ToolRegistration` export format
11. **`src/tools/cli-adapter.ts`** - How handlers invoke CLI commands

## Your Task List

### Task B1.1: Audit Current Registry Tools
- [ ] List all registry-related files:
  ```bash
  find src/constants/tool/mittwald-cli/container -name "*registry*" -type f
  ```
- [ ] Document current tools in a checklist:
  - [ ] `mittwald_container_registry_create`
  - [ ] `mittwald_container_registry_delete`
  - [ ] `mittwald_container_registry_list`
  - [ ] `mittwald_container_registry_update`
- [ ] Note their current file paths and tool names
- [ ] Commit with message: `docs(registry): audit current registry tool structure`

### Task B1.2: Create New Registry Directory Structure
- [ ] Create directory: `src/constants/tool/mittwald-cli/registry/`
- [ ] Create directory: `src/handlers/tools/mittwald-cli/registry/` (if handlers exist separately)
- [ ] Commit with message: `feat(registry): create new registry directory structure`

### Task B1.3: Move and Rename Registry Tool Files
For each registry tool:
- [ ] **Create**: Copy file from `container/registry-create-cli.ts` → `registry/create-cli.ts`
- [ ] **Delete**: Copy file from `container/registry-delete-cli.ts` → `registry/delete-cli.ts`
- [ ] **List**: Copy file from `container/registry-list-cli.ts` → `registry/list-cli.ts`
- [ ] **Update**: Copy file from `container/registry-update-cli.ts` → `registry/update-cli.ts`
- [ ] Commit with message: `refactor(registry): move tool files to new directory structure`

### Task B1.4: Update Tool Names and Metadata
For each moved file, update:
- [ ] Tool name: `mittwald_container_registry_create` → `mittwald_registry_create`
- [ ] Tool title/description: Remove "container" references
- [ ] CLI command segments: Verify they use `["registry", "create"]` not `["container", "registry", "create"]`
- [ ] Example for create-cli.ts:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_registry_create",  // Changed
    description: "Create a new container registry",
    inputSchema: { /* ... */ }
  };

  // In handler, ensure CLI command is:
  await invokeCliTool({
    toolName: "mittwald_registry_create",
    argv: ["registry", "create", ...],  // Verify this!
    sessionId,
    parser: parseRegistryCreateOutput
  });
  ```
- [ ] Commit with message: `refactor(registry): update tool names to match CLI taxonomy`

### Task B1.5: Update Tool Scanner (if needed)
- [ ] Check if tool scanner automatically discovers the new `registry/` directory
- [ ] If not, update `src/utils/tool-scanner.ts` to include the new path
- [ ] Test discovery: `npm run build && node -e "require('./build/constants/tools.js').initializeTools().then(() => console.log('Tools loaded'))"`
- [ ] Commit with message: `fix(scanner): ensure registry tools are discovered`

### Task B1.6: Delete Old Files
- [ ] Remove old files from `src/constants/tool/mittwald-cli/container/registry-*.ts`
- [ ] Remove old handler files if they exist separately
- [ ] Commit with message: `refactor(registry): remove deprecated container/registry files`

### Task B1.7: Update Tests (if any)
- [ ] Search for test files referencing registry tools:
  ```bash
  grep -r "mittwald_container_registry" tests/
  ```
- [ ] Update test imports and tool names
- [ ] Run tests: `npm run test:unit`
- [ ] Commit with message: `test(registry): update tests for renamed registry tools`

### Task B1.8: Update Documentation
- [ ] Create migration notes: `docs/migrations/registry-rename-2025-10.md`
  ```markdown
  # Registry Tool Rename (October 2025)

  ## Breaking Changes
  The following tools have been renamed to align with CLI v1.11.2:

  | Old Name | New Name |
  |----------|----------|
  | mittwald_container_registry_create | mittwald_registry_create |
  | mittwald_container_registry_delete | mittwald_registry_delete |
  | mittwald_container_registry_list | mittwald_registry_list |
  | mittwald_container_registry_update | mittwald_registry_update |

  ## Migration Path
  Update your MCP client code to use the new tool names. The old names are no longer available as of version X.X.X.
  ```
- [ ] Add entry to `CHANGELOG.md` (if it exists)
- [ ] Update `README.md` if it references registry tools
- [ ] Commit with message: `docs(registry): add migration guide for renamed tools`

### Task B1.9: Regenerate Coverage Reports
- [ ] Run coverage generator (if Agent A1 completed): `npm run coverage:generate`
- [ ] Verify registry commands now show as "covered" in `docs/mittwald-cli-coverage.md`
- [ ] Commit with message: `docs(coverage): update reports after registry rename`

### Task B1.10: Verification & Testing
- [ ] Build project: `npm run build`
- [ ] Run type checking: `npm run type-check`
- [ ] Test tool discovery: Verify 4 registry tools appear in tool list
- [ ] Manual test (if possible): Call `mittwald_registry_list` via MCP Inspector
- [ ] Commit with message: `test(registry): verify renamed tools function correctly`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH task** (10 commits minimum for this work)
- ✅ **Use conventional commit format**: `refactor(registry): description`
- ❌ **DO NOT rebase** - keep linear history
- ❌ **DO NOT squash commits** - coordinator needs granular history
- ✅ **Push after every 2-3 commits** so work is backed up

### Code Quality
- Maintain existing code style (imports, formatting, JSDoc)
- Do NOT change handler logic—only names and paths
- Ensure all exports are correct (TypeScript will catch missing exports)
- Run `npm run lint` before final commit

### Breaking Changes
- This is a **BREAKING CHANGE** for MCP clients
- Document it clearly in migration notes
- Consider semantic versioning: this should trigger a major version bump

### When to Ask for Help
- ❓ Tool scanner doesn't discover new registry directory
- ❓ CLI command segments are unclear (should it be `["registry"]` or `["container", "registry"]`?)
- ❓ Tests fail after rename and you can't diagnose why
- ❓ Existing registry tools have unexpected dependencies
- ❓ **ANY time you're blocked for >20 minutes**

## Success Criteria
- [ ] All 4 registry tools moved from `container/` → `registry/`
- [ ] Tool names updated: `mittwald_container_registry_*` → `mittwald_registry_*`
- [ ] Old files deleted
- [ ] Tool scanner discovers new tools
- [ ] Tests pass (if any exist)
- [ ] Migration notes published
- [ ] Coverage reports updated (if Agent A1 complete)
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format

## Dependencies
**Blocking**: None - you can start immediately!
**Recommended**: Wait for Agent A1 to complete coverage generator (makes verification easier)

**Blocked by you**: Agent B2 (Stack rename) can work in parallel

## Handoff to Coordinator
When complete, report:
1. ✅ List of renamed tools (old → new names)
2. ✅ New file structure
3. ✅ Migration notes location
4. ✅ Any unexpected issues or deviations
5. ✅ Verification test results

## Estimated Effort
**1-2 days** (straightforward rename, mostly mechanical)

---

**Remember**: This is a breaking change. Document it thoroughly. Test carefully. Commit frequently. You've got this! 🎯
