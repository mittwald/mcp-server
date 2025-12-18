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
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
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

## Objectives

Remove all CLI spawning infrastructure after validation passes.

**Success Criteria (Gate 6):**
- [ ] Parallel validation code removed
- [ ] Tool handlers use library-only calls
- [ ] cli-wrapper.ts, cli-adapter.ts deleted
- [ ] child_process imports removed
- [ ] Tests pass without CLI binary

**User Story:** US3 - Tool Signatures Remain Unchanged

## Context

**Dependencies:** WP05 (all tools validated)

**Strategy:** Remove validation harness, delete spawning files, verify tests pass.

---

## Subtasks

### T036 – Remove validation code from handlers
Update all tool handlers: remove validateToolParity() calls, call library functions directly.

### T037 – Update handlers to library-only
Ensure handlers return LibraryResult → MCP response format. No CLI comparison.

### T038 – Delete cli-wrapper.ts
Remove `src/utils/cli-wrapper.ts` (spawn logic, semaphore, queuing).

### T039 – Delete cli-adapter.ts
Remove `src/tools/cli-adapter.ts` (CLI adapter pattern).

### T040 – Remove child_process imports
Search: `grep -r "from 'child_process'" src/`. Delete all CLI-related imports.

### T041 – Run test suite
Execute `npm test`. Verify tests pass without CLI binary in PATH. No process spawning.

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
