# Tasks: Langfuse MCP Eval Suite

**Feature**: 010-langfuse-mcp-eval
**Total Work Packages**: 32
**Generated**: 2025-12-16

## Task Overview

| Phase | WP Range | Description | Tool Count |
|-------|----------|-------------|------------|
| Phase 1 | WP-01 to WP-03 | Infrastructure & Schemas | - |
| Phase 2 | WP-04 to WP-06 | Dependency Graph & Inventory | 175 tools |
| Phase 3 | WP-07 to WP-17 | Eval Prompt Generation | 175 prompts |
| Phase 4 | WP-18 to WP-28 | Eval Execution | 175 evals |
| Phase 5 | WP-29 to WP-32 | Aggregation & Export | - |

---

## Phase 1: Infrastructure & Schemas

### WP-01: Self-Assessment Extractor Script
**Status**: done
**Prompt**: `tasks/done/WP01-self-assessment-extractor.md`

Create a TypeScript script to extract self-assessment JSON blocks from session logs.

**Deliverables**:
- `evals/scripts/extract-self-assessment.ts`
- Unit tests for extraction logic
- Handle edge cases (malformed JSON, missing markers)

**Acceptance Criteria**:
- [x] Script parses session log files
- [x] Extracts JSON between `<!-- SELF_ASSESSMENT_START -->` and `<!-- SELF_ASSESSMENT_END -->` markers
- [x] Validates extracted JSON against self-assessment schema
- [x] Returns null for missing/invalid assessments
- [x] Unit tests pass

---

### WP-02: Eval Prompt Generator Script
**Status**: done
**Prompt**: `tasks/done/WP02-eval-prompt-generator.md`

Create a script to generate Langfuse-format eval prompts from tool inventory.

**Deliverables**:
- `evals/scripts/generate-eval-prompts.ts`
- Tool-to-prompt mapping configuration
- Template interpolation logic

**Acceptance Criteria**:
- [x] Script reads tool inventory JSON
- [x] Generates eval prompt for each tool using template
- [x] Outputs Langfuse-compatible JSON files
- [x] Handles all 175 tools without errors

---

### WP-03: Coverage Reporter Script
**Status**: done
**Prompt**: `tasks/done/WP03-coverage-reporter.md`

Create a script to aggregate eval results into coverage reports.

**Deliverables**:
- `evals/scripts/generate-coverage-report.ts`
- Domain-level and tier-level aggregation
- JSON and Markdown output formats

**Acceptance Criteria**:
- [x] Script reads eval results directory
- [x] Aggregates by domain and tier
- [x] Generates `coverage-report.json`
- [x] Generates `baseline-report.md`

---

## Phase 2: Dependency Graph & Inventory

### WP-04: Tool Inventory Generation
**Status**: done
**Prompt**: `tasks/done/WP04-tool-inventory.md`

Generate complete tool inventory from MCP server.

**Deliverables**:
- `evals/inventory/tools.json` (177 tools - actual codebase count)
- Domain and tier classification for each tool
- Success indicators for each tool

**Acceptance Criteria**:
- [x] All 177 tools inventoried (codebase has 177, not 175)
- [x] Each tool has domain assignment
- [x] Each tool has tier classification
- [x] Each tool has success indicators

---

### WP-05: Dependency Graph Generation
**Status**: todo
**Prompt**: `tasks/WP-05-dependency-graph.md`

Generate tool dependency graph in JSON and DOT formats.

**Deliverables**:
- `evals/inventory/dependency-graph.json` (adjacency list)
- `evals/inventory/dependency-graph.dot` (Graphviz)
- Cross-domain dependency documentation

**Acceptance Criteria**:
- [ ] All tool dependencies mapped
- [ ] No circular dependencies
- [ ] Cross-domain dependencies documented
- [ ] Graphviz DOT renders correctly

---

### WP-06: Tier Analysis Report
**Status**: todo
**Prompt**: `tasks/WP-06-tier-analysis.md`

Analyze and document tier distribution.

**Deliverables**:
- `evals/inventory/tier-analysis.md`
- Tool counts per tier
- Execution order recommendations

**Acceptance Criteria**:
- [ ] All 175 tools categorized by tier
- [ ] Tier distribution documented
- [ ] Execution order defined

---

## Phase 3: Eval Prompt Generation

### WP-07: Generate Prompts - identity (17 tools)
**Status**: todo
**Prompt**: `tasks/WP-07-prompts-identity.md`

Generate eval prompts for identity domain tools.

**Tools**: user/get, user/session/list, user/session/get, user/ssh-key/list, user/ssh-key/get, user/ssh-key/create, user/ssh-key/delete, user/ssh-key/import, user/api-token/list, user/api-token/get, user/api-token/create, user/api-token/revoke, context/get, context/set, context/reset, context/accessible-projects, context/get-session

