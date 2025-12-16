---
work_package_id: "WP17"
subtasks:
  - "T001"
title: "Generate Prompts - misc (13 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:17:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
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

- [ ] `evals/prompts/misc/conversation-list.json`
- [ ] `evals/prompts/misc/conversation-show.json`
- [ ] `evals/prompts/misc/conversation-create.json`
- [ ] `evals/prompts/misc/conversation-reply.json`
- [ ] `evals/prompts/misc/conversation-close.json`
- [ ] `evals/prompts/misc/conversation-categories.json`
- [ ] `evals/prompts/misc/login-status.json`
- [ ] `evals/prompts/misc/login-token.json`
- [ ] `evals/prompts/misc/login-reset.json`
- [ ] `evals/prompts/misc/ddev-init.json`
- [ ] `evals/prompts/misc/ddev-render-config.json`
- [ ] `evals/prompts/misc/context-set-session.json`
- [ ] `evals/prompts/misc/context-reset-session.json`

**Total**: 13 JSON files

## Acceptance Criteria

1. All 13 prompt files created
2. Conversation tools documented for support use
3. Login tools noted as sensitive

## Notes

- conversation/ tools interact with Mittwald support - use sparingly
- login/token returns sensitive data - handle carefully
- ddev/ tools are for local development context

