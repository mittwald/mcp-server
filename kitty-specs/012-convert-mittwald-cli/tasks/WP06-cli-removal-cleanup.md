---
work_package_id: "WP06"
subtasks:
  - "T036"
  - "T037"
  - "T038"
  - "T039"
  - "T040"
  - "T041"
title: "CLI Removal & Cleanup"
phase: "Polish"
lane: "for_review"
assignee: ""
agent: "claude"
shell_pid: "57224"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-18T06:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP06 – CLI Removal & Cleanup

## ⚠️ CRITICAL: READ HANDOFF FIRST!

**🎯 [WP06-HANDOFF.md](./WP06-HANDOFF.md) ← START HERE**

This handoff document explains critical differences from the original plan:
- Only 125/171 tools migrated (not all)
- 46 tools intentionally unmigrated (with detailed reasoning)
- 6 migrated tools have placeholder functions (keep CLI code)
- Context system improvements (auto-population)
- Library API corrections (different method names than expected)

**DO NOT proceed without reading the handoff document!**

---

## Objectives

Remove parallel validation code from **119 cleanable tools** and simplify to library-only calls.

**Success Criteria (Gate 6) - UPDATED:**
- [ ] Parallel validation code removed from 119 cleanable tools
- [ ] Those 119 tools use library-only calls (no CLI fallback)
- [ ] Validation infrastructure deleted or deprecated
- [ ] CLI wrapper **KEPT** (still needed by 52 tools)
- [ ] Build passes with 0 TypeScript errors
- [ ] 119 tools verified library-only (spot testing)

**User Story:** US3 - Tool Signatures Remain Unchanged

## Context

**Dependencies:** WP05 (125 tools migrated, 46 unmigrated)

**Strategy:** Remove validation harness from migrated tools, keep CLI spawning for unmigrated tools.

**Scope Change**: Originally planned to remove ALL CLI infrastructure. Now only removing validation code while keeping CLI utilities for 52 tools (46 unmigrated + 6 placeholders).

---

## Subtasks - UPDATED

### T036 – Remove validation code from 119 cleanable handlers
Update 119 tool handlers (migrated tools - 6 placeholder functions): remove validateToolParity() calls, call library functions directly.

**SKIP these 6 tools** (library functions throw errors):
- container: stop, start, restart, delete
- volume: create
- conversation: close

### T037 – Update 119 handlers to library-only
Ensure handlers return LibraryResult → MCP response format. No CLI comparison.

**PRESERVE** session refresh calls in project/create-cli.ts and project/delete-cli.ts (not validation code!)

### T038 – Delete validation infrastructure (MODIFIED)
Remove `tests/validation/parallel-validator.ts` and `tests/validation/types.ts`.

**DO NOT delete** `src/utils/cli-wrapper.ts` or `src/tools/cli-adapter.ts` - still needed by 52 tools!

### T039 – Update tsconfig.json (NEW)
Remove `tests/**/*` from includes if validation tests are deleted.

### T040 – Remove child_process imports from cleaned tools
Search cleaned tools only: `grep -r "from 'child_process'" src/handlers/tools/mittwald-cli/` and remove from migrated tools.

**KEEP** child_process in CLI wrapper utilities (still needed by unmigrated tools).

### T041 – Run test suite
Execute `npm test`. Verify tests pass. Note: 52 tools still spawn CLI (expected).

---

## Test Strategy

Test suite verification:
- Run `npm test` after cleanup
- Verify zero CLI dependencies
- Confirm no spawn/exec calls

---

## Risks

**Risk:** Tests fail after CLI removal
- **Mitigation:** Thorough grep for CLI references before deletion

---

## Definition of Done

- [ ] All T036-T041 completed
- [ ] Validation code removed
- [ ] CLI files deleted
- [ ] child_process imports removed
- [ ] Tests pass
- [ ] Gate 6 criteria met

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
- 2025-12-18T13:26:01Z – claude – shell_pid=57224 – lane=doing – Started WP06 implementation - CLI removal and cleanup
- 2025-12-18T14:35:02Z – claude – shell_pid=57224 – lane=for_review – Completed WP06 - 119 tools cleaned, build passes, 6 placeholder tools kept
