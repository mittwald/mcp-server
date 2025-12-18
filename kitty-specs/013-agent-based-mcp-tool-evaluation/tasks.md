# Work Packages: Agent-Based MCP Tool Evaluation

**Feature**: 013-agent-based-mcp-tool-evaluation
**Branch**: `013-agent-based-mcp-tool-evaluation`
**Status**: Planning Complete

---

## Overview

This feature reconciles the eval suite with the post-012 MCP server architecture (115 tools vs 175 baseline). Work packages focus on tool inventory analysis, prompt reconciliation (archive/update/create), and coverage validation.

**Success Criteria**:
- 100% of 115 current tools have valid eval prompts
- All prompts formatted as Langfuse-importable JSON
- Prompts explicitly instruct "CALL tool directly, NOT write scripts"
- Post-012 baseline established

---

## Subtask Reference

### Phase 0: Research & Inventory
- **T001**: Generate current tool inventory JSON (115 tools, 19 domains)
- **T002**: Create diff report comparing 010 baseline (175 tools) vs current (115 tools)
- **T003**: Categorize tool changes (removed, renamed, modified, new, unchanged)
- **T004**: Document tool mapping for renames/consolidations

### Phase 1: Infrastructure & Templates
- **T005**: Review and validate feature 010 eval prompt format
- **T006**: Update eval prompt template with "CALL tool directly" emphasis [P]
- **T007**: Create contracts directory with JSON schemas (if missing) [P]
- **T008**: Document agent execution guidance (quickstart updates) [P]

