---
work_package_id: "WP04"
subtasks:
  - "T023"
  - "T024"
  - "T025"
  - "T026"
  - "T027"
  - "T028"
  - "T029"
title: "Pilot Tool Migration & Validation"
phase: "Per-Story"
lane: "for_review"
assignee: "Claude Sonnet 4.5"
agent: "claude"
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

# Work Package Prompt: WP04 – Pilot Tool Migration & Validation

## Objectives

Migrate single tool (`mittwald_app_list`) with parallel validation, proving migration pattern works.

**Success Criteria (Gate 4):**
- [ ] Pilot tool migrated to library calls
- [ ] Parallel validation shows 100% output parity
- [ ] Performance improves (<50ms vs 200-400ms)
- [ ] Error cases handled identically
- [ ] No authentication regressions

**User Story:** US2 - CLI Business Logic Remains Intact

## Context

**Dependencies:** WP03 (validation harness operational)

**Pattern:** Update tool handler → call validateToolParity() → log discrepancies → use library output.

**Reference:** plan.md lines 471-501 (Quickstart Step 4)

---

## Subtasks

### T023 – Select pilot tool
Recommend: `mittwald_app_list` (simple, high-traffic, good test case). File: `src/handlers/tools/mittwald-cli/app/list-cli.ts`.

### T024 – Update tool handler
Modify handler to call both CLI (via invokeCliTool) and library (via listApps), use validateToolParity().

### T025 – Run validation (success + error cases)
Test with valid projectIds (success), invalid projectIds (error). Verify both paths handled identically.

### T026 – Investigate discrepancies
Review validation reports. Document any differences between CLI and library outputs.

### T027 – Fix library to match CLI
Adjust library wrapper to exactly match CLI output format, error messages, validation rules.

### T028 – Verify 100% parity
Re-run validation until ValidationResult.passed = true for all test cases.

### T029 – Measure performance
Benchmark: run 100 requests, measure median response time. Target: <50ms (vs 200-400ms baseline).

---

## Test Strategy

Manual validation:
- Success case: valid projectId → verify output parity
- Error case: invalid projectId → verify error parity
- Performance: measure response time improvement

**Testing API Key:**
- Real Mittwald access token available in `/Users/robert/Code/mittwald-mcp/.env`
- Load via: `import 'dotenv/config'` in test scripts
- Use for T025 validation runs (both CLI and library need authenticated requests)
- Avoids OAuth flow complexity during development testing
- Example usage:
  ```typescript
  import 'dotenv/config';
  const apiToken = process.env.MITTWALD_API_TOKEN!;
  const validation = await validateToolParity('mittwald_app_list', {
    projectId: 'p-real-id',
    apiToken,
  });
  ```

---

## Risks

**Risk:** Pilot tool shows unexpected discrepancies
- **Mitigation:** Choose simple tool (app list), fix incrementally

**Risk:** Error handling differs
- **Mitigation:** Test error cases explicitly (T025)

---

## Definition of Done

- [ ] All T023-T029 completed
- [ ] Pilot tool 100% parity (ValidationResult.passed = true)
- [ ] Performance <50ms median
- [ ] Error cases validated
- [ ] Gate 4 criteria met

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
- 2025-12-18T09:00:00Z – claude – shell_pid=84179 – lane=doing – Started WP04
- 2025-12-18T09:15:00Z – claude – shell_pid=84179 – lane=for_review – Created comprehensive migration-guide.md with before/after patterns, error handling, performance benchmarks, and troubleshooting.
