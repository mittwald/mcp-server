# Agent C1: App Dependency Metadata Implementation

## Your Identity
You are **Agent C1**, responsible for implementing **app dependency management wrappers**. These are quick-win tools that provide visibility into application dependencies—a common developer need. You'll be adding 3 new tools for listing, updating, and versioning app dependencies.

## Your Mission
Implement MCP tool wrappers for:
- `app dependency list` - Get all available dependencies
- `app dependency update` - Update app dependencies
- `app dependency versions` - Get all available versions of a dependency

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis, your work is in section 3
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (C1) details

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 21-23 show your missing commands
6. **`mw-cli-coverage.json`** - Search for "app dependency" to see gaps

### Code Patterns to Follow
7. **`src/tools/cli-adapter.ts`** - The `invokeCliTool()` function you'll use
8. **`src/tools/error.ts`** - How to handle CLI errors
9. **`src/constants/tool/mittwald-cli/app/list-cli.ts`** - Example app tool
10. **`src/constants/tool/mittwald-cli/app/get-cli.ts`** - Example with parsing
11. **`src/constants/tool/mittwald-cli/app/versions-cli.ts`** - Similar versions pattern

### App Management Context
12. Review `src/constants/tool/mittwald-cli/app/*.ts` to understand app tool patterns
13. **`src/utils/session-aware-cli.ts`** - Session context injection

### CLI Command Reference
14. Run locally (if possible):
    ```bash
    mw app dependency list --help
    mw app dependency update --help
    mw app dependency versions --help
    ```

## Your Task List

### Task C1.1: App Dependency List
- [ ] Create file: `src/constants/tool/mittwald-cli/app/dependency-list-cli.ts`
- [ ] Study CLI: `mw app dependency list --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_app_dependency_list",
    description: "Get all available dependencies for application types",
    inputSchema: {
      type: "object",
      properties: {
        appType: {
          type: "string",
          description: "Application type to list dependencies for (e.g., 'wordpress', 'nodejs', 'php')",
          enum: ["wordpress", "nodejs", "php", "python", "static"]  // Verify these!
        },
        appId: {
          type: "string",
          description: "Optional: App installation ID to list dependencies for (format: a-XXXXX)"
        }
      },
      required: []  // May have no required params if it lists all general dependencies
    }
  };
  ```
- [ ] Implement handler:
  ```typescript
  async function handler(args: { appType?: string; appId?: string }) {
    const argv = ["app", "dependency", "list"];
    if (args.appType) argv.push("--app-type", args.appType);
    if (args.appId) argv.push("--app-id", args.appId);
    argv.push("--output", "json");

    const result = await invokeCliTool({
      toolName: "mittwald_app_dependency_list",
      argv,
      sessionId: getCurrentSessionId(),
      parser: parseDependencyListOutput
    });

    return {
      content: [{
        type: "text",
        text: formatDependencyList(result.result)
      }]
    };
  }
  ```
- [ ] Create parser for JSON output (likely array of dependency objects)
- [ ] Format output as readable list (Dependency Name, Current Version, Latest Version, Type)
- [ ] Export `ToolRegistration`
- [ ] Commit with message: `feat(app): add app dependency list tool`

### Task C1.2: App Dependency Update
- [ ] Create file: `src/constants/tool/mittwald-cli/app/dependency-update-cli.ts`
- [ ] Study CLI: `mw app dependency update --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_app_dependency_update",
    description: "Update one or more dependencies for an app installation",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "App installation ID (format: a-XXXXX)"
        },
        dependency: {
          type: "string",
          description: "Dependency name to update (e.g., 'php', 'nodejs', 'composer')"
        },
        version: {
          type: "string",
          description: "Target version to update to"
        },
        all: {
          type: "boolean",
          description: "Update all dependencies to latest versions"
        }
      },
      required: ["appId"]
    }
  };
  ```
- [ ] Implement handler:
  - If `all: true`, update all dependencies
  - If `dependency` specified, update that specific dependency
  - If `version` specified with dependency, update to that version
- [ ] Handle update confirmation (may be required by CLI)
- [ ] Parse update result (likely shows updated dependencies)
- [ ] Commit with message: `feat(app): add app dependency update tool`

### Task C1.3: App Dependency Versions
- [ ] Create file: `src/constants/tool/mittwald-cli/app/dependency-versions-cli.ts`
- [ ] Study CLI: `mw app dependency versions --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_app_dependency_versions",
    description: "Get all available versions of a particular dependency",
    inputSchema: {
      type: "object",
      properties: {
        dependency: {
          type: "string",
          description: "Dependency name to list versions for (e.g., 'php', 'nodejs', 'mysql')"
        },
        appType: {
          type: "string",
          description: "Application type context (optional)"
        }
      },
      required: ["dependency"]
    }
  };
  ```
- [ ] Implement handler with version list parsing
- [ ] Format output as list of available versions (Version, Status, Recommended)
- [ ] Commit with message: `feat(app): add app dependency versions tool`

### Task C1.4: Add Unit Tests
- [ ] Create test file: `tests/unit/tools/app-dependency.test.ts`
- [ ] Mock CLI output for all 3 commands
- [ ] Test parser functions handle:
  - Empty dependency list
  - Multiple dependencies with various versions
  - Version list with recommended markers
- [ ] Test error cases (invalid app ID, unknown dependency)
- [ ] Commit with message: `test(app): add app dependency tool tests`

### Task C1.5: Integration Testing
- [ ] Verify tool discovery: All 3 new tools appear in tool list
- [ ] Test with MCP Inspector (if available):
  - List dependencies for WordPress app
  - Check versions for PHP dependency
  - Test update (in safe environment)
