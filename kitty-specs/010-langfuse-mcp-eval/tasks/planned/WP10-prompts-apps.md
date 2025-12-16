---
work_package_id: "WP10"
subtasks:
  - "T001"
title: "Generate Prompts - apps (28 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:10:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP10 – Generate Prompts - apps (28 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 28 tools in the apps domain. This is the largest domain and covers app creation, installation, and lifecycle management.

## Domain Overview

| Domain | apps |
|--------|------|
| Tool Count | 28 |
| Primary Tier | 4 (requires project) |
| Prefix | `app/` |
| Risk Level | Medium-High (creates resources, has destructive ops) |

## Tool List

### app/create/* (5 tools)

| Tool | Tier | Description |
|------|------|-------------|
| `app/create/node` | 4 | Create Node.js app |
| `app/create/php` | 4 | Create PHP app |
| `app/create/php-worker` | 4 | Create PHP worker app |
| `app/create/python` | 4 | Create Python app |
| `app/create/static` | 4 | Create static site |

**Common Parameters**: `projectId`, `siteTitle`, `entrypoint`/`documentRoot`
**Resources Created**: App installation (track for cleanup)

### app/install/* (8 tools)

| Tool | Tier | Description |
|------|------|-------------|
| `app/install/wordpress` | 4 | Install WordPress |
| `app/install/typo3` | 4 | Install TYPO3 |
| `app/install/joomla` | 4 | Install Joomla |
| `app/install/contao` | 4 | Install Contao |
| `app/install/shopware5` | 4 | Install Shopware 5 |
| `app/install/shopware6` | 4 | Install Shopware 6 |
| `app/install/matomo` | 4 | Install Matomo |
| `app/install/nextcloud` | 4 | Install Nextcloud |

**Common Parameters**: `projectId`, `siteTitle`, `adminUser`, `adminPass`, `adminEmail`
**Note**: Installation takes time (use `wait: true`)
**Resources Created**: App installation with database

### app/ lifecycle (15 tools)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `app/list` | 4 | project | No |
| `app/get` | 4 | app ID | No |
| `app/update` | 4 | app ID | No |
| `app/upgrade` | 4 | app ID | No |
| `app/uninstall` | 4 | app ID | **Yes** |
| `app/copy` | 4 | app ID | No |
| `app/download` | 4 | app ID | No |
| `app/upload` | 4 | app ID | No |
| `app/open` | 4 | app ID | No |
| `app/ssh` | 4 | app ID | No (interactive) |
| `app/versions` | 4 | None | No |
| `app/list-upgrade-candidates` | 4 | app ID | No |
| `app/dependency-list` | 4 | app ID | No |
| `app/dependency-update` | 4 | app ID | No |
| `app/dependency-versions` | 4 | dependency | No |

## Execution Considerations

### Long-Running Operations
- `app/install/*` tools can take 2-5 minutes
- Use `wait: true` and appropriate timeout
- Self-assessment should note duration

### Resource Management
- Each create/install creates billable resources
- Track all created apps for cleanup
- Execute `app/uninstall` last

### Order Within Domain
1. `app/list` - Check existing apps
2. `app/versions` - Available versions
3. `app/create/node` (or one create) - Create test app
4. `app/get`, `app/update`, etc. - Use created app
5. `app/install/wordpress` (optional, time-intensive)
6. `app/uninstall` - Cleanup (LAST)

## Deliverables

- [ ] `evals/prompts/apps/app-create-node.json`
- [ ] `evals/prompts/apps/app-create-php.json`
- [ ] `evals/prompts/apps/app-create-php-worker.json`
- [ ] `evals/prompts/apps/app-create-python.json`
- [ ] `evals/prompts/apps/app-create-static.json`
- [ ] `evals/prompts/apps/app-install-wordpress.json`
- [ ] `evals/prompts/apps/app-install-typo3.json`
- [ ] `evals/prompts/apps/app-install-joomla.json`
- [ ] `evals/prompts/apps/app-install-contao.json`
- [ ] `evals/prompts/apps/app-install-shopware5.json`
- [ ] `evals/prompts/apps/app-install-shopware6.json`
- [ ] `evals/prompts/apps/app-install-matomo.json`
- [ ] `evals/prompts/apps/app-install-nextcloud.json`
- [ ] `evals/prompts/apps/app-list.json`
- [ ] `evals/prompts/apps/app-get.json`
- [ ] `evals/prompts/apps/app-update.json`
- [ ] `evals/prompts/apps/app-upgrade.json`
- [ ] `evals/prompts/apps/app-uninstall.json`
- [ ] `evals/prompts/apps/app-copy.json`
- [ ] `evals/prompts/apps/app-download.json`
- [ ] `evals/prompts/apps/app-upload.json`
- [ ] `evals/prompts/apps/app-open.json`
- [ ] `evals/prompts/apps/app-ssh.json`
- [ ] `evals/prompts/apps/app-versions.json`
- [ ] `evals/prompts/apps/app-list-upgrade-candidates.json`
- [ ] `evals/prompts/apps/app-dependency-list.json`
- [ ] `evals/prompts/apps/app-dependency-update.json`
- [ ] `evals/prompts/apps/app-dependency-versions.json`

**Total**: 28 JSON files

## Acceptance Criteria

1. All 28 prompt files created
2. Installation tools have appropriate timeout guidance
3. Resource creation tracked in prompts
4. `app/uninstall` has safety warnings

