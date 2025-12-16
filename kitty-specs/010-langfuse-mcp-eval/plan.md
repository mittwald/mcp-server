# Implementation Plan: Langfuse MCP Eval Suite

**Branch**: `010-langfuse-mcp-eval` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)

## Summary

Create a comprehensive evaluation suite for the Mittwald MCP server with Langfuse-compatible eval prompts for all 175 tools across 10+ domains. The approach: (1) generate Langfuse-format eval prompts with embedded self-assessment instructions, (2) execute each eval via spec-kitty agents, (3) extract structured self-assessments from session logs, (4) aggregate baseline results by domain.

## Technical Context

| Decision | Choice | Source |
|----------|--------|--------|
| **Langfuse Schema** | `input` (prompt, tool_name, context), `expectedOutput=null`, `metadata` (domain, tier, success_indicators) | D-001 |
| **Tool Count** | 175 verified CLI tool handlers | D-002 |
| **Tier Classification** | Tiers 0-4 based on existing test harness | D-002 |
| **Self-Assessment** | JSON schema with marker extraction (`<!-- SELF_ASSESSMENT_START/END -->`) | D-003 |
| **Execution** | Via spec-kitty agents (Claude Code sessions) | User confirmation |
| **Infrastructure Reuse** | Existing inventory/grouping from sprint 005-009 | D-004 |

## Constitution Check

No project constitution is defined. Proceeding with standard engineering practices:
- TypeScript for new tooling
- JSON schemas for contracts
- JSONL for datasets
- Incremental execution with domain-based checkpoints

## Quality Gates

### Before Prompt Generation
- [ ] Tool inventory verified (175 tools)
- [ ] Dependency graph generated and validated
- [ ] Eval prompt schema finalized
- [ ] Self-assessment schema finalized
- [ ] Sample eval prompt tested manually

### Before Full Execution
- [ ] All 175 eval prompts generated
- [ ] Pilot domain (identity) executed successfully
- [ ] Self-assessment extraction validated
- [ ] Coverage tracking operational

### Before Completion
- [ ] All 175 tools executed
- [ ] Self-assessments extracted from all sessions
- [ ] Domain coverage reports generated
- [ ] Langfuse-format dataset exported

---

## Phase 0: Research (COMPLETE)

See [research.md](./research.md) for documented decisions:
- **D-001**: Langfuse dataset schema
- **D-002**: Tool inventory and tier classification
- **D-003**: Self-assessment schema with markers
- **D-004**: Infrastructure reuse strategy

---

## Phase 1: Infrastructure & Schemas

### 1.1 Create JSON Schema Contracts

**Output**: `contracts/` directory with validated schemas

| Schema | Purpose | Location |
|--------|---------|----------|
| `eval-prompt-input.schema.json` | Langfuse `input` field validation | `contracts/` |
| `eval-prompt-metadata.schema.json` | Langfuse `metadata` field validation | `contracts/` |
| `self-assessment.schema.json` | LLM output validation | `contracts/` |
| `eval-result.schema.json` | Combined result structure | `contracts/` |

### 1.2 Create Eval Prompt Template

**Output**: `templates/eval-prompt.md` - The master template for all eval prompts

Template structure:
```markdown
# Eval: {tool_display_name}

## Goal
Test the `{tool_name}` MCP tool by {action_description}.

## Context
- **Domain**: {domain}
- **Tier**: {tier}
- **Dependencies**: {dependency_list or "None (Tier 0)"}

## Setup Instructions
{setup_instructions or "No setup required for Tier 0 tools."}

## Task
1. Execute the `{tool_name}` tool with appropriate parameters
2. Verify the result
3. Provide a self-assessment

## Success Indicators
{success_indicators_list}

## Self-Assessment Instructions
After completing the task, output your assessment in the following format:

<!-- SELF_ASSESSMENT_START -->
{
  "success": true/false,
  "confidence": "high/medium/low",
  "tool_executed": "{tool_name}",
  "timestamp": "ISO-8601",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "...",
  "execution_notes": "..."
}
<!-- SELF_ASSESSMENT_END -->
```

### 1.3 Self-Assessment Extractor

**Output**: `scripts/extract-self-assessment.ts`

- Parse session logs for marker comments
- Extract JSON between markers
- Validate against schema
- Handle missing/malformed assessments

---

## Phase 2: Dependency Graph & Tool Inventory

### 2.1 Generate Complete Tool Inventory

**Output**: `evals/inventory/tools.json`

Structure:
```json
{
  "generated_at": "ISO-8601",
  "tool_count": 175,
  "tools": [
    {
      "mcp_name": "mcp__mittwald__mittwald_app_create_node",
      "display_name": "app/create/node",
      "domain": "apps",
      "tier": 4,
      "description": "Create a Node.js app",
      "dependencies": ["project/create"],
      "success_indicators": ["App ID returned", "App visible in list"]
    }
  ]
}
```

### 2.2 Generate Dependency Graph

