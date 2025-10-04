# Agent C4: Organization Management Implementation

## Your Identity
You are **Agent C4**, responsible for implementing **organization management wrappers** that are currently missing from the MCP server. This is **high-priority work** for multi-org users. You'll be adding 7 new tools covering org CRUD operations and membership management.

## Your Mission
Implement MCP tool wrappers for:
- **Org CRUD**: list, get, delete, invite
- **Membership Management**: list, list-own, revoke

Note: Some invite tools already exist, so you'll be completing the gaps.

## Required Reading (Read in Order)

### Architecture & Context
1. **`LLM_CONTEXT.md`** - Complete project overview (read first!)
2. **`ARCHITECTURE.md`** - OAuth bridge and MCP server architecture
3. **`docs/mcp-cli-gap-architecture.md`** - Gap analysis, your work is in section 3
4. **`docs/mcp-cli-gap-project-plan.md`** - Your workstream (C4) details

### Coverage Data
5. **`docs/mittwald-cli-coverage.md`** - Lines 192-205 show your missing commands
6. **`mw-cli-coverage.json`** - Search for "org" to see current coverage

### Code Patterns to Follow
7. **`src/tools/cli-adapter.ts`** - The `invokeCliTool()` function you'll use
8. **`src/tools/error.ts`** - How to handle CLI errors
9. **`src/constants/tool/mittwald-cli/org/invite-list-cli.ts`** - EXISTING tool to use as template
10. **`src/constants/tool/mittwald-cli/org/invite-revoke-cli.ts`** - Another existing pattern

### Similar Patterns
11. **`src/constants/tool/mittwald-cli/project/list-cli.ts`** - Project list pattern
12. **`src/constants/tool/mittwald-cli/project/get-cli.ts`** - Project get pattern
13. **`src/constants/tool/mittwald-cli/project/membership-list-cli.ts`** - Membership pattern

### CLI Command Reference
14. Run locally (if possible):
    ```bash
    mw org --help
    mw org list --help
    mw org membership list --help
    ```

## Your Task List

### Phase 1: Organization CRUD (4 Tools)

#### Task C4.1: Org List
- [ ] Create file: `src/constants/tool/mittwald-cli/org/list-cli.ts`
- [ ] Study CLI: `mw org list --help`
- [ ] Define tool schema (no required parameters, lists all accessible orgs):
  ```typescript
  export const tool: Tool = {
    name: "mittwald_org_list",
    description: "Get all organizations the authenticated user has access to",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  };
  ```
- [ ] Implement handler:
  ```typescript
  async function handler(args: {}) {
    const result = await invokeCliTool({
      toolName: "mittwald_org_list",
      argv: ["org", "list", "--output", "json"],
      sessionId: getCurrentSessionId(),
      parser: parseOrgListOutput
    });

    return {
      content: [{
        type: "text",
        text: formatOrgList(result.result)
      }]
    };
  }
  ```
- [ ] Create parser for JSON array output
- [ ] Format output as readable table (ID, Name, Role)
- [ ] Commit with message: `feat(org): add organization list tool`

#### Task C4.2: Org Get
- [ ] Create file: `src/constants/tool/mittwald-cli/org/get-cli.ts`
- [ ] Study CLI: `mw org get <orgId> --help`
- [ ] Define tool schema with required `organizationId`
- [ ] Parse organization details (name, description, owner, members count, etc.)
- [ ] Format detailed output
- [ ] Commit with message: `feat(org): add organization get tool`

#### Task C4.3: Org Delete
- [ ] Create file: `src/constants/tool/mittwald-cli/org/delete-cli.ts`
- [ ] **DANGER**: This is a destructive operation!
- [ ] Add confirmation parameter (required: true)
- [ ] Schema should include:
  ```typescript
  properties: {
    organizationId: {
      type: "string",
      description: "Organization ID to delete (format: o-XXXXX)"
    },
    confirm: {
      type: "boolean",
      description: "Must be set to true to confirm deletion (DESTRUCTIVE OPERATION)"
    }
  },
  required: ["organizationId", "confirm"]
  ```
- [ ] Validate `confirm === true` before executing
- [ ] Use CLI flags for confirmation (if available)
- [ ] Return clear success/error message
- [ ] Commit with message: `feat(org): add organization delete tool`

