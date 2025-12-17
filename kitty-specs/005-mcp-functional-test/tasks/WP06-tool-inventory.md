---
work_package_id: WP06
title: Tool Inventory & Discovery
lane: done
history:
- timestamp: '2025-12-04T11:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T14:35:00Z'
  lane: doing
  agent: claude
  shell_pid: '72358'
  action: Started implementation
- timestamp: '2025-12-04T14:50:00Z'
  lane: for_review
  agent: claude
  shell_pid: '72358'
  action: 'Completed T035-T041: discovery.ts, grouping.ts, tool-manifest.ts'
- timestamp: '2025-12-10T07:21:49Z'
  lane: done
  agent: claude-sonnet-4.5
  shell_pid: '73869'
  action: 'Code review complete: Implementation approved - tool inventory fully functional'
agent: claude-sonnet-4.5
assignee: claude
phase: Phase 2 - Core Features
review_status: approved without changes
reviewed_by: claude-sonnet-4.5
shell_pid: '73869'
subtasks:
- T035
- T036
- T037
- T038
- T039
- T040
- T041
---

# Work Package Prompt: WP06 – Tool Inventory & Discovery

## Objectives & Success Criteria

- Dynamically discover all MCP tools from the server (FR-018)
- Categorize tools into 10 functional test domains
- Assign dependency tiers (0-4) for execution ordering

**Success Gate**: Discovery returns ~174 tools; tools correctly grouped into 10 domains with tier assignments.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-018
  - `kitty-specs/005-mcp-functional-test/research.md` - Domain groupings, dependency tiers
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - IToolInventory
- **MCP Server**: `https://mittwald-mcp-fly2.fly.dev/mcp`
- **Expected Tools**: ~174 active (176 discovered, 2 excluded for security)
- **Depends on**: WP01 (types)

## Subtasks & Detailed Guidance

### Subtask T035 – Implement discovery.ts MCP tool discovery

- **Purpose**: Connect to MCP server and list available tools.
- **Steps**:
  1. Create `src/inventory/discovery.ts`
  2. Implement `discover(options: DiscoveryOptions): Promise<DiscoveredTool[]>`
  3. Connect to MCP server using HTTP transport
  4. Call `tools/list` MCP method
  5. Parse response to extract tool metadata:
     ```typescript
     interface DiscoveredTool {
       name: string;        // e.g., "mcp__mittwald__project_create"
       description: string; // Tool description
       inputSchema: unknown; // JSON Schema for parameters
     }
     ```
- **Files**: `tests/functional/src/inventory/discovery.ts`
- **Parallel?**: No (foundation)
- **Notes**: May need to handle MCP protocol specifics. Check @modelcontextprotocol/sdk.

### Subtask T036 – Parse tool names and descriptions

- **Purpose**: Extract structured metadata from raw tool data.
- **Steps**:
  1. Parse tool name format: `mcp__mittwald__<category>_<action>`
  2. Extract display name: `category/action`
  3. Example: `mcp__mittwald__project_create` → `project/create`
  4. Store both formats for different use cases
  5. Filter out excluded tools:
     - `mittwald_login_reset` (security)
     - `mittwald_login_token` (multi-tenancy)
- **Files**: `tests/functional/src/inventory/discovery.ts`
- **Parallel?**: No

### Subtask T037 – Implement grouping.ts domain mapping

