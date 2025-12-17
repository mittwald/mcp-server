---
work_package_id: WP22
title: Execute Evals - containers (19 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:22:00Z'
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

# Work Package Prompt: WP22 – Execute Evals - containers (19 evals)

## Objective

Execute all 19 containers domain evals covering containers, stacks, volumes, and registries.

## Prerequisites

- **WP-11** completed (prompts generated)
- **WP-20** completed (project exists)

## Execution Order

### Phase A: List Operations
1. `container/list`
2. `stack/list`
3. `volume/list`
4. `registry/list`

### Phase B: Create Resources
5. `volume/create` - Create test volume
6. `registry/create` - Create registry credentials
7. `container/run` - Run test container

### Phase C: Container Lifecycle
8. `container/logs`
9. `container/stop`
10. `container/start`
11. `container/restart`
12. `container/recreate`
13. `container/update`

### Phase D: Stack Operations
14. `stack/deploy` - Deploy simple compose
15. `stack/ps` - List services

### Phase E: Registry Operations
16. `registry/update`

### Phase F: Cleanup (LAST)
17. `container/delete`
18. `stack/delete`
19. `volume/delete`
20. `registry/delete`

## Resource Tracking

```json
{
  "domain": "containers",
  "resources_created": [
    {"type": "container", "id": "...", "cleanup": "container/delete"},
    {"type": "volume", "id": "...", "cleanup": "volume/delete"},
    {"type": "registry", "id": "...", "cleanup": "registry/delete"}
  ]
}
```

## Session Log Storage

```
evals/results/sessions/containers/
├── container-list.jsonl
├── container-run.jsonl
└── ... (19 files)
```

## Deliverables

- [ ] 19 session logs
- [ ] Container created and lifecycle tested
- [ ] All resources cleaned up

## Parallelization Notes

- Runs in parallel with WP-21, WP-23-28 after WP-20

