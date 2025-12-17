---
work_package_id: WP26
title: Execute Evals - automation (10 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:26:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 4 - Eval Execution
review_status: ''
reviewed_by: ''
shell_pid: ''
subtasks:
- T001
---

# Work Package Prompt: WP26 – Execute Evals - automation (10 evals)

## Objective

Execute all 10 automation domain evals covering cronjob management and execution.

## Prerequisites

- **WP-15** completed (prompts generated)
- **WP-20** completed (project exists)
- **WP-21** started (app exists for cronjob attachment)

## Execution Order

1. `cronjob/list`
2. `cronjob/create` - Create test cronjob (track ID)
3. `cronjob/get`
4. `cronjob/update`
5. `cronjob/execute` - Trigger execution
6. `cronjob/execution-list`
7. `cronjob/execution-get`
8. `cronjob/execution-logs`
9. `cronjob/execution-abort` - If running
10. `cronjob/delete` - Cleanup

## Special Dependency

`cronjob/create` requires an `installationId` (app installation).
Either:
- Wait for WP-21 to create an app
- Use an existing app from the project

## Session Log Storage

```
evals/results/sessions/automation/
├── cronjob-list.jsonl
├── cronjob-create.jsonl
└── ... (10 files)
```

## Deliverables

- [ ] 10 session logs
- [ ] Cronjob created and executed
- [ ] Cronjob deleted

## Parallelization Notes

- Depends on WP-21 (needs app) - limited parallelism
- Execute after apps domain has created at least one app

