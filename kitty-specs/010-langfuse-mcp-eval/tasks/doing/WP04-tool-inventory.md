---
work_package_id: "WP04"
subtasks:
  - "T001"
title: "Tool Inventory Generation"
phase: "Phase 2 - Dependency Graph & Inventory"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "21946"
review_status: "acknowledged"
reviewed_by: "codex"
history:
  - timestamp: "2025-12-16T13:04:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T16:36:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "78380"
    action: "Started implementation - Phase 2 critical path"
  - timestamp: "2025-12-16T16:37:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "78380"
    action: "Generated tools.json with 175 tools, all domains/tiers classified"
  - timestamp: "2025-12-16T15:53:17Z"
    lane: "planned"
    agent: "codex"
    shell_pid: "14588"
    action: "Review submitted: needs changes (domain misclassification, spec count mismatch)"
  - timestamp: "2025-12-16T17:00:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "21946"
    action: "Acknowledged feedback, addressing domain misclassification issues"
---

## Review Feedback

**Status**: ❌ **Needs Changes**

**Key Issues**:
1. Domain distribution does not match the spec’s expected counts (identity 19 vs 17, containers 20 vs 19, databases 22 vs 21, domains-mail 21 vs 20, misc 8 vs 13), so the inventory fails the “valid domain assignments” acceptance criterion and downstream prompt generation will be mis-bucketed. Example: `login/*` tools are classified under `identity` but the prompt lists them under `misc`.
2. The reported domain tallies in `evals/inventory/tools.json` don’t align with the enumerated breakdown in the prompt (identity 17, organization 14, project-foundation 16, apps 28, containers 19, databases 21, domains-mail 20, access-users 8, automation 10, backups 9, misc 13). This needs to be reconciled and regenerated to ensure the manifest matches the contract.

**What Was Done Well**:
- Inventory includes all 175 tools with dependencies, required_resources, and success indicator arrays populated.
- Tiers and destructive/interactive flags are consistently present across entries.

**Action Items** (must complete before re-review):
- [ ] Reclassify tools to match the domain breakdown specified in the prompt (e.g., move `login/*` to `misc`, adjust other mis-bucketed tools) and regenerate `evals/inventory/tools.json`.
- [ ] Verify the `domains` map totals exactly match the expected per-domain counts from the prompt and update the file accordingly.

# Work Package Prompt: WP04 – Tool Inventory Generation

## Objective

Generate a complete inventory of all 175 MCP tools with domain classification, tier assignment, descriptions, dependencies, and success indicators. This inventory is the foundation for all eval prompt generation.

## Context

The existing codebase has:
- Tool handlers in `/src/handlers/tools/mittwald-cli/` (175 files)
- Domain/tier classification logic in `/tests/functional/src/inventory/grouping.ts`
- Tool discovery via MCP server at `https://mittwald-mcp-fly2.fly.dev/mcp`

## Technical Requirements

### Output Structure

```json
{
  "generated_at": "2025-12-16T00:00:00Z",
  "tool_count": 175,
  "source": "mittwald-mcp-fly2.fly.dev",
  "domains": {
    "identity": 17,
    "organization": 14,
    "project-foundation": 16,
    "apps": 28,
    "containers": 19,
    "databases": 21,
    "domains-mail": 20,
    "access-users": 8,
    "automation": 10,
    "backups": 9,
    "misc": 13
  },
  "tools": [
    {
      "mcp_name": "mcp__mittwald__mittwald_user_get",
      "display_name": "user/get",
      "domain": "identity",
      "tier": 0,
      "description": "Get profile information for a user",
      "dependencies": [],
      "required_resources": [],
      "success_indicators": [
        "Returns user profile data",
        "Response includes user ID and email"
      ],
      "is_destructive": false,
      "is_interactive": false,
      "parameters": {
        "userId": "optional - defaults to current user"
      }
    }
    // ... 174 more tools
  ]
}
```

## Implementation Steps

### Step 1: Analyze Existing Tool Handlers

Review the tool handler directory structure:

```
/src/handlers/tools/mittwald-cli/
├── app/
│   ├── create/
│   │   ├── node-cli.ts
│   │   ├── php-cli.ts
│   │   └── ...
│   ├── install/
│   │   ├── wordpress-cli.ts
│   │   └── ...
│   ├── copy-cli.ts
│   └── ...
├── backup/
├── container/
├── context/
├── conversation/
├── cronjob/
├── database/
├── domain/
├── extension/
├── login/
├── mail/
├── org/
├── project/
├── registry/
├── server/
├── sftp/
├── ssh/
├── stack/
├── user/
└── volume/
```

### Step 2: Extract Tool Metadata

For each tool handler, extract:

1. **MCP Name**: From the handler registration (pattern: `mcp__mittwald__mittwald_{category}_{action}`)
2. **Display Name**: Convert `app/create/node-cli.ts` → `app/create/node`
3. **Description**: From handler's `description` field or JSDoc
4. **Parameters**: From input schema definition
5. **Destructive Flag**: If tool has `delete`, `uninstall`, `revoke` in name

