---
work_package_id: "WP18"
subtasks:
  - "T001"
title: "Execute Evals - identity (17 evals)"
phase: "Phase 4 - Eval Execution"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "36563"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:18:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:20:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "36563"
    action: "Started implementation - executing identity domain evals"
---

# Work Package Prompt: WP18 – Execute Evals - identity (17 evals)

## Objective

Execute all 17 identity domain evals via spec-kitty agents and capture self-assessments. This domain executes first as it's primarily Tier 0 (no dependencies) and validates basic authentication and connectivity.

## Prerequisites

- **WP-07** completed (prompts generated)
- **WP-01** completed (extractor ready)
- Authenticated Mittwald session

## Execution Strategy

### Order
1. `login/status` - Validate authentication
2. `context/get` - Check current context
3. `user/get` - Get user profile
4. List operations (session, ssh-key, api-token)
5. Create operations (ssh-key, api-token)
6. Get operations for created resources
7. Update operations (if applicable)
8. Delete operations (cleanup)

### Agent Instructions

For each eval:
1. Load the eval prompt from `evals/prompts/identity/{tool}.json`
2. Execute as a Claude Code session
3. Capture the full session log
4. Ensure the agent outputs the self-assessment with markers

## Eval List

Execute in this order:

| # | Tool | Tier | Expected Outcome |
|---|------|------|------------------|
| 1 | `login/status` | 0 | Auth validated |
| 2 | `context/get` | 0 | Context retrieved |
| 3 | `user/get` | 0 | Profile returned |
| 4 | `user/session/list` | 0 | Sessions listed |
| 5 | `user/ssh-key/list` | 0 | Keys listed |
| 6 | `user/api-token/list` | 0 | Tokens listed |
| 7 | `context/accessible-projects` | 0 | Projects listed |
| 8 | `context/get-session` | 0 | Session context |
| 9 | `user/ssh-key/create` | 0 | Key created (track ID) |
| 10 | `user/api-token/create` | 0 | Token created (track ID) |
| 11 | `user/ssh-key/get` | 0 | Key details |
| 12 | `user/api-token/get` | 0 | Token details |
| 13 | `user/session/get` | 0 | Session details |
| 14 | `context/set` | 0 | Context updated |
| 15 | `context/reset` | 0 | Context cleared |
| 16 | `user/ssh-key/delete` | 0 | Key deleted |
| 17 | `user/api-token/revoke` | 0 | Token revoked |

## Resource Tracking

Track created resources for cleanup:

```json
{
  "domain": "identity",
  "resources_created": [
    {"type": "ssh-key", "id": "...", "tool": "user/ssh-key/create"},
    {"type": "api-token", "id": "...", "tool": "user/api-token/create"}
  ],
  "cleanup_required": ["user/ssh-key/delete", "user/api-token/revoke"]
}
```

## Session Log Storage

Store session logs in:
```
evals/results/sessions/identity/
├── login-status.jsonl
├── context-get.jsonl
├── user-get.jsonl
└── ... (17 files)
```

## Deliverables

- [ ] 17 session logs in `evals/results/sessions/identity/`
- [ ] All self-assessments extractable
- [ ] No authentication failures
- [ ] Created resources cleaned up
- [ ] Domain execution manifest updated

## Acceptance Criteria

1. All 17 evals executed
2. Each session log contains self-assessment markers
3. Created resources (keys, tokens) successfully cleaned up
4. No orphaned resources remain
5. Domain marked complete in manifest

## Success Metrics Target

For Tier 0 identity tools, expect:
- **Success Rate**: >90% (minimal dependencies)
- **Common Issues**: None expected (baseline validation)
- **Execution Time**: ~2-3 minutes per eval

## Error Handling

If eval fails:
1. Log the error in session
2. Self-assess as `success: false`
3. Document problem type
4. Continue to next eval
5. Do not skip cleanup tools

## Parallelization Notes

- **This domain runs first** - validates authentication
- **Sequential execution** within domain
- **After completion**: WP-19 (organization) can start
- **Enables**: All other domains depend on validated auth

