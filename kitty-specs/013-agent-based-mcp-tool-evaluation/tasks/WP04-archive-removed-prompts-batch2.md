---
work_package_id: WP04
title: Archive Removed Tool Prompts (Batch 2)
lane: "done"
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

## Activity Log

- 2025-12-18T21:57:12Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T21:59:47Z – unknown – lane=for_review – Implementation complete. Archived 46 prompt files across 6 domains (access-users: 8, backups: 5, containers: 10, domains-mail: 4, organization: 11, project-foundation: 8). Combined with WP03 (56 files), total archived: 102 prompts. Note: 3 tools from removed list never had prompts created (context/*-session variants). All existing prompts for removed tools have been archived with metadata.
- 2025-12-18T22:01:27Z – unknown – lane=done – Review passed - 102 prompts archived (3 tools never had baseline prompts), all existing removed prompts archived correctly