#### Task C4.4: Org Invite
- [ ] Create file: `src/constants/tool/mittwald-cli/org/invite-cli.ts`
- [ ] Study CLI: `mw org invite --help`
- [ ] Schema should include:
  ```typescript
  properties: {
    organizationId: { type: "string" },
    email: { type: "string", format: "email" },
    role: {
      type: "string",
      enum: ["owner", "admin", "member"],  // Verify these roles!
      description: "Role to assign to the invited user"
    },
    message: {
      type: "string",
      description: "Optional invitation message"
    }
  },
  required: ["organizationId", "email", "role"]
  ```
- [ ] Handle invite creation, return invite ID
- [ ] Commit with message: `feat(org): add organization invite tool`

### Phase 2: Membership Management (3 Tools)

#### Task C4.5: Org Membership List
- [ ] Create file: `src/constants/tool/mittwald-cli/org/membership-list-cli.ts`
- [ ] Study CLI: `mw org membership list --help`
- [ ] List all members of an organization
- [ ] Parse member details (userId, role, joinedAt)
- [ ] Format as table (User ID, Email, Role, Joined)
- [ ] Commit with message: `feat(org): add organization membership list tool`

#### Task C4.6: Org Membership List-Own
- [ ] Create file: `src/constants/tool/mittwald-cli/org/membership-list-own-cli.ts`
- [ ] List organizations where the authenticated user is a member
- [ ] No parameters required (uses session authentication)
- [ ] Parse and format membership list
- [ ] Commit with message: `feat(org): add user organization membership list tool`

#### Task C4.7: Org Membership Revoke
- [ ] Create file: `src/constants/tool/mittwald-cli/org/membership-revoke-cli.ts`
- [ ] **DANGER**: This removes user access!
- [ ] Schema:
  ```typescript
  properties: {
    membershipId: {
      type: "string",
      description: "Membership ID to revoke"
    },
    organizationId: {
      type: "string",
      description: "Organization ID (may be optional if membershipId is unique)"
    }
  },
  required: ["membershipId"]
  ```
- [ ] Handle revocation, return confirmation
- [ ] Commit with message: `feat(org): add organization membership revoke tool`

### Phase 3: Testing & Documentation

#### Task C4.8: Add Unit Tests
- [ ] Create test file: `tests/unit/tools/org-management.test.ts`
- [ ] Mock CLI output for all 7 commands
- [ ] Test parsers handle edge cases:
  - Empty organization list
  - Organization with no members
  - Invalid organization ID
- [ ] Commit with message: `test(org): add organization management tool tests`

#### Task C4.9: Integration Testing
- [ ] Verify tool discovery: All 7 new tools appear in tool list
- [ ] Test with MCP Inspector (if available)
- [ ] Verify session context is injected correctly
- [ ] Test error handling (try to get non-existent org)
- [ ] Commit with message: `test(org): verify integration of organization tools`

#### Task C4.10: Safety Documentation
- [ ] Create `docs/tool-safety/destructive-operations.md`:
  ```markdown
  # Destructive Operations Safety Guide

  ## Organization Management

  ### ⚠️ DESTRUCTIVE: mittwald_org_delete
  **Risk**: Permanently deletes an organization and all associated resources.

  **Safety Measures**:
  - Requires `confirm: true` parameter
  - User must have owner role
  - Cannot be undone

  **Usage**:
  Only use when explicitly requested by user with clear understanding of consequences.

  ### ⚠️ DISRUPTIVE: mittwald_org_membership_revoke
  **Risk**: Removes user access to organization.

  **Safety Measures**:
  - Requires membership ID
  - Verify user intent before executing

  **Usage**:
  Confirm with user before revoking access.
  ```
- [ ] Commit with message: `docs(org): add safety guide for destructive operations`

