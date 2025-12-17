---
work_package_id: WP07
title: Generate Prompts - identity (17 tools)
lane: done
history:
- timestamp: '2025-12-16T13:07:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T16:43:00Z'
  lane: for_review
  agent: claude
  shell_pid: '78380'
  action: Generated 19 identity domain prompts (includes login/* tools)
- timestamp: '2025-12-16T19:00:00Z'
  lane: done
  agent: claude-reviewer
  shell_pid: '20211'
  action: Review approved - all 19 prompts validated, destructive tools properly marked
agent: claude-reviewer
assignee: claude
phase: Phase 3 - Eval Prompt Generation
review_status: approved without changes
reviewed_by: claude-reviewer
shell_pid: '20211'
subtasks:
- T001
---

## Review Feedback

**Status**: ✅ **Approved**

**Review Summary**:
- All 19 identity domain prompts generated and validated
- Implementation exceeded spec (19 vs 17) by correctly including `login/*` tools per tool inventory
- All prompts pass schema validation
- Destructive tools (`user/ssh-key/delete`, `user/api-token/revoke`) have proper warnings and tags

**What Was Done Well**:
- Correct handling of tool inventory (19 tools, not 17 as originally specified)
- All prompts include self-assessment instructions with proper markers
- Destructive operations clearly marked with warning banners
- Each tool has specific success indicators

**Verified**:
- [x] 19 JSON files in `evals/prompts/identity/`
- [x] All 19 files pass validation
- [x] Destructive tools tagged and warned
- [x] Self-assessment markers present

---

# Work Package Prompt: WP07 – Generate Prompts - identity (17 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 17 tools in the identity domain. This domain contains mostly Tier 0 tools (no dependencies), making it ideal for initial validation.

## Domain Overview

| Domain | identity |
|--------|----------|
| Tool Count | 17 |
| Primary Tier | 0 (most tools) |
| Prefixes | `user/`, `context/` |
| Risk Level | Low (read-heavy, no destructive ops) |

## Tool List

### user/ tools (12)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `user/get` | 0 | None | No |
| `user/session/list` | 0 | None | No |
| `user/session/get` | 0 | session ID | No |
| `user/ssh-key/list` | 0 | None | No |
| `user/ssh-key/get` | 0 | key ID | No |
| `user/ssh-key/create` | 0 | None | No |
| `user/ssh-key/delete` | 0 | key ID | **Yes** |
| `user/ssh-key/import` | 0 | None | No |
| `user/api-token/list` | 0 | None | No |
| `user/api-token/get` | 0 | token ID | No |
| `user/api-token/create` | 0 | None | No |
| `user/api-token/revoke` | 0 | token ID | **Yes** |

### context/ tools (5)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `context/get` | 0 | None | No |
| `context/set` | 0 | None | No |
| `context/reset` | 0 | None | No |
| `context/accessible-projects` | 0 | None | No |
| `context/get-session` | 0 | None | No |

## Prompt Generation Instructions

For each tool, generate a JSON file following this structure:

```json
{
  "input": {
    "prompt": "[Full eval prompt text - see template]",
    "tool_name": "mcp__mittwald__mittwald_user_get",
    "display_name": "user/get",
    "context": {
      "dependencies": [],
      "setup_instructions": "No setup required - Tier 0 tool",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "identity",
    "tier": 0,
    "tool_description": "Get profile information for a user",
    "success_indicators": [
      "Returns user profile data",
      "Response includes user ID",
      "No authentication errors"
    ],
    "self_assessment_required": true,
    "eval_version": "1.0.0",
    "created_at": "2025-12-16T00:00:00Z",
    "tags": ["identity", "tier-0", "read-only"]
  }
}
```

## Deliverables

- [x] `evals/prompts/identity/user-get.json`
- [x] `evals/prompts/identity/user-session-list.json`
- [x] `evals/prompts/identity/user-session-get.json`
- [x] `evals/prompts/identity/user-ssh-key-list.json`
- [x] `evals/prompts/identity/user-ssh-key-get.json`
- [x] `evals/prompts/identity/user-ssh-key-create.json`
- [x] `evals/prompts/identity/user-ssh-key-delete.json`
- [x] `evals/prompts/identity/user-ssh-key-import.json`
- [x] `evals/prompts/identity/user-api-token-list.json`
- [x] `evals/prompts/identity/user-api-token-get.json`
- [x] `evals/prompts/identity/user-api-token-create.json`
- [x] `evals/prompts/identity/user-api-token-revoke.json`
- [x] `evals/prompts/identity/context-get.json`
- [x] `evals/prompts/identity/context-set.json`
- [x] `evals/prompts/identity/context-reset.json`
- [x] `evals/prompts/identity/context-accessible-projects.json`
- [x] `evals/prompts/identity/context-get-session.json`
- [x] `evals/prompts/identity/login-status.json` (bonus)
- [x] `evals/prompts/identity/login-token.json` (bonus)
- [x] `evals/prompts/identity/login-reset.json` (bonus - destructive)

**Total**: 19 JSON files (exceeds original 17 by including login/* tools)

## Acceptance Criteria

1. ✅ All 17+ prompt files created (19 delivered)
2. ✅ Each file validates against Langfuse schema
3. ✅ All files include self-assessment instructions
4. ✅ Destructive tools clearly marked
5. ✅ Success indicators specific to each tool

## Parallelization Notes

This WP can run **fully in parallel** with all other Phase 3 WPs (WP-08 through WP-17).

All Phase 3 WPs depend only on:
- **WP-04** (Tool Inventory)
- **WP-02** (Eval Prompt Generator) - if using automated generation

## Execution Priority

Execute this domain **first** during Phase 4 because:
1. Mostly Tier 0 tools (no dependencies)
2. Low risk (read-heavy)
3. Validates authentication and basic connectivity
4. Provides baseline for other domains

