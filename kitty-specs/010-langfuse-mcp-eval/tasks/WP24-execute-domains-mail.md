---
work_package_id: WP24
title: Execute Evals - domains-mail (20 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:24:00Z'
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

# Work Package Prompt: WP24 – Execute Evals - domains-mail (20 evals)

## Objective

Execute all 20 domains-mail domain evals covering DNS, virtualhosts, mail, and certificates.

## Prerequisites

- **WP-13** completed (prompts generated)
- **WP-20** completed (project exists)
- Domain configured in project (may limit some tests)

## Execution Order

### Phase A: Domain Operations
1. `domain/list`
2. `domain/get`
3. `domain/dnszone/list`
4. `domain/dnszone/get`
5. `domain/dnszone/update` - **Caution: affects DNS**

### Phase B: Virtualhost Operations
6. `domain/virtualhost-list`
7. `domain/virtualhost-create` - Create test virtualhost
8. `domain/virtualhost-get`
9. `domain/virtualhost-delete` - Cleanup

### Phase C: Mail Address Operations
10. `mail/address/list`
11. `mail/address/create` - Create test address
12. `mail/address/get`
13. `mail/address/update`
14. `mail/address/delete` - Cleanup

### Phase D: Deliverybox Operations
15. `mail/deliverybox/list`
16. `mail/deliverybox/create` - Create deliverybox
17. `mail/deliverybox/get`
18. `mail/deliverybox/update`
19. `mail/deliverybox/delete` - Cleanup

### Phase E: Certificate Operations
20. `certificate/list`
21. `certificate/request` - **Requires valid domain**

## Limitations

- Some operations require a real domain
- DNS changes may take time to propagate
- Certificate requests require DNS validation
- Self-assess with notes if operations not possible

## Session Log Storage

```
evals/results/sessions/domains-mail/
├── domain-list.jsonl
├── domain-virtualhost-create.jsonl
└── ... (20 files)
```

## Deliverables

- [ ] 20 session logs
- [ ] Created resources cleaned up
- [ ] DNS-dependent operations noted

## Parallelization Notes

- Runs in parallel with other Tier 4 domain WPs

