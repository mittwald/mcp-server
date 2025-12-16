---
work_package_id: "WP17"
subtasks:
  - "T001"
title: "Generate Prompts - misc (13 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "done"
assignee: "claude"
agent: "claude-reviewer"
shell_pid: "34704"
review_status: "approved without changes"
reviewed_by: "claude-reviewer"
history:
  - timestamp: "2025-12-16T13:17:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:35:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "25431"
    action: "Started implementation - 8 prompts exist, generating 3 missing login prompts"
  - timestamp: "2025-12-16T17:40:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "25431"
    action: "Completed - all 11 misc prompts verified (context/ tools don't exist in inventory)"
  - timestamp: "2025-12-16T19:25:00Z"
    lane: "done"
    agent: "claude-reviewer"
    shell_pid: "34704"
    action: "Review approved - all 11 prompts validated, acceptance criteria met"
---

## Review Feedback

**Status**: ✅ **Approved**

**Review Summary**:
- All 11 misc domain prompts exist and pass schema validation
- Conversation tools properly documented as "support conversation" tools
- Login-token has "sensitive" tag and appropriate security warnings
- Correct handling of inventory discrepancy (context/ tools don't exist)

**Verified**:
- [x] 11 JSON files in `evals/prompts/misc/`
- [x] All 11 files pass schema validation
- [x] Conversation tools mention "support" use case
- [x] Login-token has `sensitive` tag and warning text
- [x] No extra metadata properties (schema compliant)

---

# Work Package Prompt: WP17 – Generate Prompts - misc (13 tools)

## Objective

Generate Langfuse-compatible eval prompts for miscellaneous tools that don't fit into the main domains: conversations, login, and ddev.

## Domain Overview

| Domain | misc |
|--------|------|
| Tool Count | 13 |
| Primary Tier | Mixed (0-4) |
| Prefixes | `conversation/`, `login/`, `ddev/`, `context/` |
| Risk Level | Low-Medium |

## Tool List

### conversation/ tools (6)

| Tool | Tier | Destructive |
|------|------|-------------|
| `conversation/list` | 0 | No |
| `conversation/show` | 0 | No |
| `conversation/create` | 0 | No |
| `conversation/reply` | 0 | No |
| `conversation/close` | 0 | No |
| `conversation/categories` | 0 | No |

### login/ tools (3)

| Tool | Tier | Destructive |
|------|------|-------------|
| `login/status` | 0 | No |
| `login/token` | 0 | No (but sensitive) |
| `login/reset` | 0 | No |

### ddev/ tools (2)

| Tool | Tier | Destructive |
|------|------|-------------|
| `ddev/init` | 4 | No |
| `ddev/render-config` | 4 | No |

### context/ session tools (2)

| Tool | Tier | Destructive |
|------|------|-------------|
| `context/set-session` | 0 | No |
| `context/reset-session` | 0 | No |

## Key Tool Details

### conversation/create
- Creates support conversation
- Parameters: `title`, `message`, `category`
- For communicating with Mittwald support

### login/status
- Checks authentication status
- No parameters required
- Good for connectivity validation

### ddev/init
- Initializes DDEV local development
- Requires project context
- For local development setup

## Deliverables

- [x] `evals/prompts/misc/conversation-list.json`
- [x] `evals/prompts/misc/conversation-show.json`
- [x] `evals/prompts/misc/conversation-create.json`
- [x] `evals/prompts/misc/conversation-reply.json`
- [x] `evals/prompts/misc/conversation-close.json`
- [x] `evals/prompts/misc/conversation-categories.json`
- [x] `evals/prompts/misc/login-status.json`
- [x] `evals/prompts/misc/login-token.json`
- [x] `evals/prompts/misc/login-reset.json`
- [x] `evals/prompts/misc/ddev-init.json`
- [x] `evals/prompts/misc/ddev-render-config.json`
- N/A `evals/prompts/misc/context-set-session.json` *(tool doesn't exist in inventory)*
- N/A `evals/prompts/misc/context-reset-session.json` *(tool doesn't exist in inventory)*

**Total**: 11 JSON files ✓ (actual inventory count - context/ tools don't exist)

## Acceptance Criteria

1. ✅ All 11 prompt files created (matching actual inventory)
2. ✅ Conversation tools documented for support use ("support conversation" in prompts)
3. ✅ Login tools noted as sensitive (login-token has "sensitive" tag)

## Notes

- conversation/ tools interact with Mittwald support - use sparingly
- login/token returns sensitive data - handle carefully
- ddev/ tools are for local development context

