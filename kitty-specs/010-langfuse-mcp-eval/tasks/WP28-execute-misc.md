---
work_package_id: WP28
title: Execute Evals - misc (13 evals)
lane: planned
history:
- timestamp: '2025-12-16T13:28:00Z'
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

# Work Package Prompt: WP28 – Execute Evals - misc (13 evals)

## Objective

Execute all 13 misc domain evals covering conversations, login, and ddev.

## Prerequisites

- **WP-17** completed (prompts generated)
- **WP-18** completed (auth validated)
- For ddev tools: WP-20 (project exists)

## Execution Order

### Phase A: Login/Auth (Tier 0)
1. `login/status`
2. `login/token` - **Sensitive output**
3. `login/reset` - Reset CLI context

### Phase B: Session Context (Tier 0)
4. `context/set-session`
5. `context/reset-session`

### Phase C: Conversations (Tier 0)
6. `conversation/categories` - List categories
7. `conversation/list` - Existing conversations
8. `conversation/create` - **Creates support ticket**
9. `conversation/show` - View conversation
10. `conversation/reply` - Reply to conversation
11. `conversation/close` - Close conversation

### Phase D: DDEV (Tier 4)
12. `ddev/init` - Initialize DDEV
13. `ddev/render-config` - Render config

## Special Considerations

### Conversation Tools
- `conversation/create` creates an actual support ticket
- Use sparingly or skip with note
- If created, close with `conversation/close`

### Login Tools
- `login/token` outputs sensitive data
- Do not log token values in self-assessment
- Summarize as "token retrieved successfully"

### DDEV Tools
- For local development integration
- May not work in all environments

## Session Log Storage

```
evals/results/sessions/misc/
├── login-status.jsonl
├── conversation-list.jsonl
└── ... (13 files)
```

## Deliverables

- [ ] 13 session logs
- [ ] Conversations closed if created
- [ ] Sensitive data not logged

## Parallelization Notes

- Most tools are Tier 0 - can run early
- DDEV tools need project context
- Conversation tools should be used sparingly