**Output**:
- `evals/inventory/dependency-graph.json` (adjacency list)
- `evals/inventory/dependency-graph.dot` (Graphviz visualization)

### 2.3 Tier Analysis Report

**Output**: `evals/inventory/tier-analysis.md`

Summary of tools by tier:
- Tier 0: ~15 tools (no dependencies)
- Tier 1: ~12 tools (org-level)
- Tier 2: ~2 tools (server-level)
- Tier 3: ~4 tools (project creation)
- Tier 4: ~142 tools (requires project)

---

## Phase 3: Eval Prompt Generation

Generate Langfuse-compatible eval prompts for all 175 tools, organized by domain.

### 3.1 Domain: identity (17 tools)

**Tools**: user/get, user/session/list, user/session/get, user/ssh-key/list, user/ssh-key/get, user/ssh-key/create, user/ssh-key/delete, user/ssh-key/import, user/api-token/list, user/api-token/get, user/api-token/create, user/api-token/revoke, context/get, context/set, context/reset, context/accessible-projects, context/get-session

**Output**: `evals/prompts/identity/*.json`

### 3.2 Domain: organization (14 tools)

**Tools**: org/list, org/get, org/delete, org/invite, org/invite-list, org/invite-list-own, org/invite-revoke, org/membership-list, org/membership-list-own, org/membership-revoke, extension/list, extension/install, extension/list-installed, extension/uninstall

**Output**: `evals/prompts/organization/*.json`

### 3.3 Domain: project-foundation (16 tools)

**Tools**: project/create, project/list, project/get, project/delete, project/update, project/filesystem-usage, project/ssh, project/invite-get, project/invite-list, project/invite-list-own, project/membership-get, project/membership-get-own, project/membership-list, project/membership-list-own, server/list, server/get

**Output**: `evals/prompts/project-foundation/*.json`

### 3.4 Domain: apps (28 tools)

**Tools**: app/create/node, app/create/php, app/create/php-worker, app/create/python, app/create/static, app/install/wordpress, app/install/typo3, app/install/joomla, app/install/contao, app/install/shopware5, app/install/shopware6, app/install/matomo, app/install/nextcloud, app/list, app/get, app/update, app/upgrade, app/uninstall, app/copy, app/download, app/upload, app/open, app/ssh, app/versions, app/list-upgrade-candidates, app/dependency-list, app/dependency-update, app/dependency-versions

**Output**: `evals/prompts/apps/*.json`

### 3.5 Domain: containers (15 tools)

**Tools**: container/run, container/list, container/logs, container/start, container/stop, container/restart, container/recreate, container/delete, container/update, stack/list, stack/deploy, stack/ps, stack/delete, volume/list, volume/create, volume/delete, registry/list, registry/create, registry/update, registry/delete

**Output**: `evals/prompts/containers/*.json`

### 3.6 Domain: databases (22 tools)

**Tools**: database/list, database/mysql/create, database/mysql/list, database/mysql/get, database/mysql/delete, database/mysql/charsets, database/mysql/versions, database/mysql/dump, database/mysql/import, database/mysql/shell, database/mysql/port-forward, database/mysql/phpmyadmin, database/mysql/user-create, database/mysql/user-list, database/mysql/user-get, database/mysql/user-update, database/mysql/user-delete, database/redis/create, database/redis/list, database/redis/get, database/redis/versions

**Output**: `evals/prompts/databases/*.json`

### 3.7 Domain: domains-mail (18 tools)

**Tools**: domain/list, domain/get, domain/dnszone/list, domain/dnszone/get, domain/dnszone/update, domain/virtualhost-list, domain/virtualhost-get, domain/virtualhost-create, domain/virtualhost-delete, mail/address/list, mail/address/get, mail/address/create, mail/address/update, mail/address/delete, mail/deliverybox/list, mail/deliverybox/get, mail/deliverybox/create, mail/deliverybox/update, mail/deliverybox/delete, certificate/list, certificate/request

**Output**: `evals/prompts/domains-mail/*.json`

### 3.8 Domain: access-users (8 tools)

**Tools**: sftp/user-list, sftp/user-create, sftp/user-update, sftp/user-delete, ssh/user-list, ssh/user-create, ssh/user-update, ssh/user-delete

**Output**: `evals/prompts/access-users/*.json`

### 3.9 Domain: automation (11 tools)

**Tools**: cronjob/list, cronjob/get, cronjob/create, cronjob/update, cronjob/delete, cronjob/execute, cronjob/execution-list, cronjob/execution-get, cronjob/execution-abort, cronjob/execution-logs

**Output**: `evals/prompts/automation/*.json`

### 3.10 Domain: backups (9 tools)

**Tools**: backup/list, backup/get, backup/create, backup/delete, backup/download, backup/schedule-list, backup/schedule-create, backup/schedule-update, backup/schedule-delete

**Output**: `evals/prompts/backups/*.json`

### 3.11 Domain: misc (13 tools)