- **Purpose**: Map each tool to one of 10 test domains per research.md.
- **Steps**:
  1. Create `src/inventory/grouping.ts`
  2. Define domain mapping rules:
     ```typescript
     const DOMAIN_PATTERNS: Record<TestDomain, string[]> = {
       'identity': ['user/', 'login/', 'context/'],
       'organization': ['org/', 'extension/'],
       'project-foundation': ['project/', 'server/'],
       'apps': ['app/'],
       'containers': ['container/', 'stack/', 'volume/', 'registry/'],
       'databases': ['database/'],
       'domains-mail': ['domain/', 'mail/'],
       'access-users': ['sftp/', 'ssh/'],
       'automation': ['cronjob/'],
       'backups': ['backup/'],
     };
     ```
  3. Implement `mapToolToDomain(toolName: string): TestDomain`
  4. Handle edge cases (tools that don't match patterns)
- **Files**: `tests/functional/src/inventory/grouping.ts`
- **Parallel?**: Yes (after T036)

### Subtask T038 – Generate test-domains.json configuration

- **Purpose**: Persist domain groupings for harness configuration.
- **Steps**:
  1. Run discovery and grouping
  2. Write `config/test-domains.json`:
     ```json
     {
       "generated": "2025-12-04T12:00:00Z",
       "totalTools": 174,
       "domains": {
         "identity": ["user/get", "user/api-token/list", ...],
         "organization": ["org/list", "org/get", ...],
         ...
       }
     }
     ```
  3. Create CLI command to regenerate: `npm run discover`
- **Files**: `tests/functional/config/test-domains.json`, `tests/functional/src/inventory/discovery.ts`
- **Parallel?**: Yes

### Subtask T039 – Implement tier assignment

- **Purpose**: Assign dependency tiers (0-4) for execution ordering.
- **Steps**:
  1. Define tier rules per research.md:
     ```typescript
     const TIER_RULES: Record<number, string[]> = {
       0: ['user/', 'login/status', 'context/', 'org/list', 'server/list'],
       1: ['org/', 'extension/'],
       2: ['server/get'],
       3: ['project/create', 'project/list'],
       4: ['*'],  // Everything else (requires project)
     };
     ```
  2. Implement `assignTier(toolName: string): number`
  3. Special case: `project/create` is Tier 3, only clean-room test
  4. Add tier to ToolEntry metadata
- **Files**: `tests/functional/src/inventory/grouping.ts`
- **Parallel?**: Yes

### Subtask T040 – Create tool-manifest.ts storage

- **Purpose**: Store and query tool metadata during harness execution.
- **Steps**:
  1. Create `src/inventory/tool-manifest.ts`
  2. Implement in-memory storage: `Map<string, ToolEntry>`
  3. Implement `loadFromDiscovery(tools: DiscoveredTool[]): void`
  4. Apply domain grouping and tier assignment during load
  5. Mark `project/create` as `cleanRoomRequired: true`
- **Files**: `tests/functional/src/inventory/tool-manifest.ts`
- **Parallel?**: No (after T037-T39)

### Subtask T041 – Implement domain/tier queries

- **Purpose**: Support harness queries for test ordering.
- **Steps**:
  1. Implement `getByDomain(domain: TestDomain): ToolEntry[]`
  2. Implement `getByTier(tier: number): ToolEntry[]`
  3. Implement `getTool(name: string): ToolEntry | undefined`
  4. Export IToolInventory interface implementation
- **Files**: `tests/functional/src/inventory/tool-manifest.ts`
- **Parallel?**: No

## Test Strategy

No unit tests specified. Validate by:
1. Run discovery against live MCP server
2. Verify ~174 tools returned
3. Verify each tool maps to exactly one domain
4. Verify tier assignments match research.md

## Risks & Mitigations

- **MCP server changes**: Tool list may change. Discovery runs at harness startup.
- **New tools without mapping**: Default to domain based on prefix, log warning.
- **Network failures**: Retry discovery with backoff; fail fast if server unreachable.

## Definition of Done Checklist

- [ ] `discovery.ts` connects to MCP server and lists tools
- [ ] Tool names parsed into both MCP format and display format
- [ ] Excluded tools (login_reset, login_token) filtered out
- [ ] All ~174 tools mapped to 10 domains
- [ ] `test-domains.json` generated with tool groupings
- [ ] Tiers 0-4 assigned correctly per research.md
- [ ] `project/create` marked as cleanRoomRequired
- [ ] getByDomain and getByTier queries work correctly
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Compare domain groupings against research.md
- Verify tier assignments, especially Tier 0 and Tier 3
- Check that discovery handles MCP protocol correctly
- Ensure excluded tools are not in inventory

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
- 2025-12-10T07:21:49Z – claude-sonnet-4.5 – shell_pid=73869 – lane=done – Code review complete: Implementation approved - tool inventory fully functional
