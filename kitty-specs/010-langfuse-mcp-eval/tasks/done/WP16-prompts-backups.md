---
work_package_id: "WP16"
subtasks:
  - "T001"
title: "Generate Prompts - backups (9 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "done"
assignee: "claude"
agent: "claude-reviewer"
shell_pid: "21815"
review_status: "approved"
reviewed_by: "claude-reviewer"
history:
  - timestamp: "2025-12-16T13:16:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:00:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "99655"
    action: "Started implementation - improving backup prompts"
  - timestamp: "2025-12-16T17:05:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "99655"
    action: "Completed - all 9 prompts generated with destructive warnings"
  - timestamp: "2025-12-16T18:00:00Z"
    lane: "done"
    agent: "claude-reviewer"
    shell_pid: "21815"
    action: "Approved - all 9 prompts verified, delete warnings present, acceptance criteria met"
---

# Work Package Prompt: WP16 – Generate Prompts - backups (9 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 9 tools in the backups domain covering backup creation, management, and scheduling.

## Domain Overview

| Domain | backups |
|--------|---------|
| Tool Count | 9 |
| Primary Tier | 4 (requires project) |
| Prefix | `backup/` |
| Risk Level | Medium |

## Tool List

### backup/ lifecycle (5)

| Tool | Tier | Destructive |
|------|------|-------------|
| `backup/list` | 4 | No |
| `backup/get` | 4 | No |
| `backup/create` | 4 | No |
| `backup/delete` | 4 | **Yes** |
| `backup/download` | 4 | No |

### backup/schedule/ (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `backup/schedule-list` | 4 | No |
| `backup/schedule-create` | 4 | No |
| `backup/schedule-update` | 4 | No |
| `backup/schedule-delete` | 4 | **Yes** |

## Key Tool Details

### backup/create
- Creates a project backup
- Parameters: `projectId`, `description`, `expires`
- Long-running operation - use `wait: true`

### backup/download
- Downloads backup archive
- Parameters: `backupId`, `output`, `format`
- Large file operation

### backup/schedule-create
- Creates automated backup schedule
- Parameters: `projectId`, `schedule` (cron), `ttl`

## Deliverables

- [ ] `evals/prompts/backups/backup-list.json`
- [ ] `evals/prompts/backups/backup-get.json`
- [ ] `evals/prompts/backups/backup-create.json`
- [ ] `evals/prompts/backups/backup-delete.json`
- [ ] `evals/prompts/backups/backup-download.json`
- [ ] `evals/prompts/backups/backup-schedule-list.json`
- [ ] `evals/prompts/backups/backup-schedule-create.json`
- [ ] `evals/prompts/backups/backup-schedule-update.json`
- [ ] `evals/prompts/backups/backup-schedule-delete.json`

**Total**: 9 JSON files

## Acceptance Criteria

1. All 9 prompt files created
2. Long-running operation timeouts noted
3. Delete warnings included