**Tools**: conversation/list, conversation/show, conversation/create, conversation/reply, conversation/close, conversation/categories, login/status, login/token, login/reset, ddev/init, ddev/render-config

**Output**: `evals/prompts/misc/*.json`

---

## Phase 4: Eval Execution

Execute all 175 evals via spec-kitty agents, organized by domain for systematic progress tracking.

### Execution Strategy

1. **Order by Tier**: Execute Tier 0 tools first (no dependencies), then Tier 1-4
2. **Domain Batching**: Within each tier, process by domain
3. **Resource Tracking**: Track created resources for cleanup
4. **Checkpoint Saving**: Save progress after each domain completes

### 4.1 Execute: identity (17 evals)

Primarily Tier 0 tools - execute first as baseline validation.

### 4.2 Execute: organization (14 evals)

Tier 1 tools - requires authenticated user context.

### 4.3 Execute: project-foundation (16 evals)

Includes Tier 3 `project/create` - creates resources for subsequent domains.

### 4.4 Execute: apps (28 evals)

Tier 4 tools - requires existing project. Includes app installation tests.

### 4.5 Execute: containers (15 evals)

Tier 4 tools - container lifecycle testing.

### 4.6 Execute: databases (22 evals)

Tier 4 tools - MySQL and Redis database operations.

### 4.7 Execute: domains-mail (18 evals)

Tier 4 tools - DNS, virtualhost, and mail configuration.

### 4.8 Execute: access-users (8 evals)

Tier 4 tools - SFTP and SSH user management.

### 4.9 Execute: automation (11 evals)

Tier 4 tools - cronjob lifecycle and execution.

### 4.10 Execute: backups (9 evals)

Tier 4 tools - backup creation and scheduling.

### 4.11 Execute: misc (13 evals)

Mixed tier tools - conversations, login, ddev.

---

## Phase 5: Baseline Aggregation & Export

### 5.1 Extract Self-Assessments

Process all session logs to extract self-assessment JSON blocks.

**Output**: `evals/results/self-assessments/*.json`

### 5.2 Generate Coverage Report

**Output**: `evals/results/coverage-report.json`

```json
{
  "generated_at": "ISO-8601",
  "total_tools": 175,
  "executed": 175,
  "success_count": N,
  "failure_count": N,
  "by_domain": {
    "identity": {"total": 17, "success": N, "failure": N},
    ...
  },
  "by_tier": {
    "0": {"total": N, "success": N, "failure": N},
    ...
  }
}
```

### 5.3 Export Langfuse Dataset

**Output**: `evals/datasets/mittwald-mcp-tools.json`

Langfuse-compatible dataset with all eval prompts and baseline metadata.

### 5.4 Generate Baseline Report

**Output**: `evals/results/baseline-report.md`

Human-readable summary of:
- Overall success rate
- Problem patterns by category
- Domain-specific insights
- Recommendations for future scoring criteria

---

## File Structure

```
kitty-specs/010-langfuse-mcp-eval/
├── spec.md
├── plan.md                    # This file
├── tasks.md                   # Work package definitions
├── research.md                # Research findings (Phase 0)
├── data-model.md              # Entity definitions
├── research/
│   ├── evidence-log.csv
│   └── source-register.csv
├── contracts/
│   ├── eval-prompt-input.schema.json
│   ├── eval-prompt-metadata.schema.json
│   ├── self-assessment.schema.json
│   └── eval-result.schema.json
└── templates/
    └── eval-prompt.md

evals/                         # Main output directory
├── inventory/
│   ├── tools.json
│   ├── dependency-graph.json
│   ├── dependency-graph.dot
│   └── tier-analysis.md
├── prompts/
│   ├── identity/              # 17 prompts
│   ├── organization/          # 14 prompts
│   ├── project-foundation/    # 16 prompts
│   ├── apps/                  # 28 prompts
│   ├── containers/            # 15 prompts
│   ├── databases/             # 22 prompts
│   ├── domains-mail/          # 18 prompts
│   ├── access-users/          # 8 prompts
│   ├── automation/            # 11 prompts
│   ├── backups/               # 9 prompts
│   └── misc/                  # 13 prompts
├── results/
│   ├── sessions/              # Raw session logs
│   ├── self-assessments/      # Extracted assessments
│   ├── coverage-report.json
│   └── baseline-report.md
├── datasets/
│   └── mittwald-mcp-tools.json
└── scripts/
    └── extract-self-assessment.ts
```

---

## Work Package Summary

| Phase | WP Count | Description |
|-------|----------|-------------|
| Phase 1 | 3 | Infrastructure & Schemas |
| Phase 2 | 3 | Dependency Graph & Inventory |
| Phase 3 | 11 | Eval Prompt Generation (by domain) |
| Phase 4 | 11 | Eval Execution (by domain) |
| Phase 5 | 4 | Aggregation & Export |
| **Total** | **32** | |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Initial plan created | Claude |
