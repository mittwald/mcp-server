---
work_package_id: "WP12"
subtasks:
  - "T001"
title: "Generate Prompts - databases (21 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "done"
assignee: "claude"
agent: "claude-reviewer"
shell_pid: "22058"
review_status: "approved without changes"
reviewed_by: "claude-reviewer"
history:
  - timestamp: "2025-12-16T13:12:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T15:30:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "266"
    action: "Started implementation - generating database eval prompts"
  - timestamp: "2025-12-16T15:51:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "266"
    action: "Completed implementation - all 21 database prompts generated with Tier 0/destructive classification correct"
  - timestamp: "2025-12-16T17:58:00Z"
    lane: "done"
    agent: "claude-reviewer"
    shell_pid: "22058"
    action: "Review APPROVED - all 22 database prompts verified (21 in WP + 1 database-index.json). Delete operations have ⚠️ WARNING. Tier 0 tools correctly classified."
---

# Work Package Prompt: WP12 – Generate Prompts - databases (21 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 21 tools in the databases domain covering MySQL and Redis operations.

## Domain Overview

| Domain | databases |
|--------|-----------|
| Tool Count | 21 |
| Primary Tier | 4 (requires project) |
| Prefix | `database/` |
| Risk Level | High (data operations) |

## Tool List

### database/ general (1)

| Tool | Tier | Destructive |
|------|------|-------------|
| `database/list` | 4 | No |

### database/mysql/ tools (16)

| Tool | Tier | Destructive |
|------|------|-------------|
| `database/mysql/create` | 4 | No |
| `database/mysql/list` | 4 | No |
| `database/mysql/get` | 4 | No |
| `database/mysql/delete` | 4 | **Yes - DATA LOSS** |
| `database/mysql/charsets` | 0 | No |
| `database/mysql/versions` | 0 | No |
| `database/mysql/dump` | 4 | No |
| `database/mysql/import` | 4 | No |
| `database/mysql/shell` | 4 | No (interactive) |
| `database/mysql/port-forward` | 4 | No (interactive) |
| `database/mysql/phpmyadmin` | 4 | No |
| `database/mysql/user-create` | 4 | No |
| `database/mysql/user-list` | 4 | No |
| `database/mysql/user-get` | 4 | No |
| `database/mysql/user-update` | 4 | No |
| `database/mysql/user-delete` | 4 | **Yes** |

### database/redis/ tools (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `database/redis/create` | 4 | No |
| `database/redis/list` | 4 | No |
| `database/redis/get` | 4 | No |
| `database/redis/versions` | 0 | No |

## Critical Operations

### database/mysql/create
- Creates MySQL database
- Parameters: `projectId`, `description`, `version`
- Use `database/mysql/versions` first to get available versions

### database/mysql/delete
- **WARNING**: Permanently deletes database and ALL data
- Parameters: `databaseId`, `confirm: true`
- Never run on production database

### database/mysql/user-create
- Creates database user
- Parameters: `databaseId`, `description`, `accessLevel`, `password`

## Deliverables

- [ ] `evals/prompts/databases/database-list.json`
- [ ] `evals/prompts/databases/database-mysql-create.json`
- [ ] `evals/prompts/databases/database-mysql-list.json`
- [ ] `evals/prompts/databases/database-mysql-get.json`
- [ ] `evals/prompts/databases/database-mysql-delete.json`
- [ ] `evals/prompts/databases/database-mysql-charsets.json`
- [ ] `evals/prompts/databases/database-mysql-versions.json`
- [ ] `evals/prompts/databases/database-mysql-dump.json`
- [ ] `evals/prompts/databases/database-mysql-import.json`
- [ ] `evals/prompts/databases/database-mysql-shell.json`
- [ ] `evals/prompts/databases/database-mysql-port-forward.json`
- [ ] `evals/prompts/databases/database-mysql-phpmyadmin.json`
- [ ] `evals/prompts/databases/database-mysql-user-create.json`
- [ ] `evals/prompts/databases/database-mysql-user-list.json`
- [ ] `evals/prompts/databases/database-mysql-user-get.json`
- [ ] `evals/prompts/databases/database-mysql-user-update.json`
- [ ] `evals/prompts/databases/database-mysql-user-delete.json`
- [ ] `evals/prompts/databases/database-redis-create.json`
- [ ] `evals/prompts/databases/database-redis-list.json`
- [ ] `evals/prompts/databases/database-redis-get.json`
- [ ] `evals/prompts/databases/database-redis-versions.json`

**Total**: 21 JSON files

## Acceptance Criteria

1. All 21 prompt files created
2. Delete operations have strong warnings
3. Version/charset tools marked as Tier 0

