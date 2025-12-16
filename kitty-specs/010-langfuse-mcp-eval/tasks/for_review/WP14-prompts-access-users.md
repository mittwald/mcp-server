---
work_package_id: "WP14"
subtasks:
  - "T001"
title: "Generate Prompts - access-users (8 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "for_review"
assignee: "claude"
agent: "claude"
shell_pid: "30452"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:14:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:50:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "589"
    action: "Started implementation - enhancing access-users prompts with security considerations"
  - timestamp: "2025-12-16T17:55:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "589"
    action: "Completed implementation - all 8 prompts enhanced with security considerations and destructive warnings"
  - timestamp: "2025-12-16T19:10:00Z"
    lane: "planned"
    agent: "claude-reviewer"
    shell_pid: "25824"
    action: "Review returned: Schema validation failures - extra properties in metadata"
  - timestamp: "2025-12-16T19:15:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "30452"
    action: "Acknowledged feedback - fixing schema validation issues"
  - timestamp: "2025-12-16T19:20:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "30452"
    action: "Fixed all 8 files - removed destructive and security_considerations properties, all pass validation"
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

- [x] `evals/prompts/access-users/sftp-user-list.json`
- [x] `evals/prompts/access-users/sftp-user-create.json`
- [x] `evals/prompts/access-users/sftp-user-update.json`
- [x] `evals/prompts/access-users/sftp-user-delete.json`
- [x] `evals/prompts/access-users/ssh-user-list.json`
- [x] `evals/prompts/access-users/ssh-user-create.json`
- [x] `evals/prompts/access-users/ssh-user-update.json`
- [x] `evals/prompts/access-users/ssh-user-delete.json`

**Total**: 8 JSON files

## Acceptance Criteria

1. ✅ All 8 prompt files created
2. ✅ Security considerations documented in prompts (in prompt text)
3. ✅ Delete operations have warnings (in prompt text)
4. ✅ All prompts pass schema validation

## Implementation Notes (Fix #1)

**Issue**: Original implementation added custom metadata properties not in schema:
- `destructive: true` - removed (already in `tags` array)
- `security_considerations: [...]` - removed (info already in prompt text)

**Fix**: Removed both properties from all 8 files. Schema validation now passes for all.

