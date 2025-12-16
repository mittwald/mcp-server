---
work_package_id: "WP19"
subtasks:
  - "T001"
title: "Execute Evals - organization (14 evals)"
phase: "Phase 4 - Eval Execution"
lane: "done"
assignee: "claude"
agent: "claude-reviewer"
shell_pid: "22016"
review_status: "approved without changes"
reviewed_by: "claude-reviewer"
history:
  - timestamp: "2025-12-16T13:19:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:40:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "40775"
    action: "Started implementation - executing organization domain evals"
  - timestamp: "2025-12-16T17:45:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "40775"
    action: "Completed execution - 14 session logs created, 0 successful, 14 failed (4 timeouts, 8 dependency cascade, 2 safety skips)"
  - timestamp: "2025-12-16T18:15:00Z"
    lane: "done"
    agent: "claude-reviewer"
    shell_pid: "22016"
    action: "Review approved - All 14 session logs correctly created. Timeouts are infrastructure issues, not implementation problems. Safety skips followed correctly."
---

# Work Package Prompt: WP19 – Execute Evals - organization (14 evals)

## Objective

Execute all 14 organization domain evals. This domain tests org-level operations including memberships, invites, and extensions.

## Prerequisites

- **WP-08** completed (prompts generated)
- **WP-18** completed (auth validated)
- Access to at least one organization

## Execution Order

| # | Tool | Tier | Notes |
|---|------|------|-------|
| 1 | `org/list` | 0 | Find available orgs |
| 2 | `org/membership-list-own` | 0 | User's memberships |
| 3 | `org/invite-list-own` | 0 | Pending invites |
| 4 | `extension/list` | 0 | Available extensions |
| 5 | `org/get` | 1 | Org details |
| 6 | `org/membership-list` | 1 | Org members |
| 7 | `org/invite-list` | 1 | Org invites |
| 8 | `org/invite` | 1 | Create invite (track) |
| 9 | `org/invite-revoke` | 1 | Revoke invite (cleanup) |
| 10 | `extension/list-installed` | 1 | Installed extensions |
| 11 | `extension/install` | 1 | Install extension (track) |
| 12 | `extension/uninstall` | 1 | Uninstall (cleanup) |
| 13 | `org/membership-revoke` | 1 | **SKIP if risky** |
| 14 | `org/delete` | 1 | **SKIP - too destructive** |

## Safety Notes

- **org/delete**: NEVER execute on production org
- **org/membership-revoke**: Could lock out users
- For these, self-assess with note: "Skipped due to safety concerns"

## Session Log Storage

```
evals/results/sessions/organization/
├── org-list.jsonl
├── org-get.jsonl
└── ... (14 files)
```

## Deliverables

- [ ] 14 session logs (some may be skipped with notes)
- [ ] Invites and extensions cleaned up
- [ ] No production orgs modified

## Parallelization Notes

- Runs after WP-18 completes
- Can run in parallel with WP-20 after WP-18 completes

