---
work_package_id: "WP05"
subtasks:
  - "T030"
  - "T031"
  - "T032"
  - "T033"
  - "T034"
  - "T035"
title: "Batch Tool Migration"
phase: "Per-Story"
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

# Work Package Prompt: WP05 – Batch Tool Migration

## Objectives

Migrate all ~100 MCP tools to library calls with validation.

**Success Criteria (Gate 5):**
- [ ] All ~100 tools migrated
- [ ] Validation report 100% parity across all tools
- [ ] Concurrency testing passes (10 concurrent users)
- [ ] Zero discrepancies in success/error cases

**User Story:** US1 - Multiple Users Can Use MCP Server Concurrently

## Context

**Dependencies:** WP04 (pilot pattern proven)

**Strategy:** Batch migrate by category (app, project, database, infrastructure), validate each batch.

**Tool Inventory:** `src/handlers/tools/mittwald-cli/**/*.ts` (~100 tools)

---

## Subtasks

### T030 – Inventory all MCP tools
Count tools: `find src/handlers/tools/mittwald-cli -name "*-cli.ts" | wc -l`. Group by category (app, project, database, etc.).

### T031 – Migrate app tools [P]
~25 tools in `app/*`. Create library wrappers, update handlers. Validate batch.

### T032 – Migrate project/org tools [P]
~20 tools in `project/*`, `org/*`. Follow pilot pattern. Validate batch.

### T033 – Migrate database tools [P]
~25 tools in `database/*`. Include mysql and redis. Validate batch.

### T034 – Migrate infrastructure tools [P]
~30 tools in `container/*`, `backup/*`, `cronjob/*`, etc. Validate batch.

### T035 – Run full validation suite
Execute `npm run test:validation` against all tools. Generate consolidated report. Fix failures incrementally.

---

## Parallel Opportunities

T031-T034 are fully parallelizable by category. Different tool categories can be migrated concurrently.

---

## Test Strategy

Per-category validation:
- Migrate category → validate category → fix → re-validate
- Full validation at T035 confirms all tools pass

**Testing API Key:**
- Real Mittwald access token available in `/Users/robert/Code/mittwald-mcp/.env`
- Load via: `import 'dotenv/config'` in validation scripts
- Use for batch validation runs (T031-T035)
- All ~100 tools require authenticated API calls
- Example batch validation:
  ```bash
  # Load .env, run validation per category
  MITTWALD_API_TOKEN=$(grep MITTWALD_API_TOKEN /Users/robert/Code/mittwald-mcp/.env | cut -d= -f2)
  npm run test:validation -- --category app --token "$MITTWALD_API_TOKEN"
  npm run test:validation -- --category project --token "$MITTWALD_API_TOKEN"
  # etc.
  ```

---

## Risks

**Risk:** Complex multi-step workflows hard to replicate
- **Mitigation:** Leverage pilot pattern, fix category by category

**Risk:** Error handling edge cases differ
- **Mitigation:** Test error cases per category

---

## Definition of Done

- [ ] All T030-T035 completed
- [ ] 100% tool coverage migrated
- [ ] Validation report: 100% pass rate
- [ ] Concurrency test: 10 users, zero failures
- [ ] Gate 5 criteria met

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
