---
work_package_id: "WP08"
subtasks:
  - "T001"
title: "Generate Prompts - organization (14 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "1767"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:08:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T18:20:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "1767"
    action: "Started implementation"
---

# Work Package Prompt: WP08 – Generate Prompts - organization (14 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 14 tools in the organization domain.

## Domain Overview

| Domain | organization |
|--------|--------------|
| Tool Count | 14 |
| Primary Tier | 1 (org-level) |
| Prefixes | `org/`, `extension/` |
| Risk Level | Medium (includes destructive ops) |

## Tool List

### org/ tools (10)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `org/list` | 0 | None | No |
| `org/get` | 1 | org ID | No |
| `org/delete` | 1 | org ID | **Yes - HIGH RISK** |
| `org/invite` | 1 | org ID | No |
| `org/invite-list` | 1 | org ID | No |
| `org/invite-list-own` | 0 | None | No |
| `org/invite-revoke` | 1 | invite ID | **Yes** |
| `org/membership-list` | 1 | org ID | No |
| `org/membership-list-own` | 0 | None | No |
| `org/membership-revoke` | 1 | membership ID | **Yes** |

### extension/ tools (4)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `extension/list` | 0 | None | No |
| `extension/install` | 1 | ext ID, project ID | No |
| `extension/list-installed` | 1 | project ID | No |
| `extension/uninstall` | 1 | instance ID | **Yes** |

## Tool-Specific Details

### org/list
- **Tier**: 0
- **Description**: List all organizations accessible to user
- **Success Indicators**: Returns org array, includes org IDs
- **Parameters**: None required

### org/get
- **Tier**: 1
- **Description**: Get organization details
- **Success Indicators**: Returns org details, ID matches
- **Parameters**: `organizationId`

### org/delete
- **Tier**: 1
- **Description**: Delete an organization
- **Success Indicators**: Org removed, confirmation received
- **Parameters**: `organizationId`, `confirm: true`
- **WARNING**: HIGH RISK - Never run on production org

### org/invite
- **Tier**: 1
- **Description**: Invite user to organization
- **Success Indicators**: Invite created, invite ID returned
- **Parameters**: `organizationId`, `email`, `role` (owner/member/accountant)

### org/invite-list
- **Tier**: 1
- **Description**: List organization invites
- **Success Indicators**: Returns invite array
- **Parameters**: `orgId`

### org/invite-list-own
- **Tier**: 0
- **Description**: List invites for current user
- **Success Indicators**: Returns user's pending invites
- **Parameters**: None

### org/invite-revoke
- **Tier**: 1
- **Description**: Revoke an invite
- **Success Indicators**: Invite removed
- **Parameters**: `inviteId`, `confirm: true`

### org/membership-list
- **Tier**: 1
- **Description**: List organization members
- **Success Indicators**: Returns member array
- **Parameters**: `organizationId`

### org/membership-list-own
- **Tier**: 0
- **Description**: List user's org memberships
- **Success Indicators**: Returns memberships
- **Parameters**: None

### org/membership-revoke
- **Tier**: 1
- **Description**: Revoke a membership
- **Success Indicators**: Membership removed
- **Parameters**: `membershipId`, `confirm: true`
- **WARNING**: Could lock out users

### extension/list
- **Tier**: 0
- **Description**: List available extensions
- **Success Indicators**: Returns extension catalog
- **Parameters**: None

### extension/install
- **Tier**: 1
- **Description**: Install extension in project
- **Success Indicators**: Extension installed, instance ID returned
- **Parameters**: `extensionId`, `projectId`

### extension/list-installed
- **Tier**: 1
- **Description**: List installed extensions
- **Success Indicators**: Returns installed extensions
- **Parameters**: `projectId`

### extension/uninstall
- **Tier**: 1
- **Description**: Uninstall an extension
- **Success Indicators**: Extension removed
- **Parameters**: `extensionInstanceId`

## Deliverables

- [ ] `evals/prompts/organization/org-list.json`
- [ ] `evals/prompts/organization/org-get.json`
- [ ] `evals/prompts/organization/org-delete.json`
- [ ] `evals/prompts/organization/org-invite.json`
- [ ] `evals/prompts/organization/org-invite-list.json`
- [ ] `evals/prompts/organization/org-invite-list-own.json`
- [ ] `evals/prompts/organization/org-invite-revoke.json`
- [ ] `evals/prompts/organization/org-membership-list.json`
- [ ] `evals/prompts/organization/org-membership-list-own.json`
- [ ] `evals/prompts/organization/org-membership-revoke.json`
- [ ] `evals/prompts/organization/extension-list.json`
- [ ] `evals/prompts/organization/extension-install.json`
- [ ] `evals/prompts/organization/extension-list-installed.json`
- [ ] `evals/prompts/organization/extension-uninstall.json`

**Total**: 14 JSON files

## Acceptance Criteria

1. All 14 prompt files created
2. Each validates against Langfuse schema
3. Destructive tools clearly marked with warnings
4. `org/delete` has explicit safety warnings

## Parallelization Notes

- Runs in parallel with all Phase 3 WPs
- Dependencies: WP-04 (Tool Inventory)

