# Comprehensive Prompt for MCP Tool Evaluation Execution

## Context

You are executing a complete evaluation of 115 Mittwald MCP tools for a baseline run. This is a **software testing exercise** to validate MCP tool functionality and establish baseline performance metrics.

## Critical Rules

1. **EXECUTE ALL TOOLS** - You have direct access to all Mittwald MCP tools (e.g., `mcp__mittwald__mittwald_user_get`). Call them directly using the tool interface.
2. **NO SHORTCUTS** - Do not copy results from previous runs. Do not create placeholder/template results. Every tool must be actually executed.
3. **DOCUMENT REAL RESULTS** - Save actual API responses whether success or failure (403, 500, validation errors are all valid test results).
4. **NO SAFETY DECISIONS** - This is a testing exercise. Execute create/delete/update operations. Document what happens. The API will enforce its own permissions.

## Task Overview

Execute all 115 tools across 12 work packages and save results to:
`/Users/robert/Code/mittwald-mcp/evals/results/active/{domain}/{tool-name}-result.json`

The `active` symlink points to the current run directory in: `/Users/robert/Code/mittwald-mcp/evals/results/runs/run-YYYYMMDD-HHMMSS/`

## Execution Order (CRITICAL: Follow Tier Dependencies)

### Tier System Overview
Tools are classified by dependency tier (0-4). **Execute in tier order** to ensure lower tiers create resources that higher tiers depend on:

- **Tier 0**: No dependencies (create base resources)
- **Tier 1-3**: Intermediate resources (use tier 0 output)
- **Tier 4**: Project-scoped operations (use tier 0-3 output)

### Phase 1: Tier 0 (No Dependencies) - Execute First
- **WP01-identity** (12 tools): `/evals/prompts/identity/*.json`
  - Creates: user info, API tokens, SSH keys
  - Outputs: sshKeyId, apiTokenId for tier 1+

- **WP02-organization** (7 tools): `/evals/prompts/organization/*.json`
  - Creates: org invites, memberships
  - Outputs: orgId, inviteId for tier 1+

- **WP03-context** (3 tools): `/evals/prompts/context/*.json`
  - Creates: session context
  - Outputs: session state for all tiers

**IMPORTANT**: Capture resource IDs from create operations and save to `evals/fixtures/runtime-fixtures.json` for use in higher tiers.

### Phase 2: Project Foundation (Tier 1-3)
- **WP12-project-foundation** (12 tools): `/evals/prompts/project-foundation/*.json`
  - Use existing project: `fd1ef726-14b8-4906-8a45-0756ba993246`
  - Or create test project and save projectId to runtime-fixtures.json

### Phase 3: Project-Dependent (Tier 4) - Execute After Phase 2

**Within each WP, execute in tier order** (tier 0 → tier 1 → tier 2 → tier 3 → tier 4):

- **WP04-apps** (8 tools): Create app installations, use IDs for get/update/delete
- **WP05-databases** (14 tools): Create databases, create users, delete cleanup
- **WP06-domains-mail** (21 tools): Create mail addresses, deliveryboxes, use IDs for get/delete
- **WP07-automation** (9 tools): Create cronjobs (tier 3), execute/update/delete (tier 4)
- **WP08-backups** (8 tools): Create backup schedules (tier 3), update/delete (tier 4)
- **WP09-containers** (10 tools): Create registries/stacks, use IDs for update/delete
- **WP10-access-users** (6 tools): Create SSH/SFTP users, use IDs for update/delete
- **WP11-misc** (5 tools): Conversation tools (disabled - admin-only)

All Phase 3 tools should use `projectId: fd1ef726-14b8-4906-8a45-0756ba993246`

### Fixture Pattern (NEW)

**Before starting Phase 3**: Read `evals/fixtures/runtime-fixtures.json` for existing resource IDs from Phase 1-2.

**During CREATE operations**: Save created resource IDs to runtime-fixtures.json:
```json
{
  "cronjobs": [{"id": "...", "description": "...", "createdDuringEval": true}],
  "backupSchedules": [{"id": "...", "createdDuringEval": true}]
}
```

**During GET/UPDATE/DELETE operations**: Use real IDs from runtime-fixtures.json (NOT test IDs like "test-cronjob-id").

**After WP completion**: Delete resources marked `createdDuringEval: true` for cleanup.

## How to Execute Each Tool

### Step 1: Read the Eval Prompt
```bash
jq -r '.input.prompt' /Users/robert/Code/mittwald-mcp/evals/prompts/{domain}/{tool-name}.json
```

### Step 2: Call the MCP Tool
Use the MCP tool interface directly. Example:
```
mcp__mittwald__mittwald_user_get()
mcp__mittwald__mittwald_project_list()
mcp__mittwald__mittwald_app_list(projectId: "fd1ef726-14b8-4906-8a45-0756ba993246")
```

