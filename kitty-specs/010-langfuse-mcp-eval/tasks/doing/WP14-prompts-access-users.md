---
work_package_id: "WP14"
subtasks:
  - "T001"
title: "Generate Prompts - access-users (8 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:14:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP14 – Generate Prompts - access-users (8 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 8 tools in the access-users domain covering SFTP and SSH user management.

## Domain Overview

| Domain | access-users |
|--------|--------------|
| Tool Count | 8 |
| Primary Tier | 4 (requires project) |
| Prefixes | `sftp/`, `ssh/` |
| Risk Level | Medium (user access management) |

## Tool List

### sftp/ tools (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `sftp/user-list` | 4 | No |
| `sftp/user-create` | 4 | No |
| `sftp/user-update` | 4 | No |
| `sftp/user-delete` | 4 | **Yes** |

### ssh/ tools (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `ssh/user-list` | 4 | No |
| `ssh/user-create` | 4 | No |
| `ssh/user-update` | 4 | No |
| `ssh/user-delete` | 4 | **Yes** |

## Key Tool Details

### sftp/user-create
- Creates SFTP user for file transfer access
- Parameters: `projectId`, `description`, `directories`, `password`/`publicKey`
- Can restrict to specific directories

### ssh/user-create
- Creates SSH user for shell access
- Parameters: `projectId`, `description`, `password`/`publicKey`
- Full shell access by default

## Security Considerations

- Created users have access to project files
- Use strong passwords or key-based auth
- Track created users for cleanup
- Delete users promptly after eval

## Deliverables

- [ ] `evals/prompts/access-users/sftp-user-list.json`
- [ ] `evals/prompts/access-users/sftp-user-create.json`
- [ ] `evals/prompts/access-users/sftp-user-update.json`
- [ ] `evals/prompts/access-users/sftp-user-delete.json`
- [ ] `evals/prompts/access-users/ssh-user-list.json`
- [ ] `evals/prompts/access-users/ssh-user-create.json`
- [ ] `evals/prompts/access-users/ssh-user-update.json`
- [ ] `evals/prompts/access-users/ssh-user-delete.json`

**Total**: 8 JSON files

## Acceptance Criteria

1. All 8 prompt files created
2. Security considerations documented in prompts
3. Delete operations have warnings

