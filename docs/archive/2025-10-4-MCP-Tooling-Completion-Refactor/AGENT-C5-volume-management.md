# Agent C5: Volume Management Implementation

## Your Identity
You are **Agent C5**, responsible for implementing **volume management wrappers**. Volumes are named persistent storage containers used by Docker-style applications. You'll be adding 3 straightforward CRUD tools for managing volumes in projects.

## Your Mission
Implement MCP tool wrappers for:
- `volume create` - Create a new named volume
- `volume delete` - Remove a named volume
- `volume list` - List volumes in a project

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis, your work is in section 3
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (C5) details

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 286-292 show your missing commands
6. **`mw-cli-coverage.json`** - Search for "volume" to see gaps

### Code Patterns to Follow
7. **`src/tools/cli-adapter.ts`** - The `invokeCliTool()` function you'll use
8. **`src/tools/error.ts`** - How to handle CLI errors
9. **`src/constants/tool/mittwald-cli/container/list-services-cli.ts`** - Container list pattern
10. **`src/constants/tool/mittwald-cli/container/delete-cli.ts`** - Container delete pattern

### Similar Patterns
11. **`src/constants/tool/mittwald-cli/project/list-cli.ts`** - Simple list tool
12. **`src/constants/tool/mittwald-cli/database/mysql/create-cli.ts`** - Create resource pattern

### CLI Command Reference
13. Run locally (if possible):
    ```bash
    mw volume --help
    mw volume create --help
    mw volume list --help
    mw volume delete --help
    ```

## Your Task List

### Task C5.1: Volume Create
- [ ] Create directory: `src/constants/tool/mittwald-cli/volume/` (if not exists)
- [ ] Create file: `src/constants/tool/mittwald-cli/volume/create-cli.ts`
- [ ] Study CLI: `mw volume create --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_volume_create",
    description: "Create a new named volume in a project. Volumes provide persistent storage for containers.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID where volume will be created (format: p-XXXXX)"
        },
        name: {
          type: "string",
          description: "Name for the volume (must be unique within project)",
          pattern: "^[a-z0-9-]+$"  // Verify naming rules!
        },
        size: {
          type: "number",
          description: "Size in GB (optional, default may be applied by CLI)"
        },
        description: {
          type: "string",
          description: "Optional description for the volume"
        }
      },
      required: ["projectId", "name"]
    }
  };
  ```
- [ ] Implement handler:
  ```typescript
  async function handler(args: {
    projectId: string;
    name: string;
    size?: number;
    description?: string
  }) {
    const argv = ["volume", "create"];
    argv.push("--project-id", args.projectId);
    argv.push("--name", args.name);
    if (args.size) argv.push("--size", String(args.size));
    if (args.description) argv.push("--description", args.description);

    const result = await invokeCliTool({
      toolName: "mittwald_volume_create",
      argv,
      sessionId: getCurrentSessionId(),
      parser: parseVolumeCreateOutput
    });

    return {
      content: [{
        type: "text",
        text: `Volume created successfully:\n` +
              `ID: ${result.result.volumeId}\n` +
              `Name: ${args.name}\n` +
              `Size: ${args.size || 'default'} GB`
      }]
    };
  }
  ```
- [ ] Create parser (likely returns volume ID or quiet output)
- [ ] Export `ToolRegistration`
- [ ] Commit with message: `feat(volume): add volume create tool`

### Task C5.2: Volume List
- [ ] Create file: `src/constants/tool/mittwald-cli/volume/list-cli.ts`
- [ ] Study CLI: `mw volume list --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_volume_list",
    description: "List all volumes belonging to a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to list volumes for (format: p-XXXXX)"
        }
      },
      required: ["projectId"]
    }
  };
  ```
- [ ] Implement handler:
  ```typescript
  async function handler(args: { projectId: string }) {
    const result = await invokeCliTool({
      toolName: "mittwald_volume_list",
      argv: ["volume", "list", "--project-id", args.projectId, "--output", "json"],
      sessionId: getCurrentSessionId(),
      parser: parseVolumeListOutput
    });

    return {
      content: [{
        type: "text",
        text: formatVolumeList(result.result)
      }]
    };
  }
  ```
