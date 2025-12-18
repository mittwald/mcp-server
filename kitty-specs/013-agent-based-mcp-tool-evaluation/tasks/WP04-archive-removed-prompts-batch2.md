---
work_package_id: WP04
title: Archive Removed Tool Prompts (Batch 2)
lane: planned
priority: P1
history:
- date: 2025-12-18
  action: created
  agent: Claude
subtasks:
- T012
- T013
---

# Work Package 04: Archive Removed Tool Prompts (Batch 2)

## Objective

Archive remaining removed tool prompts in identity/organization/project/container domains (~22 tools from the 60 total removed).

## Subtask Guidance

### T012: Archive Removed identity/organization Tool Prompts (~12 tools)

**Steps**: Same pattern as WP03
- Archive identity (user) tools to: `evals/prompts/_archived/user/` or `_archived/identity/`
- Archive organization tools to: `evals/prompts/_archived/organization/`
- Add archive metadata

---

### T013: Archive Removed project/container Tool Prompts (~10 tools)

**Steps**: Same pattern as WP03
- Archive project tools to: `evals/prompts/_archived/project/`
- Archive container tools to: `evals/prompts/_archived/container/`
- Add archive metadata

---

## Definition of Done

- [ ] ~22 prompt files archived
- [ ] Total archived across WP03+WP04: ~60 prompts
- [ ] All removed tool prompts accounted for

## Parallelization

Both subtasks fully parallelizable

## Dependencies

WP03 establishes archive pattern

## Verification

Total `_archived/` files = ~60 (matches removed tool count from WP01)
