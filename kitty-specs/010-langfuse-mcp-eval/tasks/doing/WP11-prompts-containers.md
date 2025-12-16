---
work_package_id: "WP11"
subtasks:
  - "T001"
title: "Generate Prompts - containers (19 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:11:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

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

- [ ] `evals/prompts/containers/container-run.json`
- [ ] `evals/prompts/containers/container-list.json`
- [ ] `evals/prompts/containers/container-logs.json`
- [ ] `evals/prompts/containers/container-start.json`
- [ ] `evals/prompts/containers/container-stop.json`
- [ ] `evals/prompts/containers/container-restart.json`
- [ ] `evals/prompts/containers/container-recreate.json`
- [ ] `evals/prompts/containers/container-delete.json`
- [ ] `evals/prompts/containers/container-update.json`
- [ ] `evals/prompts/containers/stack-list.json`
- [ ] `evals/prompts/containers/stack-deploy.json`
- [ ] `evals/prompts/containers/stack-ps.json`
- [ ] `evals/prompts/containers/stack-delete.json`
- [ ] `evals/prompts/containers/volume-list.json`
- [ ] `evals/prompts/containers/volume-create.json`
- [ ] `evals/prompts/containers/volume-delete.json`
- [ ] `evals/prompts/containers/registry-list.json`
- [ ] `evals/prompts/containers/registry-create.json`
- [ ] `evals/prompts/containers/registry-update.json`
- [ ] `evals/prompts/containers/registry-delete.json`

**Total**: 19 JSON files (note: 19 not 15 as originally estimated)

## Acceptance Criteria

1. All 19 prompt files created
2. Container image examples included
3. Destructive tools marked appropriately

