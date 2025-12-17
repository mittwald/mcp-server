---
work_package_id: WP23
title: Execute Evals - databases (21 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:23:00Z'
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

# Work Package Prompt: WP23 – Execute Evals - databases (21 evals)

## Objective

Execute all 21 databases domain evals covering MySQL and Redis operations.

## Prerequisites

- **WP-12** completed (prompts generated)
- **WP-20** completed (project exists)

## Execution Order

### Phase A: Info Operations (Tier 0)
1. `database/mysql/versions`
2. `database/mysql/charsets`
3. `database/redis/versions`

### Phase B: List Operations
4. `database/list`
5. `database/mysql/list`
6. `database/redis/list`

### Phase C: Create Databases
7. `database/mysql/create` - Create MySQL DB (track ID)
8. `database/redis/create` - Create Redis DB (track ID)

### Phase D: MySQL Operations
9. `database/mysql/get`
10. `database/mysql/user-create` - Create DB user
11. `database/mysql/user-list`
12. `database/mysql/user-get`
13. `database/mysql/user-update`
14. `database/mysql/dump`
15. `database/mysql/import`
16. `database/mysql/shell` - Connection info
17. `database/mysql/port-forward` - Port forward info
18. `database/mysql/phpmyadmin` - phpMyAdmin link

### Phase E: Redis Operations
19. `database/redis/get`

### Phase F: Cleanup (LAST)
20. `database/mysql/user-delete`
21. `database/mysql/delete` - **DELETES ALL DATA**

## Safety Notes

- `database/mysql/delete` permanently deletes all data
- Only delete test databases created in this WP
- Never delete existing production databases

## Resource Tracking

```json
{
  "domain": "databases",
  "resources_created": [
    {"type": "mysql-database", "id": "mysql-xxx"},
    {"type": "mysql-user", "id": "mysql-user-xxx"},
    {"type": "redis-database", "id": "redis-xxx"}
  ]
}
```

## Session Log Storage

```
evals/results/sessions/databases/
├── database-mysql-versions.jsonl
├── database-mysql-create.jsonl
└── ... (21 files)
```

## Deliverables

- [ ] 21 session logs
- [ ] MySQL and Redis databases created
- [ ] User management tested
- [ ] Test databases cleaned up

## Parallelization Notes

- Runs in parallel with other Tier 4 domain WPs
- MySQL operations are sequential within domain

