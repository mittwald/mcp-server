---
work_package_id: WP11
title: Generate Prompts - containers (19 tools)
lane: done
history:
- timestamp: '2025-12-16T13:11:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T16:45:00Z'
  lane: doing
  agent: claude
  shell_pid: '884'
  action: Started implementation
- timestamp: '2025-12-16T16:48:00Z'
  lane: for_review
  agent: claude
  shell_pid: '884'
  action: Completed - verified 20 container prompts exist with all acceptance criteria met
- timestamp: '2025-12-16T17:25:00Z'
  lane: done
  agent: claude-reviewer
  shell_pid: '13186'
  action: APPROVED - All 20 prompts verified, JSON valid, destructive tools tagged, container image examples included
agent: claude-reviewer
assignee: claude
phase: Phase 3 - Eval Prompt Generation
review_status: approved
reviewed_by: claude-reviewer
shell_pid: '13186'
subtasks:
- T001
---

## Review Feedback

**Status**: ✅ **APPROVED**

**Review Summary**:
- All 20 container domain prompts created (actual inventory count, correctly exceeds task spec's 19)
- All JSON files validated successfully
- Container image examples included (nginx:latest in container/run)
- All 4 destructive tools properly tagged with "destructive" and "write" flags

**Note**: Task spec listed 19 tools but inventory has 20. Implementer correctly followed inventory and generated all 20 prompts. The actual tool is `container/list-services`, not `container/list`.

# Work Package Prompt: WP11 – Generate Prompts - containers (19 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 19 tools in the containers domain covering containers, stacks, volumes, and registries.

## Domain Overview

| Domain | containers |
|--------|-----------|
| Tool Count | 19 |
| Primary Tier | 4 (requires project) |
| Prefixes | `container/`, `stack/`, `volume/`, `registry/` |
| Risk Level | Medium |

## Tool List

### container/ tools (9)

| Tool | Tier | Destructive |
|------|------|-------------|
| `container/run` | 4 | No |
| `container/list` | 4 | No |
| `container/logs` | 4 | No |
| `container/start` | 4 | No |
| `container/stop` | 4 | No |
| `container/restart` | 4 | No |
| `container/recreate` | 4 | No |
| `container/delete` | 4 | **Yes** |
| `container/update` | 4 | No |

### stack/ tools (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `stack/list` | 4 | No |
| `stack/deploy` | 4 | No |
| `stack/ps` | 4 | No |
| `stack/delete` | 4 | **Yes** |

### volume/ tools (3)

| Tool | Tier | Destructive |
|------|------|-------------|
| `volume/list` | 4 | No |
| `volume/create` | 4 | No |
| `volume/delete` | 4 | **Yes** |

### registry/ tools (4)

| Tool | Tier | Destructive |
|------|------|-------------|
| `registry/list` | 4 | No |
| `registry/create` | 4 | No |
| `registry/update` | 4 | No |
| `registry/delete` | 4 | **Yes** |

## Key Tool Details

### container/run
- Creates and starts a container
- Parameters: `projectId`, `image`, `name`, `env`, `publish`
- Example: `image: "nginx:latest"`

### stack/deploy
- Deploys docker-compose style stack
- Parameters: `projectId`, `composeFile`
- Long-running operation

### registry/create
- Creates registry credentials
- Parameters: `projectId`, `uri`, `description`, `username`, `password`

## Deliverables

- [x] `evals/prompts/containers/container-run.json`
- [x] `evals/prompts/containers/container-list-services.json` *(actual tool name from inventory)*
- [x] `evals/prompts/containers/container-logs.json`
- [x] `evals/prompts/containers/container-start.json`
- [x] `evals/prompts/containers/container-stop.json`
- [x] `evals/prompts/containers/container-restart.json`
- [x] `evals/prompts/containers/container-recreate.json`
- [x] `evals/prompts/containers/container-delete.json`
- [x] `evals/prompts/containers/container-update.json`
- [x] `evals/prompts/containers/stack-list.json`
- [x] `evals/prompts/containers/stack-deploy.json`
- [x] `evals/prompts/containers/stack-ps.json`
- [x] `evals/prompts/containers/stack-delete.json`
- [x] `evals/prompts/containers/volume-list.json`
- [x] `evals/prompts/containers/volume-create.json`
- [x] `evals/prompts/containers/volume-delete.json`
- [x] `evals/prompts/containers/registry-list.json`
- [x] `evals/prompts/containers/registry-create.json`
- [x] `evals/prompts/containers/registry-update.json`
- [x] `evals/prompts/containers/registry-delete.json`

**Total**: 20 JSON files ✓ (actual inventory count)

## Acceptance Criteria

1. ✅ All prompt files created (20 - matching actual inventory)
2. ✅ Container image examples included (nginx:latest in container/run)
3. ✅ Destructive tools marked appropriately (4 delete tools tagged)

