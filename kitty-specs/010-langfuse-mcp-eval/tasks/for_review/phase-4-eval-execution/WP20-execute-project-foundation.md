---
work_package_id: "WP20"
subtasks:
  - "T001"
title: "Execute Evals - project-foundation (16 evals)"
phase: "Phase 4 - Eval Execution"
lane: "for_review"
assignee: "claude"
agent: "claude"
shell_pid: "43699"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:20:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:50:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "43699"
    action: "Started execution of 16 project-foundation domain evals"
  - timestamp: "2025-12-16T17:55:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "43699"
    action: "Completed execution - 16 session logs created, 0 successful, 16 failed (4 timeout, 12 cascade). CRITICAL: No eval project created - blocks WP21-WP28."
---

# Work Package Prompt: WP20 – Execute Evals - project-foundation (16 evals)

## Objective

Execute all 16 project-foundation domain evals. **CRITICAL**: This domain creates the project that all subsequent domains depend on.

## Prerequisites

- **WP-09** completed (prompts generated)
- **WP-18** completed (auth validated)
- Server access confirmed

## Execution Order (CRITICAL)

| # | Tool | Tier | Notes |
|---|------|------|-------|
| 1 | `server/list` | 0 | Find available servers |
| 2 | `project/list` | 0 | Check existing projects |
| 3 | `project/membership-list-own` | 0 | User's projects |
| 4 | `project/invite-list-own` | 0 | Pending invites |
| 5 | `server/get` | 2 | Server details |
| 6 | **`project/create`** | 3 | **CREATE EVAL PROJECT** |
| 7 | `project/get` | 4 | Verify project |
| 8 | `project/update` | 4 | Update description |
| 9 | `project/filesystem-usage` | 4 | Check disk usage |
| 10 | `project/membership-list` | 4 | Project members |
| 11 | `project/membership-get-own` | 4 | Own membership |
| 12 | `project/invite-list` | 4 | Project invites |
| 13 | `project/invite-get` | 4 | (if invite exists) |
| 14 | `project/membership-get` | 4 | Membership details |
| 15 | `project/ssh` | 4 | SSH info (interactive) |
| 16 | `project/delete` | 4 | **DEFER TO END OF ALL EVALS** |

## Project Creation (CRITICAL)

The `project/create` eval **MUST**:
1. Use a unique name: `eval-2025-12-16-{uuid}`
2. Record the project ID
3. Share the project ID with all subsequent WPs
4. **NOT** be cleaned up until ALL other domains complete

## Project ID Propagation

After project creation, write to shared state:

```json
// evals/state/current-project.json
{
  "project_id": "p-xxxxxx",
  "created_at": "2025-12-16T00:00:00Z",
  "created_by": "WP-20",
  "cleanup_deferred": true
}
```

All subsequent WPs (WP-21 through WP-28) read this file.

## Session Log Storage

```
evals/results/sessions/project-foundation/
├── server-list.jsonl
├── project-list.jsonl
├── project-create.jsonl  # CRITICAL
└── ... (16 files)
```

## Deliverables

- [ ] 16 session logs
- [ ] Project created successfully
- [ ] Project ID written to state file
- [ ] Project NOT deleted (deferred)

## Acceptance Criteria

1. All 16 evals executed
2. Eval project created and ID recorded
3. Project persists for other domains
4. `project/delete` deferred to final cleanup

## Parallelization Notes

- **CRITICAL PATH**: Must complete before WP-21 through WP-28
- Can run in parallel with WP-19 (org doesn't need project)
- After completion: WP-21-28 can run in parallel