- [ ] Create parser for JSON array (volume objects)
- [ ] Format output as table:
  ```
  VOLUME ID       NAME            SIZE    USED    MOUNTED TO
  vol-abc123      app-data        10GB    2.5GB   c-xyz789
  vol-def456      cache           5GB     0.8GB   -
  ```
- [ ] Commit with message: `feat(volume): add volume list tool`

### Task C5.3: Volume Delete
- [ ] Create file: `src/constants/tool/mittwald-cli/volume/delete-cli.ts`
- [ ] Study CLI: `mw volume delete --help`
- [ ] **DANGER**: This permanently deletes data!
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_volume_delete",
    description: "Delete a volume. WARNING: This permanently deletes all data in the volume!",
    inputSchema: {
      type: "object",
      properties: {
        volumeId: {
          type: "string",
          description: "Volume ID to delete (format: vol-XXXXX)"
        },
        projectId: {
          type: "string",
          description: "Project ID (may be optional if volumeId is unique)"
        },
        force: {
          type: "boolean",
          description: "Force deletion even if volume is mounted (use with extreme caution)"
        }
      },
      required: ["volumeId"]
    }
  };
  ```
- [ ] Implement handler:
  - Validate volume is not mounted (unless `force: true`)
  - Add clear warning to output
  - Use CLI confirmation flags
- [ ] Parse deletion confirmation
- [ ] Return clear success message
- [ ] Commit with message: `feat(volume): add volume delete tool`

### Task C5.4: Add Unit Tests
- [ ] Create test file: `tests/unit/tools/volume-management.test.ts`
- [ ] Mock CLI output for all 3 commands:
  - Volume create returns volume ID
  - Volume list returns array of volumes
  - Volume delete returns success confirmation
- [ ] Test edge cases:
  - Empty volume list
  - Delete mounted volume without force flag (should warn)
  - Invalid volume ID format
- [ ] Commit with message: `test(volume): add volume management tool tests`

### Task C5.5: Integration Testing
- [ ] Verify tool discovery: All 3 new tools appear in tool list
- [ ] Test with MCP Inspector (if available):
  - List volumes for a test project
  - Create a volume (if safe environment)
  - Delete a test volume
- [ ] Verify session context injection (project-id from session)
- [ ] Commit with message: `test(volume): verify integration of volume tools`

### Task C5.6: Safety Documentation
- [ ] Create `docs/tool-safety/volume-operations.md`:
  ```markdown
  # Volume Operations Safety Guide

  ## ⚠️ DESTRUCTIVE: mittwald_volume_delete
  **Risk**: Permanently deletes volume and all contained data.

  **Safety Measures**:
  - CLI may prevent deletion if volume is mounted
  - Use `force: true` only when absolutely necessary
  - Verify volume is backed up before deletion

  **Pre-deletion Checklist**:
  1. Verify volume ID is correct
  2. Check if volume is mounted to any containers
  3. Ensure data is backed up
  4. Confirm user intent explicitly

  **Usage**:
  Always confirm with user before deleting volumes.

  ## Volume Naming Conventions
  - Use lowercase letters, numbers, and hyphens only
  - Keep names descriptive (e.g., `wordpress-uploads`, `database-backup`)
  - Avoid generic names like `data` or `storage`

  ## Size Planning
  - Consider growth: allocate 2x expected initial size
  - Monitor usage with `volume list`
  - Plan for regular cleanup of old data
  ```
- [ ] Commit with message: `docs(volume): add safety guide for volume operations`

### Task C5.7: Usage Documentation
- [ ] Create `docs/tool-examples/volumes.md`:
  ```markdown
  # Volume Management Examples

  ## Create Volume

  ### Basic volume creation
  \`\`\`json
  {
    "name": "mittwald_volume_create",
    "arguments": {
      "projectId": "p-abc123",
      "name": "app-uploads",
      "size": 10,
      "description": "Storage for user-uploaded files"
    }
  }
  \`\`\`

  ### Create without size (uses default)
  \`\`\`json
  {
    "name": "mittwald_volume_create",
    "arguments": {
      "projectId": "p-abc123",
      "name": "cache-data"
    }
  }
  \`\`\`

  ## List Volumes

  ### List all volumes in project
  \`\`\`json
  {
    "name": "mittwald_volume_list",
    "arguments": {
      "projectId": "p-abc123"
    }
  }
  \`\`\`

  ## Delete Volume

  ### ⚠️ Delete unmounted volume
  \`\`\`json
  {
    "name": "mittwald_volume_delete",
    "arguments": {
      "volumeId": "vol-xyz789"
    }
  }
  \`\`\`
  **WARNING**: This permanently deletes all data!

  ### ⚠️⚠️ Force delete mounted volume (extreme caution!)
  \`\`\`json
  {
    "name": "mittwald_volume_delete",
    "arguments": {
      "volumeId": "vol-xyz789",
      "force": true
    }
  }
  \`\`\`
  **DANGER**: This can break running containers!

  ## Common Use Cases

  1. **Persistent uploads**: Create volume for user uploads in web apps
  2. **Database backups**: Create dedicated volume for database dump storage
  3. **Cache storage**: Separate cache data from application code
  4. **Shared data**: Volume accessible by multiple containers

  ## Volume Lifecycle Best Practices

  1. **Create** volumes before deploying containers that need them
  2. **Monitor** usage regularly with `volume list`
  3. **Backup** important data before deletion
  4. **Clean up** unused volumes to free resources
  ```
