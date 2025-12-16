---
work_package_id: "WP14"
subtasks:
  - "T001"
title: "Generate Prompts - access-users (8 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "30452"
review_status: "acknowledged"
reviewed_by: "claude-reviewer"
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
---

## Review Feedback

**Status**: ❌ **Needs Changes**

**Key Issues**:
1. **Schema validation failures** - All 8 prompts fail validation due to additional properties in `metadata` object:
   - `destructive: true` - Property not allowed (already captured via `tags` array)
   - `security_considerations: [...]` - Property not in schema

   Error messages:
   ```
   (root) [destructive] must NOT have additional properties
   (root) [security_considerations] must NOT have additional properties
   ```

2. **Schema contract violation** - The `eval-prompt-metadata.schema.json` has `additionalProperties: false`, so custom fields break validation.

**What Was Done Well**:
- Excellent security warnings embedded in the prompt text (especially for delete operations)
- `destructive` tag correctly added to `tags` array
- Comprehensive setup instructions
- Good step-by-step guidance for users

**Root Cause**:
The implementation manually added properties that aren't in the schema. Compare to `org/delete.json` which passes validation - it uses only `tags` for the destructive flag and doesn't add extra metadata properties.

**Action Items** (must complete before re-review):
- [x] Remove `destructive: true` property from metadata in all 8 files (the `destructive` tag in `tags` array is sufficient)
- [x] Remove `security_considerations: [...]` property from metadata in all 8 files (this info is already in the prompt text)
- [ ] Re-run validation: `npx tsx evals/scripts/generate-eval-prompts.ts --validate <file>` for each file
- [ ] Verify all 8 files pass validation

**Alternative Fix** (optional, for future sprints):
If `security_considerations` as structured metadata is valuable, update `eval-prompt-metadata.schema.json` to allow it. But for this sprint, stick to the existing schema.

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
4. **All prompts pass schema validation** ← fixing

