---
work_package_id: "WP16"
subtasks:
  - "T001"
title: "Generate Prompts - backups (9 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:16:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
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

