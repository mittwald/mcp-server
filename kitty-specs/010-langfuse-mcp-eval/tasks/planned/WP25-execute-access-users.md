---
work_package_id: "WP25"
subtasks:
  - "T001"
title: "Execute Evals - access-users (8 evals)"
phase: "Phase 4 - Eval Execution"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:25:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP25 – Execute Evals - access-users (8 evals)

## Objective

Execute all 8 access-users domain evals covering SFTP and SSH user management.

## Prerequisites

- **WP-14** completed (prompts generated)
- **WP-20** completed (project exists)

## Execution Order

### Phase A: SFTP Users
1. `sftp/user-list`
2. `sftp/user-create` - Create SFTP user (track ID)
3. `sftp/user-update`
4. `sftp/user-delete` - Cleanup

### Phase B: SSH Users
5. `ssh/user-list`
6. `ssh/user-create` - Create SSH user (track ID)
7. `ssh/user-update`
8. `ssh/user-delete` - Cleanup

## Security Notes

- Created users have project file access
- Use strong generated passwords
- Delete users immediately after verification
- Do not leave users active

## Resource Tracking

```json
{
  "domain": "access-users",
  "resources_created": [
    {"type": "sftp-user", "id": "..."},
    {"type": "ssh-user", "id": "..."}
  ]
}
```

## Session Log Storage

```
evals/results/sessions/access-users/
├── sftp-user-list.jsonl
├── sftp-user-create.jsonl
└── ... (8 files)
```

## Deliverables

- [ ] 8 session logs
- [ ] Users created and deleted
- [ ] No orphaned users remain

## Parallelization Notes

- Runs in parallel with other Tier 4 domain WPs
- Small domain - completes quickly