**Deliverables**: `evals/prompts/identity/*.json` (17 files)

---

### WP-08: Generate Prompts - organization (14 tools)
**Status**: done
**Prompt**: `tasks/done/WP08-prompts-organization.md`

Generate eval prompts for organization domain tools.

**Tools**: org/list, org/get, org/delete, org/invite, org/invite-list, org/invite-list-own, org/invite-revoke, org/membership-list, org/membership-list-own, org/membership-revoke, extension/list, extension/install, extension/list-installed, extension/uninstall

**Deliverables**: `evals/prompts/organization/*.json` (14 files)

---

### WP-09: Generate Prompts - project-foundation (16 tools)
**Status**: todo
**Prompt**: `tasks/WP-09-prompts-project-foundation.md`

Generate eval prompts for project-foundation domain tools.

**Tools**: project/create, project/list, project/get, project/delete, project/update, project/filesystem-usage, project/ssh, project/invite-get, project/invite-list, project/invite-list-own, project/membership-get, project/membership-get-own, project/membership-list, project/membership-list-own, server/list, server/get

**Deliverables**: `evals/prompts/project-foundation/*.json` (16 files)

---

### WP-10: Generate Prompts - apps (28 tools)
**Status**: todo
**Prompt**: `tasks/WP-10-prompts-apps.md`

Generate eval prompts for apps domain tools.

**Tools**: app/create/node, app/create/php, app/create/php-worker, app/create/python, app/create/static, app/install/wordpress, app/install/typo3, app/install/joomla, app/install/contao, app/install/shopware5, app/install/shopware6, app/install/matomo, app/install/nextcloud, app/list, app/get, app/update, app/upgrade, app/uninstall, app/copy, app/download, app/upload, app/open, app/ssh, app/versions, app/list-upgrade-candidates, app/dependency-list, app/dependency-update, app/dependency-versions

**Deliverables**: `evals/prompts/apps/*.json` (28 files)

---

### WP-11: Generate Prompts - containers (19 tools)
**Status**: todo
**Prompt**: `tasks/WP-11-prompts-containers.md`

Generate eval prompts for containers domain tools.

**Tools**: container/run, container/list, container/logs, container/start, container/stop, container/restart, container/recreate, container/delete, container/update, stack/list, stack/deploy, stack/ps, stack/delete, volume/list, volume/create, volume/delete, registry/list, registry/create, registry/update, registry/delete

**Deliverables**: `evals/prompts/containers/*.json` (19 files)

---

### WP-12: Generate Prompts - databases (21 tools)
**Status**: done
**Prompt**: `tasks/done/WP12-prompts-databases.md`

Generate eval prompts for databases domain tools.

**Tools**: database/list, database/mysql/create, database/mysql/list, database/mysql/get, database/mysql/delete, database/mysql/charsets, database/mysql/versions, database/mysql/dump, database/mysql/import, database/mysql/shell, database/mysql/port-forward, database/mysql/phpmyadmin, database/mysql/user-create, database/mysql/user-list, database/mysql/user-get, database/mysql/user-update, database/mysql/user-delete, database/redis/create, database/redis/list, database/redis/get, database/redis/versions

**Deliverables**: `evals/prompts/databases/*.json` (21 files)

---

### WP-13: Generate Prompts - domains-mail (20 tools)
**Status**: todo
**Prompt**: `tasks/WP-13-prompts-domains-mail.md`

Generate eval prompts for domains-mail domain tools.

**Tools**: domain/list, domain/get, domain/dnszone/list, domain/dnszone/get, domain/dnszone/update, domain/virtualhost-list, domain/virtualhost-get, domain/virtualhost-create, domain/virtualhost-delete, mail/address/list, mail/address/get, mail/address/create, mail/address/update, mail/address/delete, mail/deliverybox/list, mail/deliverybox/get, mail/deliverybox/create, mail/deliverybox/update, mail/deliverybox/delete, certificate/list, certificate/request

**Deliverables**: `evals/prompts/domains-mail/*.json` (20 files)

---

### WP-14: Generate Prompts - access-users (8 tools)
**Status**: done
**Prompt**: `tasks/done/WP14-prompts-access-users.md`

Generate eval prompts for access-users domain tools.

**Tools**: sftp/user-list, sftp/user-create, sftp/user-update, sftp/user-delete, ssh/user-list, ssh/user-create, ssh/user-update, ssh/user-delete

**Deliverables**: `evals/prompts/access-users/*.json` (8 files)

---

### WP-15: Generate Prompts - automation (10 tools)
**Status**: todo
**Prompt**: `tasks/WP-15-prompts-automation.md`

Generate eval prompts for automation domain tools.