#### Task C4.11: Usage Documentation
- [ ] Create `docs/tool-examples/organization.md`:
  ```markdown
  # Organization Management Examples

  ## List Organizations
  \`\`\`json
  {
    "name": "mittwald_org_list",
    "arguments": {}
  }
  \`\`\`

  ## Get Organization Details
  \`\`\`json
  {
    "name": "mittwald_org_get",
    "arguments": {
      "organizationId": "o-abc123"
    }
  }
  \`\`\`

  ## Invite User to Organization
  \`\`\`json
  {
    "name": "mittwald_org_invite",
    "arguments": {
      "organizationId": "o-abc123",
      "email": "user@example.com",
      "role": "member",
      "message": "Welcome to our organization!"
    }
  }
  \`\`\`

  ## List Organization Members
  \`\`\`json
  {
    "name": "mittwald_org_membership_list",
    "arguments": {
      "organizationId": "o-abc123"
    }
  }
  \`\`\`

  ## ⚠️ Delete Organization (DESTRUCTIVE)
  \`\`\`json
  {
    "name": "mittwald_org_delete",
    "arguments": {
      "organizationId": "o-abc123",
      "confirm": true
    }
  }
  \`\`\`
  **WARNING**: This permanently deletes the organization!
  ```
- [ ] Commit with message: `docs(org): add usage examples for organization tools`

#### Task C4.12: Regenerate Coverage Reports
- [ ] Run: `npm run coverage:generate` (if Agent A1 completed)
- [ ] Verify 7 new tools show as covered
- [ ] Commit with message: `docs(coverage): update reports after organization tools addition`

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH tool** (12 commits minimum)
- ✅ **Use conventional commit format**: `feat(org): description`
- ❌ **DO NOT rebase** - keep linear history
- ❌ **DO NOT combine destructive operations with safe ones** in same commit
- ✅ **Push every 2-3 commits** to backup work

### Code Quality
- Follow existing patterns in `org/invite-*.ts` files
- Use `invokeCliTool()` consistently
- Handle errors gracefully
- Add JSDoc comments for all functions
- Run `npm run lint` frequently

### Safety for Destructive Operations
- **Org Delete**:
  - MUST require `confirm: true` parameter
  - Log deletion attempt with organization details
  - Return clear error if confirmation missing
  - Consider adding `--force` to CLI args for confirmation

- **Membership Revoke**:
  - Log revocation with user context
  - Return clear success message with revoked user info

### Parser Functions
- Handle missing fields gracefully (some orgs may have sparse data)
- Provide sensible defaults for optional fields
- Format role names consistently (capitalize, full words)
- Example:
  ```typescript
  function parseOrgListOutput(stdout: string): Organization[] {
    try {
      const parsed = JSON.parse(stdout);
      return parsed.map((org: any) => ({
        id: org.id,
        name: org.name || "Unnamed Organization",
        role: formatRole(org.role),
        memberCount: org.memberCount || 0
      }));
    } catch (error) {
      logger.error("Failed to parse org list", { stdout, error });
      throw new CliToolError("Failed to parse organization list", {
        kind: "PARSING",
        toolName: "mittwald_org_list",
        stdout,
        cause: error
      });
    }
  }
  ```

### When to Ask for Help
- ❓ CLI role names are unclear or inconsistent
- ❓ Membership ID format is ambiguous
- ❓ Parser output format is unexpected
- ❓ Destructive operation confirmation logic needs review
- ❓ Test mocks are failing
- ❓ **ANY time stuck for >30 minutes**

## Success Criteria
- [ ] 7 organization tools implemented and working
- [ ] All tools discovered by tool scanner
- [ ] Unit tests written and passing
- [ ] Integration tests verify session context
- [ ] Safety documentation for destructive operations
- [ ] Usage examples documented
- [ ] Coverage reports updated
- [ ] Build succeeds with no TypeScript errors
- [ ] All commits follow conventional format
- [ ] Destructive operations have clear warnings

## Dependencies
**Blocking**: None - start immediately!
**Recommended**: Review existing `org/invite-*.ts` tools first

**Blocked by you**: None, but multi-org users need this functionality

## Handoff to Coordinator
When complete, report:
1. ✅ List of 7 implemented tools with file paths
2. ✅ Safety measures for destructive operations
3. ✅ CLI role naming conventions discovered
4. ✅ Test coverage details
5. ✅ Any edge cases or unexpected behaviors

## Estimated Effort
**3-4 days** (7 tools × 0.5 day each + safety docs + testing)

---

**Remember**: Organization management is critical for multi-tenant users. Be extra careful with destructive operations. Document safety measures clearly. Commit frequently. Ask questions early. You've got this! 🏢
