---
work_package_id: WP09
title: Generate Prompts - project-foundation (16 tools)
lane: done
history:
- timestamp: '2025-12-16T13:09:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T17:15:00Z'
  lane: doing
  agent: claude
  shell_pid: '650'
  action: Started implementation
- timestamp: '2025-12-16T17:55:00Z'
  lane: for_review
  agent: claude
  shell_pid: '650'
  action: Completed implementation - all 16 prompts generated with correct dependencies
- timestamp: '2025-12-16T17:00:00Z'
  lane: done
  agent: claude-opus-4-5-reviewer
  shell_pid: '15318'
  action: 'Approved: All 16 prompts pass validation, correct dependencies and warnings'
agent: claude-opus-4-5-reviewer
assignee: ''
phase: Phase 3 - Eval Prompt Generation
review_status: approved without changes
reviewed_by: claude-opus-4-5-reviewer
shell_pid: '15318'
subtasks:
- T001
---

## Review Feedback

**Status**: ✅ **Approved without changes**

**Verification Results**:
- All 16 prompt files created ✓
- All 16 prompts pass schema validation ✓
- `project/create` has proper dependencies (`server/list`) and required resources ✓
- `project/delete` has `⚠️ WARNING` banner and `destructive` tag ✓
- Server tools correctly configured (Tier 0 for list, Tier 2 for get) ✓

**Notes**:
- Deliverable checkboxes in task spec are unchecked but all files exist and are valid
- This is a template/generation artifact, not an implementation issue

# Work Package Prompt: WP09 – Generate Prompts - project-foundation (16 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 16 tools in the project-foundation domain. This domain includes `project/create` which is critical for establishing context for higher-tier tools.

## Domain Overview

| Domain | project-foundation |
|--------|-------------------|
| Tool Count | 16 |
| Primary Tier | 3-4 |
| Prefixes | `project/`, `server/` |
| Risk Level | High (project creation/deletion) |

## Tool List

### project/ tools (14)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `project/create` | 3 | server ID | No |
| `project/list` | 0 | None | No |
| `project/get` | 4 | project ID | No |
| `project/delete` | 4 | project ID | **Yes - HIGH RISK** |
| `project/update` | 4 | project ID | No |
| `project/filesystem-usage` | 4 | project ID | No |
| `project/ssh` | 4 | project ID | No (interactive) |
| `project/invite-get` | 4 | invite ID | No |
| `project/invite-list` | 4 | project ID | No |
| `project/invite-list-own` | 0 | None | No |
| `project/membership-get` | 4 | membership ID | No |
| `project/membership-get-own` | 4 | project ID | No |
| `project/membership-list` | 4 | project ID | No |
| `project/membership-list-own` | 0 | None | No |

### server/ tools (2)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `server/list` | 0 | None | No |
| `server/get` | 2 | server ID | No |

## Critical Tool: project/create

This tool is the gateway for all Tier 4 operations. Its eval prompt must:
1. First use `server/list` to get available servers
2. Create project with unique name
3. Verify project appears in `project/list`
4. Record project ID for cleanup

**Parameters**:
- `serverId`: Server to host project
- `description`: Project description

**Success Indicators**:
- Returns project ID
- Project appears in list
- No quota errors

## Tool-Specific Details

### server/list (Tier 0)
- Lists all accessible servers
- No parameters required
- Foundation for project creation

### server/get (Tier 2)
- Gets server details
- Requires `serverId`
- Validates server access

### project/list (Tier 0)
- Lists all accessible projects
- No parameters required

### project/create (Tier 3)
- Creates new project
- Requires `serverId`, `description`
- **Creates billable resource**

### project/get (Tier 4)
- Gets project details
- Requires `projectId`

### project/delete (Tier 4)
- **HIGH RISK**: Deletes project and all contents
- Requires `projectId`, `confirm: true`

### project/update (Tier 4)
- Updates project description
- Requires `projectId`, `description`

### project/filesystem-usage (Tier 4)
- Shows disk usage
- Requires `projectId`

### project/ssh (Tier 4)
- SSH connection info
- Requires `projectId`
- Interactive command

### project/invite-* and project/membership-*
- Project access management
- Various tiers based on context needs

## Deliverables

- [ ] `evals/prompts/project-foundation/project-create.json`
- [ ] `evals/prompts/project-foundation/project-list.json`
- [ ] `evals/prompts/project-foundation/project-get.json`
- [ ] `evals/prompts/project-foundation/project-delete.json`
- [ ] `evals/prompts/project-foundation/project-update.json`
- [ ] `evals/prompts/project-foundation/project-filesystem-usage.json`
- [ ] `evals/prompts/project-foundation/project-ssh.json`
- [ ] `evals/prompts/project-foundation/project-invite-get.json`
- [ ] `evals/prompts/project-foundation/project-invite-list.json`
- [ ] `evals/prompts/project-foundation/project-invite-list-own.json`
- [ ] `evals/prompts/project-foundation/project-membership-get.json`
- [ ] `evals/prompts/project-foundation/project-membership-get-own.json`
- [ ] `evals/prompts/project-foundation/project-membership-list.json`
- [ ] `evals/prompts/project-foundation/project-membership-list-own.json`
- [ ] `evals/prompts/project-foundation/server-list.json`
- [ ] `evals/prompts/project-foundation/server-get.json`

**Total**: 16 JSON files

## Acceptance Criteria

1. All 16 prompt files created
2. `project/create` has comprehensive setup/verification steps
3. `project/delete` has explicit safety warnings
4. Server tools included correctly

## Execution Order During Phase 4

1. `server/list` - Find available servers
2. `project/list` - Check existing projects
3. `project/create` - Create test project (CRITICAL)
4. Remaining tools - Use created project
5. `project/delete` - Cleanup (LAST)

## Parallelization Notes

- Prompt generation runs parallel with other Phase 3 WPs
- During execution (Phase 4), this domain must complete early to provide project context for other domains