- [ ] Commit with message: `docs(volume): add usage examples and best practices`

### Task C5.8: Regenerate Coverage Reports
- [ ] Run: `npm run coverage:generate` (if Agent A1 completed)
- [ ] Verify 3 new tools show as covered
- [ ] Commit with message: `docs(coverage): update reports after volume tools addition`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH tool** (8 commits minimum)
- ✅ **Use conventional commit format**: `feat(volume): description`
- ❌ **DO NOT rebase** - keep linear history
- ✅ **Push every 2-3 commits**

### Code Quality
- Follow existing container management patterns
- Use `invokeCliTool()` consistently
- Handle errors gracefully
- Add JSDoc comments
- Run `npm run lint` frequently

### Safety for Volume Delete
- Log deletion attempts with volume details
- Check if volume is mounted before deletion
- Return clear warnings if mounted
- Provide explicit success/error messages
- Consider requiring explicit user confirmation

### Parser Functions
- Volume list likely returns array of volume objects
- Handle empty lists gracefully
- Format sizes consistently (GB, MB)
- Parse mounted container references
- Example:
  ```typescript
  function parseVolumeListOutput(stdout: string): Volume[] {
    try {
      const parsed = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((vol: any) => ({
        id: vol.id,
        name: vol.name,
        size: vol.size || "unknown",
        used: vol.used || 0,
        mountedTo: vol.mountedTo || null,
        createdAt: vol.createdAt
      }));
    } catch (error) {
      logger.error("Failed to parse volume list", { stdout, error });
      throw new CliToolError("Failed to parse volume list", {
        kind: "PARSING",
        toolName: "mittwald_volume_list",
        stdout,
        cause: error
      });
    }
  }
  ```

### When to Ask for Help
- ❓ Volume naming rules are unclear
- ❓ Size parameter is optional but units are ambiguous
- ❓ Mounted volume detection logic is complex
- ❓ CLI output format is unexpected
- ❓ **ANY time stuck for >20 minutes**

## Success Criteria
- [ ] 3 volume tools implemented and working
- [ ] All tools discovered by tool scanner
- [ ] Unit tests written and passing
- [ ] Integration tests verify functionality
- [ ] Safety documentation for delete operation
- [ ] Usage examples with best practices
- [ ] Coverage reports updated
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format

## Dependencies
**Blocking**: None - start immediately!
**Recommended**: Review container tools for similar patterns

**Blocked by you**: None

## Handoff to Coordinator
When complete, report:
1. ✅ List of 3 implemented tools with file paths
2. ✅ Volume naming conventions discovered
3. ✅ Mounted volume handling approach
4. ✅ Safety measures for delete operation
5. ✅ Test results and edge cases handled

## Estimated Effort
**1-2 days** (3 simple CRUD tools, straightforward patterns)

---

**Remember**: Volume deletion is destructive. Add clear warnings. Test carefully. Document safety measures. Commit frequently. You've got this! 💾