**Tools**: cronjob/list, cronjob/get, cronjob/create, cronjob/update, cronjob/delete, cronjob/execute, cronjob/execution-list, cronjob/execution-get, cronjob/execution-abort, cronjob/execution-logs

**Deliverables**: `evals/prompts/automation/*.json` (10 files)

---

### WP-16: Generate Prompts - backups (9 tools)
**Status**: done
**Prompt**: `tasks/done/WP16-prompts-backups.md`

Generate eval prompts for backups domain tools.

**Tools**: backup/list, backup/get, backup/create, backup/delete, backup/download, backup/schedule-list, backup/schedule-create, backup/schedule-update, backup/schedule-delete

**Deliverables**: `evals/prompts/backups/*.json` (9 files)

---

### WP-17: Generate Prompts - misc (13 tools)
**Status**: todo
**Prompt**: `tasks/WP-17-prompts-misc.md`

Generate eval prompts for miscellaneous tools (conversation, login, ddev).

**Tools**: conversation/list, conversation/show, conversation/create, conversation/reply, conversation/close, conversation/categories, login/status, login/token, login/reset, ddev/init, ddev/render-config, context/set-session, context/reset-session

**Deliverables**: `evals/prompts/misc/*.json` (13 files)

---

## Phase 4: Eval Execution

### WP-18: Execute Evals - identity (17 evals)
**Status**: done
**Prompt**: `tasks/done/phase-4-eval-execution/WP18-execute-identity.md`

Execute all identity domain evals via spec-kitty agents.

**Execution Order**: Tier 0 tools first (most tools in this domain are Tier 0)

**Deliverables**:
- Session logs for 17 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-19: Execute Evals - organization (14 evals)
**Status**: done
**Prompt**: `tasks/done/phase-4-eval-execution/WP19-execute-organization.md`

Execute all organization domain evals.

**Execution Order**: Tier 0 (org/list) → Tier 1 (org/get, etc.)

**Deliverables**:
- Session logs for 14 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-20: Execute Evals - project-foundation (16 evals)
**Status**: todo
**Prompt**: `tasks/WP-20-execute-project-foundation.md`

Execute all project-foundation domain evals.

**Execution Order**: Tier 0 (project/list) → Tier 3 (project/create) → Tier 4

**Deliverables**:
- Session logs for 16 evals
- Self-assessments extracted
- Domain coverage checkpoint
- Project resources for subsequent domains

---

### WP-21: Execute Evals - apps (28 evals)
**Status**: todo
**Prompt**: `tasks/WP-21-execute-apps.md`

Execute all apps domain evals.

**Prerequisites**: Project must exist from WP-20

**Deliverables**:
- Session logs for 28 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-22: Execute Evals - containers (19 evals)
**Status**: todo
**Prompt**: `tasks/WP-22-execute-containers.md`

Execute all containers domain evals.

**Prerequisites**: Project must exist

**Deliverables**:
- Session logs for 19 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-23: Execute Evals - databases (21 evals)
**Status**: todo
**Prompt**: `tasks/WP-23-execute-databases.md`

Execute all databases domain evals.

**Prerequisites**: Project must exist

**Deliverables**:
- Session logs for 21 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-24: Execute Evals - domains-mail (20 evals)
**Status**: todo
**Prompt**: `tasks/WP-24-execute-domains-mail.md`

Execute all domains-mail domain evals.

**Prerequisites**: Project must exist, may need domain configuration

**Deliverables**:
- Session logs for 20 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-25: Execute Evals - access-users (8 evals)
**Status**: todo
**Prompt**: `tasks/WP-25-execute-access-users.md`

Execute all access-users domain evals.

**Prerequisites**: Project must exist

**Deliverables**:
- Session logs for 8 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-26: Execute Evals - automation (10 evals)
**Status**: todo
**Prompt**: `tasks/WP-26-execute-automation.md`

Execute all automation domain evals.

**Prerequisites**: Project and app must exist (for cronjob/create)

**Deliverables**:
- Session logs for 10 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-27: Execute Evals - backups (9 evals)
**Status**: todo
**Prompt**: `tasks/WP-27-execute-backups.md`

Execute all backups domain evals.

**Prerequisites**: Project must exist

**Deliverables**:
- Session logs for 9 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

### WP-28: Execute Evals - misc (13 evals)
**Status**: todo
**Prompt**: `tasks/WP-28-execute-misc.md`

Execute all miscellaneous domain evals.

**Deliverables**:
- Session logs for 13 evals
- Self-assessments extracted
- Domain coverage checkpoint

---

## Phase 5: Aggregation & Export

### WP-29: Extract All Self-Assessments
**Status**: todo
**Prompt**: `tasks/WP-29-extract-assessments.md`

Process all session logs to extract self-assessments.