### Step 3: Apply Domain Classification

Use the existing patterns from `grouping.ts`:

```typescript
const DOMAIN_PATTERNS: Record<string, string[]> = {
  'identity': ['user/', 'context/', 'login/'],
  'organization': ['org/', 'extension/'],
  'project-foundation': ['project/', 'server/'],
  'apps': ['app/'],
  'containers': ['container/', 'stack/', 'volume/', 'registry/'],
  'databases': ['database/'],
  'domains-mail': ['domain/', 'mail/', 'certificate/'],
  'access-users': ['sftp/', 'ssh/'],
  'automation': ['cronjob/'],
  'backups': ['backup/'],
  'misc': ['conversation/', 'ddev/']
};
```

### Step 4: Apply Tier Classification

Based on existing tier logic:

```typescript
function assignTier(displayName: string): number {
  // Tier 0: No prerequisites
  if (displayName.match(/^user\/|^login\/status|^context\/|^org\/list|^server\/list|^project\/list/)) {
    return 0;
  }

  // Tier 1: Organization-level
  if (displayName.match(/^org\/|^extension\//)) {
    return 1;
  }

  // Tier 2: Server-level
  if (displayName === 'server/get') {
    return 2;
  }

  // Tier 3: Project creation
  if (displayName === 'project/create') {
    return 3;
  }

  // Tier 4: Requires project (default)
  return 4;
}
```

### Step 5: Determine Dependencies

Map each tool to its dependencies:

```typescript
const DEPENDENCY_MAP: Record<string, string[]> = {
  // Tier 0 - no dependencies
  'user/get': [],
  'user/session/list': [],
  'org/list': [],
  'context/get': [],

  // Tier 1 - org-level
  'org/get': ['org/list'],
  'org/invite': ['org/list'],

  // Tier 3 - project creation
  'project/create': ['server/list'],

  // Tier 4 - project-dependent
  'app/create/node': ['project/create'],
  'app/install/wordpress': ['project/create'],
  'database/mysql/create': ['project/create'],
  'backup/create': ['project/create'],
  'container/run': ['project/create'],

  // Tier 4 - resource-dependent
  'app/get': ['app/list'],
  'app/update': ['app/list'],
  'database/mysql/user-create': ['database/mysql/create'],
  'backup/get': ['backup/create'],
  'cronjob/execute': ['cronjob/create'],
};
```

### Step 6: Define Success Indicators

Create success indicators for each tool category:

```typescript
const SUCCESS_INDICATORS: Record<string, string[]> = {
  // List operations
  'list': ['Returns array of resources', 'No authentication errors'],

  // Get operations
  'get': ['Returns resource details', 'Resource ID matches request'],

  // Create operations
  'create': ['Returns new resource ID', 'Resource appears in list', 'No quota errors'],

  // Delete operations
  'delete': ['Resource removed from list', 'Confirmation received'],

  // Update operations
  'update': ['Updated fields reflected', 'No validation errors'],

  // Execute operations
  'execute': ['Execution initiated', 'Status returned'],
};
```

### Step 7: Generate Complete Inventory

```typescript
async function generateInventory(): Promise<ToolInventory> {
  const tools: ToolEntry[] = [];

  // Read all handler files
  const handlerDir = '/src/handlers/tools/mittwald-cli';
  const files = await findAllHandlers(handlerDir);

  for (const file of files) {
    const displayName = fileToDisplayName(file);
    const mcpName = displayNameToMcpName(displayName);
    const domain = assignDomain(displayName);
    const tier = assignTier(displayName);

    tools.push({
      mcp_name: mcpName,
      display_name: displayName,
      domain,
      tier,
      description: extractDescription(file),
      dependencies: DEPENDENCY_MAP[displayName] || inferDependencies(displayName, tier),
      required_resources: inferRequiredResources(displayName, tier),
      success_indicators: generateSuccessIndicators(displayName),
      is_destructive: isDestructive(displayName),
      is_interactive: isInteractive(displayName),
      parameters: extractParameters(file)
    });
  }

  return {
    generated_at: new Date().toISOString(),
    tool_count: tools.length,
    source: 'mittwald-mcp-fly2.fly.dev',
    domains: countByDomain(tools),
    tools: tools.sort((a, b) => a.display_name.localeCompare(b.display_name))
  };
}
```

### Step 8: Validate Inventory

```typescript
function validateInventory(inventory: ToolInventory): string[] {
  const errors: string[] = [];

  // Check tool count
  if (inventory.tool_count !== 175) {
    errors.push(`Expected 175 tools, found ${inventory.tool_count}`);
  }

  // Check all domains covered
  const expectedDomains = ['identity', 'organization', 'project-foundation', 'apps',
    'containers', 'databases', 'domains-mail', 'access-users', 'automation', 'backups', 'misc'];
  for (const domain of expectedDomains) {
    if (!inventory.domains[domain]) {
      errors.push(`Missing domain: ${domain}`);
    }
  }

  // Check each tool has required fields
  for (const tool of inventory.tools) {
    if (!tool.mcp_name) errors.push(`Tool missing mcp_name: ${tool.display_name}`);
    if (!tool.description) errors.push(`Tool missing description: ${tool.display_name}`);
    if (tool.success_indicators.length === 0) {
      errors.push(`Tool has no success indicators: ${tool.display_name}`);
    }
  }

  // Check for duplicate tool names
  const names = new Set<string>();
  for (const tool of inventory.tools) {
    if (names.has(tool.mcp_name)) {
      errors.push(`Duplicate tool name: ${tool.mcp_name}`);
    }
    names.add(tool.mcp_name);
  }

  return errors;
}
```