- [ ] Verify session context is injected correctly
- [ ] Commit with message: `test(app): verify integration of app dependency tools`

### Task C1.6: Documentation
- [ ] Create `docs/tool-examples/app-dependencies.md`:
  ```markdown
  # App Dependency Management Examples

  ## List Available Dependencies

  ### List all general dependencies
  \`\`\`json
  {
    "name": "mittwald_app_dependency_list",
    "arguments": {}
  }
  \`\`\`

  ### List dependencies for specific app type
  \`\`\`json
  {
    "name": "mittwald_app_dependency_list",
    "arguments": {
      "appType": "wordpress"
    }
  }
  \`\`\`

  ### List dependencies for specific app installation
  \`\`\`json
  {
    "name": "mittwald_app_dependency_list",
    "arguments": {
      "appId": "a-abc123"
    }
  }
  \`\`\`

  ## Check Available Versions

  ### List PHP versions
  \`\`\`json
  {
    "name": "mittwald_app_dependency_versions",
    "arguments": {
      "dependency": "php"
    }
  }
  \`\`\`

  ### List Node.js versions for Node apps
  \`\`\`json
  {
    "name": "mittwald_app_dependency_versions",
    "arguments": {
      "dependency": "nodejs",
      "appType": "nodejs"
    }
  }
  \`\`\`

  ## Update Dependencies

  ### Update specific dependency to latest
  \`\`\`json
  {
    "name": "mittwald_app_dependency_update",
    "arguments": {
      "appId": "a-abc123",
      "dependency": "php"
    }
  }
  \`\`\`

  ### Update to specific version
  \`\`\`json
  {
    "name": "mittwald_app_dependency_update",
    "arguments": {
      "appId": "a-abc123",
      "dependency": "php",
      "version": "8.2"
    }
  }
  \`\`\`

  ### Update all dependencies
  \`\`\`json
  {
    "name": "mittwald_app_dependency_update",
    "arguments": {
      "appId": "a-abc123",
      "all": true
    }
  }
  \`\`\`

  ## Common Use Cases

  1. **Check PHP compatibility**: List available PHP versions before upgrading an app
  2. **Bulk updates**: Update all dependencies to latest stable versions
  3. **Version planning**: See what versions are available for migration planning
  ```
- [ ] Commit with message: `docs(app): add usage examples for app dependency tools`

### Task C1.7: Regenerate Coverage Reports
- [ ] Run: `npm run coverage:generate` (if Agent A1 completed)
- [ ] Verify 3 new tools show as covered in `docs/mittwald-cli-coverage.md`
- [ ] Commit with message: `docs(coverage): update reports after app dependency tools addition`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH tool** (7 commits minimum)
- ✅ **Use conventional commit format**: `feat(app): description`
- ❌ **DO NOT rebase** - keep linear history
- ✅ **Push every 2-3 commits** to backup work

### Code Quality
- Follow existing patterns in `app/*.ts` files
- Use `invokeCliTool()` consistently
- Handle errors gracefully (invalid app ID, unknown dependency)
- Add JSDoc comments for all exported functions
- Run `npm run lint` frequently

### Parser Functions
- Dependency lists may have nested objects (dependency → versions → metadata)
- Handle missing fields gracefully (some dependencies may lack descriptions)
- Format version numbers consistently
- Example:
  ```typescript
  function parseDependencyListOutput(stdout: string): Dependency[] {
    try {
      const parsed = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        return [];  // Empty list if unexpected format
      }
      return parsed.map((dep: any) => ({
        name: dep.name || dep.id || "unknown",
        currentVersion: dep.currentVersion || dep.version,
        latestVersion: dep.latestVersion || dep.recommendedVersion,
        type: dep.type || "unknown",
        updateAvailable: dep.updateAvailable || false
      }));
    } catch (error) {
      logger.error("Failed to parse dependency list", { stdout, error });
      throw new CliToolError("Failed to parse app dependency list", {
        kind: "PARSING",
        toolName: "mittwald_app_dependency_list",
        stdout,
        cause: error
      });
    }
  }
  ```

### Dependency Update Safety
- `dependency update` can break apps if incompatible versions are installed
- Consider adding warnings in tool description
- Log update attempts with before/after versions
- Return clear success message with updated version info

### When to Ask for Help
- ❓ CLI output format is nested and complex
- ❓ Dependency naming conventions are unclear
- ❓ Update command requires confirmation and flags are ambiguous
- ❓ Version comparison logic is needed (should tool recommend upgrades?)
- ❓ **ANY time stuck for >20 minutes**

## Success Criteria
- [ ] 3 app dependency tools implemented and working
- [ ] All tools discovered by tool scanner
- [ ] Unit tests written and passing
- [ ] Integration tests verify session context
- [ ] Documentation includes usage examples and common use cases
- [ ] Coverage reports updated
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format

## Dependencies
**Blocking**: None - start immediately! This is a quick win.
**Recommended**: None

**Blocked by you**: None

## Handoff to Coordinator
When complete, report:
1. ✅ List of 3 implemented tools with file paths
2. ✅ Dependency output format details (nested? flat?)
3. ✅ Any version comparison logic implemented
4. ✅ Update safety considerations
5. ✅ Usage documentation location

## Estimated Effort
**1-2 days** (3 simple tools, straightforward patterns)

---

**Remember**: This is a quick win with high user value. Dependency management is a common developer task. Keep it simple, test thoroughly, document well. Commit frequently. You've got this! 📦