**Deliverables**:
- `evals/results/self-assessments/*.json` (175 files)
- Extraction success rate report
- List of failed extractions

**Acceptance Criteria**:
- [ ] All session logs processed
- [ ] Valid assessments extracted
- [ ] Failed extractions documented

---

### WP-30: Generate Coverage Report
**Status**: todo
**Prompt**: `tasks/WP-30-coverage-report.md`

Generate comprehensive coverage report.

**Deliverables**:
- `evals/results/coverage-report.json`
- Domain breakdown
- Tier breakdown
- Success/failure rates

**Acceptance Criteria**:
- [ ] All 175 tools accounted for
- [ ] Domain coverage calculated
- [ ] Tier coverage calculated

---

### WP-31: Export Langfuse Dataset
**Status**: todo
**Prompt**: `tasks/WP-31-langfuse-export.md`

Export eval prompts and results in Langfuse-compatible format.

**Deliverables**:
- `evals/datasets/mittwald-mcp-tools.json`
- Dataset metadata
- Import instructions

**Acceptance Criteria**:
- [ ] All 175 eval prompts included
- [ ] Langfuse schema validated
- [ ] Ready for future import

---

### WP-32: Generate Baseline Report
**Status**: todo
**Prompt**: `tasks/WP-32-baseline-report.md`

Generate human-readable baseline analysis.

**Deliverables**:
- `evals/results/baseline-report.md`
- Problem patterns analysis
- Domain-specific insights
- Recommendations

**Acceptance Criteria**:
- [ ] Executive summary included
- [ ] Problem patterns identified
- [ ] Actionable recommendations provided

---

## Execution Order

```
Phase 1 (Infrastructure):
  WP-01 → WP-02 → WP-03 (sequential)

Phase 2 (Inventory):
  WP-04 → WP-05 → WP-06 (sequential, depends on Phase 1)

Phase 3 (Prompt Generation):
  WP-07 through WP-17 (can run in parallel after Phase 2)

Phase 4 (Execution):
  WP-18 → WP-19 → WP-20 (sequential - establishes resources)
  WP-21 through WP-28 (can run in parallel after WP-20)

Phase 5 (Aggregation):
  WP-29 → WP-30 → WP-31 → WP-32 (sequential, after Phase 4)
```

---

## Progress Tracking

| WP | Status | Started | Completed | Notes |
|----|--------|---------|-----------|-------|
| WP-01 | done | 2025-12-16 | 2025-12-16 | Prompt: tasks/done/WP01-self-assessment-extractor.md |
| WP-02 | todo | - | - | |
| WP-03 | done | 2025-12-16 | 2025-12-16 | Prompt: tasks/done/WP03-coverage-reporter.md |
| WP-04 | done | 2025-12-16 | 2025-12-16 | Prompt: tasks/done/WP04-tool-inventory.md (177 tools) |
| WP-05 | todo | - | - | |
| WP-06 | todo | - | - | |
| WP-07 | todo | - | - | identity (17) |
| WP-08 | done | 2025-12-16 | 2025-12-16 | organization (14) - Prompt: tasks/done/WP08-prompts-organization.md |
| WP-09 | todo | - | - | project-foundation (16) |
| WP-10 | todo | - | - | apps (28) |
| WP-11 | todo | - | - | containers (19) |
| WP-12 | done | 2025-12-16 | 2025-12-16 | databases (21) - Prompt: tasks/done/WP12-prompts-databases.md |
| WP-13 | todo | - | - | domains-mail (20) |
| WP-14 | done | 2025-12-16 | 2025-12-16 | access-users (8) - Prompt: tasks/done/WP14-prompts-access-users.md |
| WP-15 | todo | - | - | automation (10) |
| WP-16 | done | claude-reviewer | 21815 | backups (9) |
| WP-17 | todo | - | - | misc (13) |
| WP-18 | done | claude-reviewer | 98765 | Execute identity - 19 session logs (21% success, baseline captured) |
| WP-19 | done | 2025-12-16 | 2025-12-16 | Execute organization - 14 session logs (0% success, timeouts) |
| WP-20 | todo | - | - | Execute project-foundation |
| WP-21 | todo | - | - | Execute apps |
| WP-22 | todo | - | - | Execute containers |
| WP-23 | todo | - | - | Execute databases |
| WP-24 | todo | - | - | Execute domains-mail |
| WP-25 | todo | - | - | Execute access-users |
| WP-26 | todo | - | - | Execute automation |
| WP-27 | todo | - | - | Execute backups |
| WP-28 | todo | - | - | Execute misc |
| WP-29 | todo | - | - | Extract assessments |
| WP-30 | todo | - | - | Coverage report |
| WP-31 | todo | - | - | Langfuse export |
| WP-32 | todo | - | - | Baseline report |