### Step 3: Generate Self-Assessment
Create JSON with this exact structure:
```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_TOOLNAME",
  "timestamp": "2025-12-19T10:50:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "Brief summary of what happened",
  "execution_notes": "Observations about the execution"
}
```

**For failures**, set `success: false` and add to `problems_encountered`:
```json
{
  "success": false,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_database_mysql_create",
  "timestamp": "2025-12-19T10:50:00Z",
  "problems_encountered": [
    {
      "type": "api_error",
      "description": "HTTP 500 Internal Server Error from API endpoint"
    }
  ],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "Failed with 500 server error",
  "execution_notes": "API endpoint issue, not tool issue"
}
```

### Step 4: Save Immediately
```bash
cat > /Users/robert/Code/mittwald-mcp/evals/results/active/{domain}/{tool-name}-result.json << 'EOF'
{...json content...}
EOF
```

## Problem Types for Failures
- `auth_error` - Authentication/authorization failed
- `permission_denied` - HTTP 403
- `api_error` - HTTP 500 or other API errors
- `validation_error` - HTTP 400, parameter validation
- `resource_not_found` - HTTP 404
- `dependency_missing` - Required resource doesn't exist
- `timeout` - Operation timed out
- `other` - Other issues

## Examples

### Example 1: List Operation (Success)
```
Tool: mcp__mittwald__mittwald_app_list
Result: {"status":"success", "data":[...apps...]}
Save to: evals/results/active/apps/app-list-result.json
Self-assessment: success=true, summary="Listed 2 apps successfully"
```

### Example 2: Create Operation (Success)
```
Tool: mcp__mittwald__mittwald_app_copy
Parameters: {installationId: "...", description: "Test copy"}
Result: {"status":"success", "data":{"newInstallationId":"..."}}
Save to: evals/results/active/apps/app-copy-result.json
Self-assessment: success=true, resources_created=[{type:"app",id:"..."}]
```

### Example 3: Delete Operation (Success - Cleanup)
```
Tool: mcp__mittwald__mittwald_app_uninstall
Parameters: {installationId: "...", confirm: true}
Result: {"status":"success"}
Self-assessment: success=true, summary="Uninstalled test app copy"
```

### Example 4: API Error (Document It)
```
Tool: mcp__mittwald__mittwald_database_mysql_create
Result: {"status":"error", "code":500}
Save to: evals/results/active/databases/database-mysql-create-result.json
Self-assessment: success=false, problems=[{type:"api_error", description:"HTTP 500"}]
```

## Efficiency Tips

1. **Batch MCP tool calls** - Call multiple tools in parallel when there are no dependencies
2. **Batch save results** - Use shell scripts to save multiple results at once
3. **Reuse resource IDs** - When a list operation returns resources, use those IDs for get/update/delete operations
4. **Clean up after creates** - If you create test resources (app copy, Redis DB), delete them afterward

## Expected Outcomes

- **Some tools will succeed** (list, get operations)
- **Some tools will fail with 403** (permission denied - document it)
- **Some tools will fail with 500** (API errors - document it)
- **Some tools will fail with 400** (validation errors - document it)
- **Some creates may succeed** (document and optionally clean up)

All of these are **valid test results**. Document what actually happens.

## Verification

When complete, verify:
```bash
ls /Users/robert/Code/mittwald-mcp/evals/results/active/*/*.json | wc -l
# Should output: 115

# Check each domain
for d in identity organization context project-foundation apps databases domains-mail automation backups containers access-users misc; do
  count=$(ls /Users/robert/Code/mittwald-mcp/evals/results/active/$d/*.json 2>/dev/null | wc -l)
  expected=$(ls /Users/robert/Code/mittwald-mcp/evals/prompts/$d/*.json 2>/dev/null | wc -l)
  echo "$d: $count/$expected"
done
```

All counts should match prompts directory counts.

## Common Pitfalls to Avoid

1. **DON'T spawn sub-agents** - They don't have MCP tool access. You have the tools, execute them yourself.
2. **DON'T copy previous run results** - Each run must have fresh execution data for comparison.
3. **DON'T skip tools for "safety"** - This is a controlled testing environment. Execute everything.
4. **DON'T write scripts that simulate tool calls** - Call the actual MCP tools.
5. **DON'T batch-create placeholder results** - Each result must reflect actual execution.

## What Success Looks Like

- 115 result JSON files in `/evals/results/active/{domain}/`
- Each file contains real execution data (success or documented failure)
- Timestamps reflect actual execution time
- Resource IDs in results match actual API responses
- Create→Update→Delete sequences properly documented
- Permission errors properly captured (403, not "skipped for safety")

## Final Note

This is a **testing exercise**, not production work. Execute ALL tools including potentially destructive operations. The goal is to test the MCP server's behavior, error handling, and consistency - not to make safety judgments about what should or shouldn't be executed.

The Mittwald API will enforce its own permissions and quota limits. Your job is to attempt every tool call and document what happens.
