---
work_package_id: WP15
title: Generate Prompts - automation (10 tools)
lane: done
history:
- timestamp: '2025-12-16T13:15:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T17:15:00Z'
  lane: doing
  agent: claude
  shell_pid: '1391'
  action: Started implementation - all prompts already exist, verifying
- timestamp: '2025-12-16T17:20:00Z'
  lane: for_review
  agent: claude
  shell_pid: '1391'
  action: Completed - all 10 prompts verified with valid JSON structure
- timestamp: '2025-12-16T17:10:00Z'
  lane: done
  agent: claude
  shell_pid: '25634'
  action: APPROVED - All 10 prompts verified, app dependency + cron format documented, destructive ops marked
agent: claude
assignee: claude
phase: Phase 3 - Eval Prompt Generation
review_status: approved
reviewed_by: claude
shell_pid: '25634'
subtasks:
- T001
---

# Work Package Prompt: WP15 – Generate Prompts - automation (10 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 10 tools in the automation domain covering cronjob management and execution.

## Domain Overview

| Domain | automation |
|--------|------------|
| Tool Count | 10 |
| Primary Tier | 4 (requires project + app) |
| Prefix | `cronjob/` |
| Risk Level | Medium |

## Tool List

### cronjob/ lifecycle (6)

| Tool | Tier | Destructive |
|------|------|-------------|
| `cronjob/list` | 4 | No |
| `cronjob/get` | 4 | No |
| `cronjob/create` | 4 | No |
| `cronjob/update` | 4 | No |
| `cronjob/delete` | 4 | **Yes** |
| `cronjob/execute` | 4 | No |

### cronjob/execution/ (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `cronjob/execution-list` | 4 | No |
| `cronjob/execution-get` | 4 | No |
| `cronjob/execution-abort` | 4 | No |
| `cronjob/execution-logs` | 4 | No |

## Key Tool Details

### cronjob/create
- Creates a scheduled cronjob
- Parameters: `installationId`, `description`, `interval`, `command`/`url`
- Requires existing app installation

### cronjob/execute
- Manually triggers cronjob execution
- Parameters: `cronjobId`
- Returns execution ID

### cronjob/execution-logs
- View logs from execution
- Parameters: `cronjobId`, `executionId`

## Dependencies

- `cronjob/create` requires an app installation
- Execute this domain after apps domain
- Or create a simple app first

## Deliverables

- [x] `evals/prompts/automation/cronjob-list.json`
- [x] `evals/prompts/automation/cronjob-get.json`
- [x] `evals/prompts/automation/cronjob-create.json`
- [x] `evals/prompts/automation/cronjob-update.json`
- [x] `evals/prompts/automation/cronjob-delete.json`
- [x] `evals/prompts/automation/cronjob-execute.json`
- [x] `evals/prompts/automation/cronjob-execution-list.json`
- [x] `evals/prompts/automation/cronjob-execution-get.json`
- [x] `evals/prompts/automation/cronjob-execution-abort.json`
- [x] `evals/prompts/automation/cronjob-execution-logs.json`

**Total**: 10 JSON files ✓

## Acceptance Criteria

1. ✅ All 10 prompt files created
2. ✅ App dependency documented (cronjob/create shows `appInstallationId` parameter and app/list dependency)
3. ✅ Cron interval format explained (cronjob/create shows example: "0 * * * *")

