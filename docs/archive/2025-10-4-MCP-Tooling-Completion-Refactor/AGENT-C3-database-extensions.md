# Agent C3: Database Extensions Implementation

## Your Identity
You are **Agent C3**, responsible for implementing **database management wrappers** that are currently missing from the MCP server. This is **high-priority work** because database management is a critical user need. You'll be adding 10 new tools: 5 for MySQL user management and 5 for Redis database lifecycle.

## Your Mission
Implement MCP tool wrappers for:
- **MySQL Users**: create, delete, get, list, update
- **Redis Databases**: create, get, list, versions (skip `redis shell` - it's interactive)

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis, your work is in section 3
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (C3) details

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 127-137 show your missing commands
6. **`mw-cli-coverage.json`** - Search for "mysql user" and "redis" to see gaps

### Code Patterns to Follow
7. **`src/tools/cli-adapter.ts`** - The `invokeCliTool()` function you'll use
8. **`src/tools/error.ts`** - How to handle CLI errors
9. **`src/constants/tool/mittwald-cli/database/mysql/create-cli.ts`** - Example MySQL tool
10. **`src/constants/tool/mittwald-cli/database/mysql/list-cli.ts`** - Example with parsing

### Existing Database Tools
11. Review all files in `src/constants/tool/mittwald-cli/database/mysql/` to understand patterns
12. **`src/utils/session-aware-cli.ts`** - How session context is injected

### CLI Command Reference
13. Run locally (if possible) to see output formats:
    ```bash
    mw database mysql user create --help
    mw database redis create --help
    ```

## Your Task List

### Phase 1: MySQL User Management (5 Tools)

#### Task C3.1: MySQL User Create
- [ ] Create file: `src/constants/tool/mittwald-cli/database/mysql/user-create-cli.ts`
- [ ] Study the CLI command: `mw database mysql user create --help`
- [ ] Define tool schema:
  ```typescript
  export const tool: Tool = {
    name: "mittwald_database_mysql_user_create",
    description: "Create a new MySQL user for a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "MySQL database ID (format: mysql-XXXXX)"
        },
        username: {
          type: "string",
          description: "Username for the MySQL user"
        },
        password: {
          type: "string",
          description: "Password for the user (optional, will be generated if not provided)"
        },
        description: {
          type: "string",
          description: "Optional description for the user"
        }
      },
      required: ["databaseId", "username"]
    }
  };
  ```
- [ ] Implement handler using `invokeCliTool()`:
  ```typescript
  async function handler(args: { databaseId: string; username: string; password?: string; description?: string }) {
    const argv = ["database", "mysql", "user", "create", args.databaseId];
    if (args.username) argv.push("--username", args.username);
    if (args.password) argv.push("--password", args.password);
    if (args.description) argv.push("--description", args.description);

    const result = await invokeCliTool({
      toolName: "mittwald_database_mysql_user_create",
      argv,
      sessionId: getCurrentSessionId(),
      parser: parseUserCreateOutput
    });

    return {
      content: [{ type: "text", text: `MySQL user created: ${result.result.userId}` }]
    };
  }
  ```
- [ ] Create parser function (may need to handle JSON or text output)
- [ ] Export `ToolRegistration`
- [ ] Commit with message: `feat(database): add MySQL user create tool`

#### Task C3.2: MySQL User Delete
- [ ] Create file: `src/constants/tool/mittwald-cli/database/mysql/user-delete-cli.ts`
- [ ] Follow same pattern as create, but simpler arguments
- [ ] Handle confirmation (use `--force` flag if available)
- [ ] Commit with message: `feat(database): add MySQL user delete tool`

#### Task C3.3: MySQL User Get
- [ ] Create file: `src/constants/tool/mittwald-cli/database/mysql/user-get-cli.ts`
- [ ] Parse JSON output (likely format: user details object)
- [ ] Format output as readable text for MCP response
- [ ] Commit with message: `feat(database): add MySQL user get tool`

#### Task C3.4: MySQL User List
- [ ] Create file: `src/constants/tool/mittwald-cli/database/mysql/user-list-cli.ts`
- [ ] Parse JSON array output
- [ ] Format as table or list for MCP response
- [ ] Commit with message: `feat(database): add MySQL user list tool`

#### Task C3.5: MySQL User Update
- [ ] Create file: `src/constants/tool/mittwald-cli/database/mysql/user-update-cli.ts`
- [ ] Support updating password and description
- [ ] Handle optional parameters gracefully
- [ ] Commit with message: `feat(database): add MySQL user update tool`

### Phase 2: Redis Database Management (4 Tools - skip shell)

#### Task C3.6: Redis Database Create
- [ ] Create directory: `src/constants/tool/mittwald-cli/database/redis/` (if not exists)
- [ ] Create file: `src/constants/tool/mittwald-cli/database/redis/create-cli.ts`
- [ ] Study CLI: `mw database redis create --help`
- [ ] Define tool schema with required parameters (version, project-id)
- [ ] Implement handler with parser
- [ ] Commit with message: `feat(database): add Redis database create tool`

#### Task C3.7: Redis Database Get
- [ ] Create file: `src/constants/tool/mittwald-cli/database/redis/get-cli.ts`
- [ ] Parse Redis database details (likely JSON)
- [ ] Format output with connection info, version, status
- [ ] Commit with message: `feat(database): add Redis database get tool`

#### Task C3.8: Redis Database List
- [ ] Create file: `src/constants/tool/mittwald-cli/database/redis/list-cli.ts`
- [ ] Parse JSON array of Redis databases
- [ ] Format as table with ID, version, project
- [ ] Commit with message: `feat(database): add Redis database list tool`

#### Task C3.9: Redis Database Versions
- [ ] Create file: `src/constants/tool/mittwald-cli/database/redis/versions-cli.ts`
- [ ] List available Redis versions
- [ ] Simple output format (version list)
- [ ] Commit with message: `feat(database): add Redis versions list tool`

### Phase 3: Testing & Documentation

#### Task C3.10: Add Unit Tests
- [ ] Create test file: `tests/unit/tools/database-mysql-user.test.ts`
- [ ] Mock CLI output for each MySQL user command
- [ ] Test parser functions
- [ ] Commit with message: `test(database): add MySQL user tool tests`

#### Task C3.11: Add Unit Tests for Redis
- [ ] Create test file: `tests/unit/tools/database-redis.test.ts`
- [ ] Mock CLI output for Redis commands
- [ ] Test parser functions
- [ ] Commit with message: `test(database): add Redis database tool tests`

#### Task C3.12: Integration Testing
- [ ] Verify tool discovery: All 9 tools should appear in tool list
- [ ] Test with MCP Inspector (if available)
- [ ] Verify session context is injected correctly
- [ ] Commit with message: `test(database): verify integration of database tools`

#### Task C3.13: Documentation
- [ ] Update `docs/mittwald-cli-coverage.md` to mark your tools as covered
- [ ] Add usage examples to `docs/tool-examples/database.md` (create file):
  ```markdown
  # Database Tool Examples

  ## MySQL User Management

  ### Create MySQL User
  \`\`\`json
  {
    "name": "mittwald_database_mysql_user_create",
    "arguments": {
      "databaseId": "mysql-12345",
      "username": "appuser",
      "password": "secure_password"
    }
  }
  \`\`\`

  ### List MySQL Users
  \`\`\`json
  {
    "name": "mittwald_database_mysql_user_list",
    "arguments": {
      "databaseId": "mysql-12345"
    }
  }
  \`\`\`

  ## Redis Database Management

  ### Create Redis Database
  \`\`\`json
  {
    "name": "mittwald_database_redis_create",
    "arguments": {
      "projectId": "p-12345",
      "version": "7.2",
      "description": "Application cache"
    }
  }
  \`\`\`
  ```
- [ ] Commit with message: `docs(database): add usage examples for database tools`

#### Task C3.14: Regenerate Coverage Reports
- [ ] Run: `npm run coverage:generate` (if Agent A1 completed)
- [ ] Verify 9 new tools show as covered
- [ ] Commit with message: `docs(coverage): update reports after database tools addition`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH tool** (14 commits minimum)
- ✅ **Use conventional commit format**: `feat(database): description`
- ❌ **DO NOT rebase** - linear history is important
- ❌ **DO NOT bundle unrelated changes** - one tool per commit
- ✅ **Push every 3-4 commits** to backup your work

### Code Quality
- Follow existing patterns in `database/mysql/*.ts`
- Use `invokeCliTool()` - do NOT call `executeCli()` directly
- Handle errors gracefully - wrap in try/catch and return `isError: true`
- Add JSDoc comments for all exported functions
- Run `npm run lint` frequently

### Parser Functions
- Always handle JSON parse errors gracefully
- Provide fallback for unexpected output formats
- Log errors with `logger.error()` before throwing
- Example pattern:
  ```typescript
  function parseUserListOutput(stdout: string): MySQLUser[] {
    try {
      const parsed = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        throw new Error("Expected array output");
      }
      return parsed.map(u => ({
        id: u.id,
        username: u.username,
        description: u.description
      }));
    } catch (error) {
      logger.error("Failed to parse MySQL user list output", { stdout, error });
      throw new CliToolError("Failed to parse MySQL user list", {
        kind: "PARSING",
        toolName: "mittwald_database_mysql_user_list",
        stdout,
        cause: error
      });
    }
  }
  ```

### When to Ask for Help
- ❓ CLI output format is unclear or inconsistent
- ❓ Parser functions are complex and you need code review
- ❓ Redis directory structure should match MySQL or be different?
- ❓ Test mocks are failing and you need debugging help
- ❓ Session context injection isn't working
- ❓ **ANY time stuck for >30 minutes**

## Success Criteria
- [ ] 5 MySQL user tools implemented and working
- [ ] 4 Redis database tools implemented and working
- [ ] All 9 tools discovered by tool scanner
- [ ] Unit tests written and passing
- [ ] Integration tests verify session context
- [ ] Documentation includes usage examples
- [ ] Coverage reports updated
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format

## Dependencies
**Blocking**: None - start immediately!
**Recommended**: Wait for Agent A1 (coverage generator) to make verification easier

**Blocked by you**: None, but your work is high priority for users

## Handoff to Coordinator
When complete, report:
1. ✅ List of 9 implemented tools with file paths
2. ✅ Any CLI output format surprises or challenges
3. ✅ Parser function strategies
4. ✅ Test coverage details
5. ✅ Usage examples and documentation location

## Estimated Effort
**4-6 days** (9 tools × 0.5 day each + testing + docs)

---

**Remember**: Database management is critical for users. Take time to get parsing right. Test thoroughly. Commit frequently. Ask questions early. You've got this! 💾
