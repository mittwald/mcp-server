---
work_package_id: "WP03"
subtasks:
  - "T016"
  - "T017"
  - "T018"
  - "T019"
  - "T020"
  - "T021"
  - "T022"
title: "Parallel Validation Harness"
phase: "Foundational"
lane: "done"
assignee: "Claude Sonnet 4.5"
agent: "codex"
shell_pid: "84179"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-18T06:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP03 – Parallel Validation Harness

## Objectives

Build validation infrastructure to compare CLI spawn vs library outputs, ensuring 100% parity before cutover.

**Success Criteria (Gate 3):**
- [ ] validateToolParity() function implemented
- [ ] CLI + library invocations working
- [ ] Output diff generation accurate
- [ ] Validation report (JSON + human-readable)
- [ ] npm run test:validation script

## Context

**Dependencies:** WP02 (library wrappers exist)

**Strategy:** Run same operation via CLI spawn AND library, deep compare outputs, log discrepancies.

**Reference:** plan.md lines 223-240 (Testing Strategy Research), 363-394 (Parallel Validation Interface)

---

## Subtasks

### T016 – Create validation types
File: `tests/validation/types.ts`. Define ValidationResult per plan.md lines 368-388.

### T017 – Implement validateToolParity()
Core function: execute CLI spawn + library call, compare outputs. Return ValidationResult with discrepancies.

### T018 – CLI invocation wrapper
Reuse existing `invokeCliTool()` from `src/tools/cli-adapter.ts`. Parse JSON stdout.

### T019 – Library invocation wrapper
Call library wrapper functions, capture result, convert to comparable format.

### T020 – Output comparison logic
Deep object diff (recursive). Ignore timing fields (durationMs). Identify field-level discrepancies.

### T021 – Validation report generation
Console output + JSON file. Format: tool name, passed/failed, discrepancy list.

### T022 – Create npm script
Add to package.json: `"test:validation": "tsx tests/validation/run-validation.ts"`

---

## Test Strategy

Manual testing:
- Run validation on WP02 wrapper functions
- Verify discrepancies detected for intentional differences
- Verify parity when outputs match

**Testing API Key:**
- Real Mittwald access token available in `/Users/robert/Code/mittwald-mcp/.env`
- Load via: `import 'dotenv/config'` at top of validation scripts
- Use for both CLI spawn (--token flag) and library calls (apiToken param)
- Ensures real API responses, not mocked data

---

## Risks

**Risk:** Diff algorithm too strict (false positives)
- **Mitigation:** Whitelist timing fields, focus on data structure

**Risk:** CLI output format changes
- **Mitigation:** Test with multiple CLI output formats (JSON, errors)

---

## Definition of Done

- [ ] All T016-T022 completed
- [ ] validateToolParity() returns accurate results
- [ ] Validation reports generated
- [ ] npm run test:validation works
- [ ] Gate 3 criteria met

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
- 2025-12-18T08:40:00Z – claude – shell_pid=84179 – lane=doing – Started WP03 implementation
- 2025-12-18T08:50:00Z – claude – shell_pid=84179 – lane=for_review – Completed T016-T022. Created validation types, parallel-validator with deep comparison, test runner, npm script.
- 2025-12-18T14:12:29Z – codex – shell_pid=84179 – lane=done – Smoke-check only; no blocking issues found. User requested closure.
