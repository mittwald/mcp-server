---
work_package_id: WP08
title: Coverage Verification & Baseline
subtasks:
  - T025
  - T026
  - T027
  - T028
priority: P0
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 08: Coverage Verification & Baseline

## Objective

Generate coverage report, verify 100% of 115 tools have valid prompts, update tier classification, and establish post-012 baseline documentation.

## Context

This is the final validation work package. All reconciliation work (WP03-WP07) must complete before this runs.

## Subtask Guidance

### T025: Generate Tool Inventory Files

**Steps**:
1. Copy/finalize `evals/inventory/tools-current.json` from WP01 (115 tools)
2. Create `evals/inventory/tools-baseline.json` by documenting feature 010 state:
   ```json
   {
     "captureDate": "2025-12-16",
     "featureContext": "010-langfuse-mcp-eval",
     "toolCount": 175,
     "domainCount": 10,
     "tools": [...]
   }
   ```
3. Ensure both files are complete and cross-referenced in diff report

**Verification**: Both inventory files present and accurate

---

### T026: Generate Coverage Report

**Steps**:
1. Scan `evals/prompts/` directory (excluding `_archived/`)
2. Count prompt files per domain
3. Compare against tools-current.json (115 tools)
4. Generate coverage report:

```json
{
  "generatedAt": "2025-12-18T...",
  "totalTools": 115,
  "toolsWithPrompts": 115,
  "coveragePercent": 100,
  "byDomain": [
    {"domain": "app", "totalTools": 8, "promptsExist": 8, "coveragePercent": 100},
    {"domain": "database", "totalTools": 14, "promptsExist": 14, "coveragePercent": 100},
    ...
  ],
  "byTier": [
    {"tier": 0, "totalTools": 15, "promptsExist": 15, "coveragePercent": 100},
    ...
  ],
  "missingPrompts": [],
  "archivedPrompts": 60
}
```

5. Save to: `evals/results/coverage-report.json`

**Success criteria**:
- coveragePercent = 100
- missingPrompts = []
- archivedPrompts = ~60

---

### T027: Update Tier Classification

**Steps**:
1. Review tier classification from feature 010 (Tier 0-4 model)
2. For each of the 115 current tools, assign tier:
   - Tier 0: No dependencies (user/get, org/list, server/list, context/*)
   - Tier 1: Organization-level (org/invite, org/membership-*)
   - Tier 2: Server-level (server/get)
   - Tier 3: Project creation (project/create, project/list)
   - Tier 4: Requires project (app/*, database/*, cronjob/*, etc.)
3. Update metadata in prompt files with correct tier
4. Generate tier analysis summary:

```markdown
## Tier Classification (115 Tools)

| Tier | Description | Tool Count | Examples |
|------|-------------|------------|----------|
| 0 | No dependencies | 15 | user/get, org/list, context/get-session |
| 1 | Organization-level | 10 | org/invite, org/membership-list |
| 2 | Server-level | 2 | server/get |
| 3 | Project creation | 5 | project/create, project/list |
| 4 | Requires project | 83 | app/*, database/*, cronjob/*, backup/*, etc. |

**Total**: 115 tools
```

5. Save to: `evals/inventory/tier-analysis.md`

**Verification**: All 115 tools have tier assignments

---

### T028: Create Baseline Documentation

**Steps**:
1. Create `evals/results/baseline-report.md` summarizing feature 013 deliverables:

```markdown
# Post-012 Baseline Report

**Feature**: 013-agent-based-mcp-tool-evaluation
**Date**: 2025-12-18
**Status**: Complete

## Summary

Feature 013 reconciled the eval suite with the post-012 MCP server architecture.

### Key Metrics
- **Current tool count**: 115 (down from 175 in feature 010)
- **Prompt coverage**: 100% (115/115 tools)
- **Archived prompts**: 60 (removed tools)
- **Domain count**: 19 (up from 10 in feature 010)
- **Eval format version**: 2.0.0

### Changes from Feature 010
- 60 tools removed (CLI-to-library conversion, feature 012)
- 0-5 tools renamed/consolidated
- 0-5 new tools added
- All prompts updated to v2.0.0 format with "CALL tool directly" emphasis

### Established Baseline
This feature establishes the "post-012 baseline" for future MCP server validation.

### Historical Context
- **Feature 010**: Original eval suite (175 tools, CLI spawning architecture)
- **Feature 012**: CLI-to-library conversion (reduced tool count)
- **Feature 013**: Eval suite reconciliation (current baseline)

## Next Steps
- Execute evals by spawning agents with eval prompts
- Collect self-assessments from session logs
- Generate success rate report (target: 95%+)
- Iteratively fix bugs discovered during execution
```

2. Link baseline report from research.md and plan.md
3. Update CLAUDE.md with feature 013 completion status

**Verification**: Baseline clearly documents post-012 state

---

## Definition of Done

- [ ] Tool inventory files generated (current + baseline)
- [ ] Coverage report shows 100% (115/115 tools)
- [ ] Tier classification updated for all 115 tools
- [ ] Baseline documentation establishes post-012 reference point
- [ ] All success criteria from spec.md validated

## Dependencies

- WP01-WP07 completion (all reconciliation work done)

## Success Indicators

- Coverage report shows 100% coverage
- No missing prompts identified
- Tier analysis accounts for all 115 tools
- Baseline documentation is comprehensive

## Reviewer Guidance

Final validation checklist:
1. Count files in `evals/prompts/` (excluding `_archived/`) = 115
2. Count files in `evals/prompts/_archived/` = ~60
3. Coverage report shows 100% across all domains
4. Baseline report accurately summarizes feature deliverables
