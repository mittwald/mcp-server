# Tasks: Domain-Grouped Eval Work Packages

**Feature**: 014-domain-grouped-eval-work-packages
**Total Work Packages**: 13
**Generated**: 2025-12-18

## Task Overview

This feature executes all 110 MCP tool evals by running 11 domain-grouped Work Packages, then aggregating results into a baseline coverage report. (5 conversation tools excluded - no OAuth scope support)

**Execution Strategy**:
1. **Tier 0 Domains** (WP01-03): Execute first - no dependencies
2. **Project Foundation** (WP12): Creates project for tier-4 tools
3. **Tier 4 Domains** (WP04-10): Execute after project exists
4. **Aggregation** (WP13): Generate coverage reports

**Total Evals**: 110 tools across 11 domains (WP11/conversation tools disabled - no OAuth scope support)

---

## Phase 1: Tier 0 Execution (P1)

These domains contain tier-0 tools with no dependencies. Can run in parallel.

### WP01: Execute identity Domain Evals
**Status**: planned
**Prompt**: `tasks/WP01-identity.md`
**Tools**: 12 evals
**Tier Mix**: 0, 4
**Priority**: P1

Execute all identity domain evals (user/get, user/api-token/*, user/ssh-key/*, user/session/*).

**Subtasks**:
- [  ] T001: Execute tier-0 identity evals
- [  ] T002: Execute tier-4 identity evals (requires project from WP12)
- [ ] T003: Verify all 12 self-assessments saved to evals/results/identity/

**Definition of Done**:
- All 12 identity evals executed
- Self-assessments saved to `evals/results/identity/*.json`
- No execution errors

---

### WP02: Execute organization Domain Evals
**Status**: planned
**Prompt**: `tasks/WP02-organization.md`
**Tools**: 7 evals
**Tier Mix**: 0
**Priority**: P1

Execute all organization domain evals (org/list, org/get, org/invite*, org/membership*).

**Subtasks**:
- [  ] T004: Execute all tier-0 organization evals
- [  ] T005: Verify all 7 self-assessments saved to evals/results/organization/

**Definition of Done**:
- All 7 organization evals executed
- Self-assessments saved to `evals/results/organization/*.json`
- No execution errors

---

### WP03: Execute context Domain Evals
**Status**: planned
**Prompt**: `tasks/WP03-context.md`
**Tools**: 3 evals
**Tier Mix**: 0
**Priority**: P1

Execute all context domain evals (context/get, context/set, context/reset).

**Subtasks**:
- [  ] T006: Execute all tier-0 context evals
- [  ] T007: Verify all 3 self-assessments saved to evals/results/context/

**Definition of Done**:
- All 3 context evals executed
- Self-assessments saved to `evals/results/context/*.json`
- No execution errors

---

## Phase 2: Project Foundation (P1)

### WP12: Execute project-foundation Domain Evals
**Status**: planned
**Prompt**: `tasks/WP12-project-foundation.md`
**Tools**: 12 evals
**Tier Mix**: 0, 3, 4
**Priority**: P1
**Dependencies**: None (creates project needed by other WPs)

Execute all project-foundation evals (project/create, project/list, server/*, etc.).

**CRITICAL**: This WP creates the project resource required by all tier-4 tools in other domains.

**Subtasks**:
- [  ] T008: Execute tier-0 project-foundation evals (server/list, etc.)
- [  ] T009: Execute tier-3 evals (project/create) - **CREATES PROJECT**
- [  ] T010: Execute tier-4 evals (project/ssh, project/update, etc.)
- [  ] T011: Verify all 12 self-assessments saved
- [  ] T012: Record project ID for use in subsequent WPs

**Definition of Done**:
- All 12 project-foundation evals executed
- Project resource created and ID recorded
- Self-assessments saved to `evals/results/project-foundation/*.json`

---

## Phase 3: Tier 4 Execution (P1)

These domains require the project created in WP12. Can run in parallel after WP12 completes.

### WP04: Execute apps Domain Evals
**Status**: planned
**Prompt**: `tasks/WP04-apps.md`
**Tools**: 8 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all apps domain evals (app/list, app/get, app/update, etc.).

**Subtasks**:
- [  ] T013: Execute all tier-4 apps evals
- [  ] T014: Verify all 8 self-assessments saved to evals/results/apps/

**Definition of Done**:
- All 8 apps evals executed
- Self-assessments saved to `evals/results/apps/*.json`

---

### WP05: Execute databases Domain Evals
**Status**: planned
**Prompt**: `tasks/WP05-databases.md`
**Tools**: 14 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all databases domain evals (database/mysql/*, database/redis/*).

**Subtasks**:
- [  ] T015: Execute all tier-4 databases evals
- [  ] T016: Verify all 14 self-assessments saved to evals/results/databases/

**Definition of Done**:
- All 14 databases evals executed
- Self-assessments saved to `evals/results/databases/*.json`

---

### WP06: Execute domains-mail Domain Evals
**Status**: planned
**Prompt**: `tasks/WP06-domains-mail.md`
**Tools**: 21 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all domains-mail evals (domain/*, mail/*, certificate/*).

**Subtasks**:
- [  ] T017: Execute all tier-4 domains-mail evals
- [  ] T018: Verify all 21 self-assessments saved to evals/results/domains-mail/

**Definition of Done**:
- All 21 domains-mail evals executed
- Self-assessments saved to `evals/results/domains-mail/*.json`

---

### WP07: Execute automation Domain Evals
**Status**: planned
**Prompt**: `tasks/WP07-automation.md`
**Tools**: 9 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all automation domain evals (cronjob/*).

**Subtasks**:
- [  ] T019: Execute all tier-4 automation evals
- [  ] T020: Verify all 9 self-assessments saved to evals/results/automation/

**Definition of Done**:
- All 9 automation evals executed
- Self-assessments saved to `evals/results/automation/*.json`

---

### WP08: Execute backups Domain Evals
**Status**: planned
**Prompt**: `tasks/WP08-backups.md`
**Tools**: 8 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all backups domain evals (backup/*, backup/schedule/*).

**Subtasks**:
- [  ] T021: Execute all tier-4 backups evals
- [  ] T022: Verify all 8 self-assessments saved to evals/results/backups/

**Definition of Done**:
- All 8 backups evals executed
- Self-assessments saved to `evals/results/backups/*.json`

---

### WP09: Execute containers Domain Evals
**Status**: planned
**Prompt**: `tasks/WP09-containers.md`
**Tools**: 10 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all containers domain evals (container/*, stack/*, volume/*, registry/*).

**Subtasks**:
- [  ] T023: Execute all tier-4 containers evals
- [  ] T024: Verify all 10 self-assessments saved to evals/results/containers/

**Definition of Done**:
- All 10 containers evals executed
- Self-assessments saved to `evals/results/containers/*.json`

---

### WP10: Execute access-users Domain Evals
**Status**: planned
**Prompt**: `tasks/WP10-access-users.md`
**Tools**: 6 evals
**Tier Mix**: 4
**Priority**: P1
**Dependencies**: WP12 (requires project)

Execute all access-users domain evals (ssh/user/*, sftp/user/*).

**Subtasks**:
- [  ] T025: Execute all tier-4 access-users evals
- [  ] T026: Verify all 6 self-assessments saved to evals/results/access-users/

**Definition of Done**:
- All 6 access-users evals executed
- Self-assessments saved to `evals/results/access-users/*.json`

---

### WP11: Execute misc Domain Evals [SKIPPED]
**Status**: skipped
**Prompt**: `tasks/WP11-misc.md`
**Tools**: 5 evals (all conversation/* tools)
**Tier Mix**: 0, 4
**Priority**: P1

**SKIPPED**: All 5 conversation tools have been disabled in the MCP server. Conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only endpoints).

**Reason**: Mittwald API has no conversation scopes. Conversation endpoints exist but are admin-only and return 403 Forbidden for OAuth access tokens.

**Subtasks**:
- [X] ~~T027: Execute all misc evals~~ (SKIPPED - tools disabled)
- [X] ~~T028: Verify all 5 self-assessments saved to evals/results/misc/~~ (SKIPPED - tools disabled)

**Definition of Done**:
- N/A - Work package skipped due to disabled tools

---

## Phase 4: Aggregation & Analysis (P2)

### WP13: Aggregate Results and Generate Baseline Report
**Status**: planned
**Prompt**: `tasks/WP13-aggregate-results.md`
**Priority**: P2
**Dependencies**: WP01-WP10, WP12 (all evals must complete first, WP11 skipped)

Aggregate all 110 self-assessments into comprehensive coverage reports. (Excludes 5 disabled conversation tools)

**Subtasks**:
- [  ] T029: Validate all 110 result files exist in evals/results/ (excluding misc/conversation-*.json)
- [  ] T030: Run aggregation scripts (generate-coverage-report.ts)
- [  ] T031: Verify coverage-report.json generated
- [  ] T032: Verify baseline-report.md generated
- [  ] T033: Review baseline report for success rate and problem categorization
- [  ] T034: Document any aggregation script issues

**Definition of Done**:
- `evals/results/coverage-report.json` exists with valid metrics
- `evals/results/baseline-report.md` exists and is readable
- Report shows 110/110 tools executed (excluding 5 disabled conversation tools)
- Domain and tier breakdowns present
- Problem categorization complete

---

## Execution Summary

**Total Tools**: 110 (5 conversation tools excluded - no OAuth scope support)
**Total Work Packages**: 12 (11 domain execution + 1 aggregation, WP11 skipped)
**Parallelization Opportunities**:
- WP01-WP03 can run in parallel (tier 0)
- WP04-WP10 can run in parallel after WP12 completes

**Recommended Execution Order**:
1. Start: WP01, WP02, WP03 (parallel)
2. Then: WP12 (creates project)
3. Then: WP04-WP10 (parallel, requires project)
4. Skip: WP11 (conversation tools disabled)
5. Finally: WP13 (aggregation)

**Success Criteria**:
- All 110 evals executed with self-assessments saved
- Coverage report shows 100% execution (110/110 tools)
- Baseline established for future comparison
- WP11 skipped and documented
