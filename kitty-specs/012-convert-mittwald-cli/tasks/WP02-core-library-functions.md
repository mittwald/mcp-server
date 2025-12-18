---
work_package_id: "WP02"
subtasks:
  - "T009"
  - "T010"
  - "T011"
  - "T012"
  - "T013"
  - "T014"
  - "T015"
title: "Core Library Functions & Contracts"
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

# Work Package Prompt: WP02 – Core Library Functions & Contracts

## Objectives & Success Criteria

Create library function wrappers and TypeScript contracts for top 10 most-used MCP tools.

**Success Criteria (Gate 2):**
- [ ] Contract interfaces defined (LibraryFunctionBase, LibraryResult, LibraryError)
- [ ] Wrapper functions for: app list, project list, database mysql list
- [ ] Token authentication flow verified
- [ ] Abort signal propagation verified
- [ ] Functions compile and match contract signatures

## Context & Constraints

**Dependencies:** WP01 complete (library package built)

**Pattern:** Library functions wrap lib utilities, accept apiToken, return LibraryResult<T>

**Key Files:**
- `packages/mittwald-cli-core/src/contracts/functions.ts` (contracts)
- `packages/mittwald-cli-core/src/index.ts` (wrapper exports)
- Plan reference: Phase 1 Design & Contracts (plan.md lines 243-316)

---

## Subtasks & Detailed Guidance

### T009 – Create contract interfaces
Create `packages/mittwald-cli-core/src/contracts/functions.ts` with base types per plan.md lines 323-361.

### T010 – Implement base types
Define LibraryFunctionBase (apiToken, signal), LibraryResult<T> (data, status, durationMs), LibraryError (code, message, details).

### T011 – Create `listApps()` wrapper [P]
Implement per plan.md lines 437-469. Use lib utilities `getAppFromUuid`, `getAppVersionFromUuid` to enrich API response.

### T012 – Create `listProjects()` wrapper [P]
Follow listApps pattern for project listing. Call `client.project.listProjects()`, map response.

### T013 – Create `listMysqlDatabases()` wrapper [P]
Follow listApps pattern for database listing. Call `client.database.listDatabases()`, filter MySQL.

### T014 – Verify token authentication
Test: Create client with token, verify API calls authenticate correctly. Catch auth errors, return LibraryError.

### T015 – Verify abort signal propagation
Test: Pass AbortSignal to wrapper, trigger abort, verify API call cancels. Ensure signal propagates to underlying API client.

---

## Test Strategy

Manual testing only:
- Token test: Use real Mittwald token, verify API success
- Abort test: Create AbortController, call wrapper, abort mid-flight, verify cancellation

**Testing API Key:**
- Real Mittwald access token available in `/Users/robert/Code/mittwald-mcp/.env`
- Load via: `import 'dotenv/config'` or `process.env.MITTWALD_API_TOKEN`
- Use this for T014 (token authentication) and T015 (abort signal) testing
- Avoids need to mock OAuth or spawn CLI for test validation

---

## Risks & Mitigations

**Risk:** Token format incompatible with API client
- **Mitigation:** Test with real token early (T014)

**Risk:** Abort signal not propagating
- **Mitigation:** Verify API client respects signal parameter

---

## Definition of Done Checklist

- [ ] All subtasks T009-T015 completed
- [ ] Contracts defined in contracts/functions.ts
- [ ] 3 wrapper functions implemented (listApps, listProjects, listMysqlDatabases)
- [ ] Token authentication verified with real token
- [ ] Abort signal propagation verified
- [ ] TypeScript builds without errors
- [ ] Gate 2 criteria met

---

## Review Guidance

Verify:
1. Wrapper functions return LibraryResult<T> matching contract
2. Error handling returns LibraryError with code/message
3. Token flows from options → API client creation
4. AbortSignal propagates to API calls

---

## Activity Log

- 2025-12-18T06:00:00Z – system – lane=planned – Prompt created
- 2025-12-18T08:20:00Z – claude – shell_pid=84179 – lane=doing – Started WP02 implementation
- 2025-12-18T08:35:00Z – claude – shell_pid=84179 – lane=for_review – Completed T009-T015. Created contracts and 3 wrapper functions (listApps, listProjects, listMysqlDatabases). Build successful.
- 2025-12-18T14:12:26Z – codex – shell_pid=84179 – lane=done – Smoke-check only; no blocking issues found. User requested closure.