## Complete Tool List by Domain

### identity (17 tools)
- user/get, user/session/list, user/session/get, user/ssh-key/list, user/ssh-key/get
- user/ssh-key/create, user/ssh-key/delete, user/ssh-key/import
- user/api-token/list, user/api-token/get, user/api-token/create, user/api-token/revoke
- context/get, context/set, context/reset, context/accessible-projects, context/get-session

### organization (14 tools)
- org/list, org/get, org/delete, org/invite, org/invite-list, org/invite-list-own
- org/invite-revoke, org/membership-list, org/membership-list-own, org/membership-revoke
- extension/list, extension/install, extension/list-installed, extension/uninstall

### project-foundation (16 tools)
- project/create, project/list, project/get, project/delete, project/update
- project/filesystem-usage, project/ssh, project/invite-get, project/invite-list
- project/invite-list-own, project/membership-get, project/membership-get-own
- project/membership-list, project/membership-list-own, server/list, server/get

### apps (28 tools)
- app/create/node, app/create/php, app/create/php-worker, app/create/python, app/create/static
- app/install/wordpress, app/install/typo3, app/install/joomla, app/install/contao
- app/install/shopware5, app/install/shopware6, app/install/matomo, app/install/nextcloud
- app/list, app/get, app/update, app/upgrade, app/uninstall, app/copy
- app/download, app/upload, app/open, app/ssh, app/versions
- app/list-upgrade-candidates, app/dependency-list, app/dependency-update, app/dependency-versions

### containers (19 tools)
- container/run, container/list, container/logs, container/start, container/stop
- container/restart, container/recreate, container/delete, container/update
- stack/list, stack/deploy, stack/ps, stack/delete
- volume/list, volume/create, volume/delete
- registry/list, registry/create, registry/update, registry/delete

### databases (21 tools)
- database/list
- database/mysql/create, database/mysql/list, database/mysql/get, database/mysql/delete
- database/mysql/charsets, database/mysql/versions, database/mysql/dump, database/mysql/import
- database/mysql/shell, database/mysql/port-forward, database/mysql/phpmyadmin
- database/mysql/user-create, database/mysql/user-list, database/mysql/user-get
- database/mysql/user-update, database/mysql/user-delete
- database/redis/create, database/redis/list, database/redis/get, database/redis/versions

### domains-mail (20 tools)
- domain/list, domain/get, domain/dnszone/list, domain/dnszone/get, domain/dnszone/update
- domain/virtualhost-list, domain/virtualhost-get, domain/virtualhost-create, domain/virtualhost-delete
- mail/address/list, mail/address/get, mail/address/create, mail/address/update, mail/address/delete
- mail/deliverybox/list, mail/deliverybox/get, mail/deliverybox/create
- mail/deliverybox/update, mail/deliverybox/delete
- certificate/list, certificate/request

### access-users (8 tools)
- sftp/user-list, sftp/user-create, sftp/user-update, sftp/user-delete
- ssh/user-list, ssh/user-create, ssh/user-update, ssh/user-delete

### automation (10 tools)
- cronjob/list, cronjob/get, cronjob/create, cronjob/update, cronjob/delete
- cronjob/execute, cronjob/execution-list, cronjob/execution-get
- cronjob/execution-abort, cronjob/execution-logs

### backups (9 tools)
- backup/list, backup/get, backup/create, backup/delete, backup/download
- backup/schedule-list, backup/schedule-create, backup/schedule-update, backup/schedule-delete

### misc (13 tools)
- conversation/list, conversation/show, conversation/create, conversation/reply
- conversation/close, conversation/categories
- login/status, login/token, login/reset
- ddev/init, ddev/render-config
- context/set-session, context/reset-session

## Deliverables

- [ ] `evals/inventory/tools.json` - Complete tool inventory
- [ ] All 175 tools included
- [ ] Each tool has domain, tier, description, dependencies, success indicators
- [ ] Inventory passes validation

## Acceptance Criteria

1. Inventory contains exactly 175 tools
2. All tools have valid domain assignments
3. All tools have tier classifications (0-4)
4. All tools have at least one success indicator
5. Dependencies form valid DAG (no cycles)
6. JSON is valid and machine-readable

## Parallelization Notes

This WP is **on the critical path** - it must complete before:
- **WP-02** can generate prompts
- **WP-05** can generate dependency graph
- **Phase 3** (WP-07 to WP-17) can begin

Can be started immediately as it has no dependencies.

## Dependencies

- Access to MCP server tool definitions
- Existing `grouping.ts` classification logic
