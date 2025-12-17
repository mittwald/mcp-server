---
work_package_id: WP27
title: Execute Evals - backups (9 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:27:00Z'
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

# Work Package Prompt: WP27 – Execute Evals - backups (9 evals)

## Objective

Execute all 9 backups domain evals covering backup creation, management, and scheduling.

## Prerequisites

- **WP-16** completed (prompts generated)
- **WP-20** completed (project exists)

## Execution Order

1. `backup/list`
2. `backup/schedule-list`
3. `backup/create` - Create backup (track ID, ~2-5 min)
4. `backup/get`
5. `backup/schedule-create` - Create schedule (track ID)
6. `backup/schedule-update`
7. `backup/download` - Download backup (large file)
8. `backup/schedule-delete` - Cleanup
9. `backup/delete` - Cleanup

## Time Considerations

- `backup/create` may take 2-5 minutes
- `backup/download` depends on backup size
- Use appropriate timeouts

## Resource Tracking

```json
{
  "domain": "backups",
  "resources_created": [
    {"type": "backup", "id": "..."},
    {"type": "backup-schedule", "id": "..."}
  ]
}
```

## Session Log Storage

```
evals/results/sessions/backups/
├── backup-list.jsonl
├── backup-create.jsonl
└── ... (9 files)
```

## Deliverables

- [ ] 9 session logs
- [ ] Backup created and verified
- [ ] Schedule created and deleted
- [ ] All backups cleaned up

## Parallelization Notes

- Runs in parallel with most Tier 4 domain WPs
- Long-running operations may extend total time

