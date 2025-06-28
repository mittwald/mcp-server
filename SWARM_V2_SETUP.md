# CLI Migration Swarm V2 - Setup Guide

## Overview
This is the second iteration of the CLI migration swarm, building on 18 successfully implemented tools and using git worktrees for proper agent isolation.

## Goals Recap
- **Objective**: Transform Mittwald MCP server to CLI-workflow-based tools with exact 1:1 mapping
- **Scope**: 153 total CLI commands (18 completed, 135 remaining)
- **Agents**: 20 parallel agents working in isolated worktrees

## Already Completed Tools (18)
From the rescued work in swarm v1:
- App Installation: wordpress, joomla, typo3, shopware5, shopware6, nextcloud, matomo
- Domain: virtualhost-list
- Extension: list, install, uninstall, list-installed
- Login: reset
- Project: create, delete, get, filesystem-usage, invite-get

## Critical Improvements from V1

### 1. GIT WORKTREES FOR ISOLATION
Each agent works in a completely separate directory to prevent interference.

### 2. FREQUENT COMMITS REQUIREMENT
**AGENTS MUST COMMIT AFTER EACH TOOL IMPLEMENTATION!**
- Commit after implementing each tool (definition + handler)
- Use descriptive commit messages
- Push to remote regularly
- This prevents work loss and makes progress trackable

### 3. REGISTRY TRACKING
Agents must update their registry CSV after each tool to track progress.

## Setup Steps

### Phase 1: Prepare Updated Registries
1. Filter out completed tools from master registry
2. Redistribute remaining 135 tools among 20 agents
3. Create updated agent registries

### Phase 2: Create Worktree Environment
```bash
# Create parent directory for all worktrees
mkdir ../mittwald-cli-swarm-v2
cd ../mittwald-cli-swarm-v2

# Create worktree for each agent
for i in {1..20}; do
  git worktree add agent-$i ../mittwald-typescript-mcp-systempromptio -b cli-v2-agent-$i
done
```

### Phase 3: Agent Instructions
Each agent receives:
1. Their specific worktree directory
2. List of assigned CLI commands
3. Clear commit requirements
4. Registry update instructions

## Agent Workflow

### For Each Assigned Tool:
1. Study CLI implementation in `/Users/robert/Code/Mittwald/cli-commands`
2. Create tool definition in `src/constants/tool/mittwald-cli/{category}/`
3. Create handler in `src/handlers/tools/mittwald-cli/{category}/`
4. Update all registration points
5. **COMMIT IMMEDIATELY** with message: `feat(cli): implement mittwald_{tool_name}`
6. Update agent registry CSV with completion status
7. **COMMIT REGISTRY UPDATE**
8. Move to next tool

### Commit Frequency Rules
- **After each tool**: Commit implementation
- **After registry update**: Commit progress tracking
- **Every 30 minutes**: Push to remote (even if mid-implementation)
- **Before breaks**: Always commit WIP with clear message

## Registry Structure
```csv
command_path,mcp_tool_name,status,commit_hash,completion_time
app/list,mittwald_app_list,pending,,
app/list,mittwald_app_list,completed,abc123,2024-01-15T10:30:00Z
```

## Success Metrics
- All 135 remaining tools implemented
- Each tool has both definition and handler
- All tools properly registered in tool-handlers.ts
- Clean commit history showing incremental progress
- No merge conflicts between agents