### Phase 2: Prompt Reconciliation - Archive
- **T009**: Archive removed app/* tool prompts (~20 tools) [P]
- **T010**: Archive removed database/* tool prompts (~8 tools) [P]
- **T011**: Archive removed automation/login/misc tool prompts (~10 tools) [P]
- **T012**: Archive removed identity/organization tool prompts (~12 tools) [P]
- **T013**: Archive removed project/container tool prompts (~10 tools) [P]

### Phase 2: Prompt Reconciliation - Update
- **T014**: Identify tools requiring prompt updates (renamed/modified)
- **T015**: Update app domain prompts (8 current tools) [P]
- **T016**: Update database domain prompts (14 current tools) [P]
- **T017**: Update project/organization domain prompts (17 current tools) [P]
- **T018**: Update mail/domain/certificate prompts (21 current tools) [P]
- **T019**: Update user/context/conversation prompts (20 current tools) [P]
- **T020**: Update cronjob/backup/ssh/sftp prompts (23 current tools) [P]
- **T021**: Update stack/container/registry/volume prompts (10 current tools) [P]

### Phase 2: Prompt Reconciliation - Create
- **T022**: Identify new tools not in feature 010 baseline
- **T023**: Create prompts for new tools (if any) [P]

### Phase 2: Prompt Reconciliation - Validate
- **T024**: Spot-check unchanged prompts for accuracy (sample 20% per domain) [P]

### Phase 3: Coverage & Baseline
- **T025**: Generate tool inventory files (tools-current.json, tools-baseline.json)
- **T026**: Generate coverage report (115/115 tools, 100% coverage)
- **T027**: Update tier classification for 115 current tools
- **T028**: Create baseline documentation (post-012 reference point)

---

## Work Package 1: Tool Inventory & Diff Analysis

**ID**: WP01
**Priority**: P0 (Critical - blocks all reconciliation work)
**Status**: Planned
**Prompt**: [WP01-tool-inventory-diff-analysis.md](./tasks/planned/WP01-tool-inventory-diff-analysis.md)

### Objective
Generate authoritative tool inventory for current MCP server (115 tools) and detailed diff report comparing against feature 010 baseline (175 tools).

### Included Subtasks
- [ ] T001: Generate current tool inventory JSON (115 tools, 19 domains)
- [ ] T002: Create diff report comparing 010 baseline vs current
- [ ] T003: Categorize tool changes (removed, renamed, modified, new, unchanged)
- [ ] T004: Document tool mapping for renames/consolidations

### Success Criteria
- `evals/inventory/tools-current.json` created with 115 tools
- `evals/inventory/diff-report.json` shows detailed change analysis
- Tool mapping table identifies all renames/consolidations
- Change categorization complete (60 removed, X renamed, Y new, Z unchanged)

### Dependencies
- MCP server access (mittwald-mcp-fly2.fly.dev)
- Feature 010 baseline data (`evals/prompts/` directory from main branch)

### Risks
- Tool schema changes not detected (manual verification may be needed)
- Renames vs removals ambiguous (requires judgment calls)

---

## Work Package 2: Infrastructure & Template Updates

**ID**: WP02
**Priority**: P0 (Critical - blocks prompt generation)
**Status**: Planned
**Prompt**: [WP02-infrastructure-template-updates.md](./tasks/planned/WP02-infrastructure-template-updates.md)

### Objective
Prepare eval prompt template and infrastructure for reconciliation work, emphasizing "CALL tool directly" language.

### Included Subtasks
- [ ] T005: Review and validate feature 010 eval prompt format
- [ ] T006: Update eval prompt template with "CALL tool directly" emphasis
- [ ] T007: Create contracts directory with JSON schemas (if missing)
- [ ] T008: Document agent execution guidance (quickstart updates)

### Success Criteria
- `contracts/eval-prompt-template.md` updated with v2.0.0 format
- Template includes explicit "DO NOT write scripts" language
- JSON schemas present in `contracts/` (or confirmed reusable from feature 010)
- Quickstart.md documents agent execution model

### Parallelization
- T006, T007, T008 can run in parallel (independent files)

### Dependencies
- Feature 010 prompt format understanding
- User confirmation on "call tool directly" emphasis

---

## Work Package 3: Archive Removed Tool Prompts (Batch 1)

**ID**: WP03
**Priority**: P1
**Status**: Planned
**Prompt**: [WP03-archive-removed-prompts-batch1.md](./tasks/planned/WP03-archive-removed-prompts-batch1.md)

### Objective
Archive eval prompts for removed app/database/automation domain tools (~38 tools total).

### Included Subtasks
- [ ] T009: Archive removed app/* tool prompts (~20 tools)
- [ ] T010: Archive removed database/* tool prompts (~8 tools)
- [ ] T011: Archive removed automation/login/misc tool prompts (~10 tools)

### Success Criteria
- All prompts for removed tools moved to `evals/prompts/_archived/{domain}/`
- Archive metadata added (date, reason: "feature-012-removal", feature: "013")
- Original domain directories cleaned (no prompts for non-existent tools)

### Parallelization
- All 3 subtasks can run in parallel (different domain directories)

### Implementation Notes
- Create `_archived/` directory structure matching original domains
- Preserve original filenames for traceability
- Add JSON comment field: `"_archive_metadata": { "date": "2025-12-18", "reason": "..." }`

---

## Work Package 4: Archive Removed Tool Prompts (Batch 2)

**ID**: WP04
**Priority**: P1
**Status**: Planned
**Prompt**: [WP04-archive-removed-prompts-batch2.md](./tasks/planned/WP04-archive-removed-prompts-batch2.md)

### Objective
Archive eval prompts for removed identity/organization/project domain tools (~22 tools total).

### Included Subtasks
- [ ] T012: Archive removed identity/organization tool prompts (~12 tools)
- [ ] T013: Archive removed project/container tool prompts (~10 tools)

### Success Criteria
- All remaining removed tool prompts archived
- Total archived: ~60 prompts across all domains
- Archive directory structure complete

### Parallelization
- Both subtasks can run in parallel (different domain directories)

### Dependencies
- WP03 completion (establishes archive pattern)

---

## Work Package 5: Update Tool Prompts (Core Domains)

**ID**: WP05
**Priority**: P0 (Critical - core functionality)
**Status**: Planned
**Prompt**: [WP05-update-prompts-core-domains.md](./tasks/planned/WP05-update-prompts-core-domains.md)

### Objective
Update eval prompts for current tools in app, database, project, organization domains (~39 tools total).

### Included Subtasks
- [ ] T014: Identify tools requiring prompt updates (renamed/modified)
- [ ] T015: Update app domain prompts (8 current tools)
- [ ] T016: Update database domain prompts (14 current tools)
- [ ] T017: Update project/organization domain prompts (17 current tools)

### Success Criteria
- All prompts reflect current tool names and parameters
- `eval_version` updated to `2.0.0`
- `updated_at` timestamp added to metadata
- "CALL tool directly" language emphasized in all prompts

### Parallelization
- T015, T016, T017 can run in parallel (independent domains)

### Implementation Notes
- Verify tool parameter schemas against current MCP server
- Update success indicators if tool behavior changed
- Preserve dependency chains (tier classification)

---

## Work Package 6: Update Tool Prompts (Extended Domains)

**ID**: WP06
**Priority**: P1
**Status**: Planned
**Prompt**: [WP06-update-prompts-extended-domains.md](./tasks/planned/WP06-update-prompts-extended-domains.md)

### Objective
Update eval prompts for remaining domains: mail, domain, certificate, user, context, conversation, cronjob, backup, ssh, sftp, stack, container, registry, volume (~76 tools total).

### Included Subtasks
- [ ] T018: Update mail/domain/certificate prompts (21 current tools)
- [ ] T019: Update user/context/conversation prompts (20 current tools)
- [ ] T020: Update cronjob/backup/ssh/sftp prompts (23 current tools)
- [ ] T021: Update stack/container/registry/volume prompts (10 current tools)

### Success Criteria
- 100% of 115 current tools have updated prompts
- All prompts follow v2.0.0 format
- Domain distribution matches current inventory

### Parallelization
- All 4 subtasks can run in parallel (independent domains)

### Dependencies
- WP05 completion (establishes update pattern)

---

## Work Package 7: Create New Tool Prompts & Validate

**ID**: WP07
**Priority**: P2
**Status**: Planned
**Prompt**: [WP07-create-validate-prompts.md](./tasks/planned/WP07-create-validate-prompts.md)

### Objective
Create prompts for any new tools not in feature 010 baseline, and spot-check unchanged prompts for accuracy.

### Included Subtasks
- [ ] T022: Identify new tools not in feature 010 baseline
- [ ] T023: Create prompts for new tools (if any)
- [ ] T024: Spot-check unchanged prompts for accuracy (sample 20% per domain)

### Success Criteria
- All new tools (if any) have prompts following v2.0.0 format
- Spot-check validation confirms existing prompts are accurate
- No orphaned prompts (tools that don't exist in current inventory)

### Parallelization
- T023 and T024 can run in parallel if new tools identified

### Implementation Notes
- Likely 0-5 new tools (most changes are removals/renames)
- Spot-check focuses on parameter accuracy and success indicators

---

## Work Package 8: Coverage Verification & Baseline

**ID**: WP08
**Priority**: P0 (Critical - success criteria validation)
**Status**: Planned
**Prompt**: [WP08-coverage-baseline.md](./tasks/planned/WP08-coverage-baseline.md)

### Objective
Generate coverage report, verify 100% of 115 tools have valid prompts, and establish post-012 baseline documentation.

### Included Subtasks
- [ ] T025: Generate tool inventory files (tools-current.json, tools-baseline.json)
- [ ] T026: Generate coverage report (115/115 tools, 100% coverage)
- [ ] T027: Update tier classification for 115 current tools
- [ ] T028: Create baseline documentation (post-012 reference point)

### Success Criteria
- Coverage report shows 100% (115/115 tools with prompts)
- No missing prompts identified
- Tier classification updated for current tool set
- Baseline documentation establishes "post-012 reference point"

### Dependencies
- WP01-WP07 completion (all prompts reconciled)

### Implementation Notes
- Coverage report should break down by domain and tier
- Baseline documentation links to feature 010 for historical context
- Tier classification may shift due to tool changes

---

## Work Package Summary

| WP | Title | Priority | Subtasks | Parallelizable | Status |
|----|-------|----------|----------|----------------|--------|
| WP01 | Tool Inventory & Diff Analysis | P0 | 4 | No | Planned |
| WP02 | Infrastructure & Template Updates | P0 | 4 | Partial (3/4) | Planned |
| WP03 | Archive Removed Prompts (Batch 1) | P1 | 3 | Full | Planned |
| WP04 | Archive Removed Prompts (Batch 2) | P1 | 2 | Full | Planned |
| WP05 | Update Prompts (Core Domains) | P0 | 4 | Partial (3/4) | Planned |
| WP06 | Update Prompts (Extended Domains) | P1 | 4 | Full | Planned |
| WP07 | Create New Prompts & Validate | P2 | 3 | Partial (2/3) | Planned |
| WP08 | Coverage Verification & Baseline | P0 | 4 | No | Planned |

**Total Subtasks**: 28
**Total Work Packages**: 8
**Parallelization Opportunities**: 19 subtasks (68%) can run in parallel

---

## Execution Recommendations

### MVP Scope (Minimum Viable Product)
**WP01 + WP02 + WP08** = Tool inventory established, infrastructure ready, baseline validated
- Provides foundational understanding of tool changes
- Enables future prompt reconciliation work
- Establishes success criteria verification

### Critical Path
**WP01 → WP02 → (WP03-WP07 in parallel) → WP08**
- WP01 must complete first (identifies what to archive/update/create)
- WP02 must complete before prompt work (templates ready)
- WP03-WP07 can overlap significantly (independent domain work)
- WP08 runs last (validates everything)

### Parallelization Strategy
- **Phase 1 (Sequential)**: WP01 → WP02
- **Phase 2 (Parallel)**: WP03 + WP04 + WP05 + WP06 + WP07
- **Phase 3 (Sequential)**: WP08

---

## Notes

- **No test generation**: Feature 013 is about documentation/reconciliation, not code changes
- **Agent execution**: Work packages designed for manual agent spawning via `/spec-kitty.implement`
- **Langfuse compatibility**: All outputs maintain feature 010's importable format
- **Post-012 baseline**: This feature establishes new reference point for future eval runs

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Initial task structure created | Claude |
