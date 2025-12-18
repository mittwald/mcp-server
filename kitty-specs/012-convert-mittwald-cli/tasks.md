# Task Breakdown: Convert Mittwald CLI to Library

**Feature**: `012-convert-mittwald-cli`
**Created**: 2025-12-18
**Status**: Ready for Implementation

---

## Overview

This feature converts the Mittwald CLI from spawned processes to an importable library, fixing concurrent user failures and improving performance from 200-400ms to <50ms per request.

**Key Strategy:** Extract `src/lib/` business logic from `@mittwald/cli`, skip CLI command wrappers, create monorepo package at `packages/mittwald-cli-core/`. Use parallel validation (CLI spawn + library call) to ensure 100% output parity before cutover.

**Success Criteria:**
- 10 concurrent users, zero failures
- <50ms median response time
- Zero `mw` CLI processes spawned
- 100% output parity across all ~100 MCP tools

---

## Work Package Summary

| ID | Title | Priority | Subtasks | Dependencies |
|----|-------|----------|----------|--------------|
| WP01 | Library Package Extraction | P0 | T001-T008 | None |
| WP02 | Core Library Functions & Contracts | P0 | T009-T015 | WP01 |
| WP03 | Parallel Validation Harness | P0 | T016-T022 | WP02 |
| WP04 | Pilot Tool Migration & Validation | P0 | T023-T029 | WP03 |
| WP05 | Batch Tool Migration | P0 | T030-T035 | WP04 |
| WP06 | CLI Removal & Cleanup | P0 | T036-T041 | WP05 |
| WP07 | Production Deployment & Validation | P0 | T042-T048 | WP06 |

---

## Setup Work Packages

*No setup work packages required - CLI already cloned at `~/Code/mittwald-cli`*

---

## Foundational Work Packages

### WP01: Library Package Extraction
**Goal:** Extract `src/lib/` business logic from Mittwald CLI into monorepo package
**Priority:** P0 - Foundational (blocks all other work)
**Gate:** Gate 1 - Library Package Extraction Complete
**Prompt:** `WP01-library-package-extraction.md`

**Included Subtasks:**
- [x] T001: Create package directory structure at `packages/mittwald-cli-core/`
- [x] T002: Copy `~/Code/mittwald-cli/src/lib/` to `packages/mittwald-cli-core/src/lib/`
- [x] T003: [P] Identify installer instances in CLI command files (app/create/*, app/install/*)
- [x] T004: Extract installer instances to `packages/mittwald-cli-core/src/installers/`
- [x] T005: Update import paths in lib files (remove references to commands/)
- [x] T006: Create package.json with dependencies (@mittwald/api-client, date-fns, semver, chalk)
- [x] T007: Create tsconfig.json for TypeScript build configuration
- [x] T008: Build package and verify no TypeScript errors

**Implementation Sketch:**
1. Create directory structure (`packages/mittwald-cli-core/src/{lib,installers}`)
2. Copy lib directory entirely
3. Scan `~/Code/mittwald-cli/src/commands/` for installer exports (grep for "new AppInstaller")
4. Move installer instances (e.g., `phpInstaller`, `wordpressInstaller`) to installers/
5. Update imports in lib files that referenced commands/ (e.g., `custom_installation.ts`)
6. Configure package.json with name `@mittwald-mcp/cli-core`, set exports
7. Configure tsconfig.json (target ES2022, moduleResolution node16, strict mode)
8. Run `npm run build`, fix any missing dependencies or import errors

**Parallel Opportunities:**
- T003 (identify installers) can run in parallel with T001-T002 (directory setup)

**Dependencies:** None

**Risks:**
- Circular import issues if installer extraction incomplete
- Missing dependencies causing build failures
- Mitigation: Thorough scan of lib/ for command/ imports before build

---

### WP02: Core Library Functions & Contracts
**Goal:** Create library function wrappers and TypeScript contracts
**Priority:** P0 - Foundational (enables tool migration)
**Gate:** Gate 2 - Wrapper Functions Implemented
**Prompt:** `WP02-core-library-functions.md`

**Included Subtasks:**
- [x] T009: Create contract interfaces (`packages/mittwald-cli-core/src/contracts/functions.ts`)
- [x] T010: Implement LibraryFunctionBase, LibraryResult, LibraryError types
- [x] T011: [P] Create wrapper function for `app list` (pilot implementation)
- [x] T012: [P] Create wrapper function for `project list`
- [x] T013: [P] Create wrapper function for `database mysql list`
- [x] T014: Verify token authentication flow (token → API client creation)
- [x] T015: Verify abort signal propagation to API calls

**Implementation Sketch:**
1. Define base contracts (LibraryFunctionBase with apiToken + signal)
2. Define result wrapper (LibraryResult<T> with data, status, durationMs)
3. Define error class (LibraryError with code, message, details)
4. Implement `listApps()` wrapper:
   - Create MittwaldAPIV2Client.newWithToken(apiToken)
   - Call client.app.listAppinstallations()
   - Use lib helpers (getAppFromUuid) to enrich data
   - Return LibraryResult
5. Repeat pattern for `listProjects()` and `listMysqlDatabases()`
6. Test token flow: verify API client authenticated correctly
7. Test abort signal: verify API calls cancelled when signal fires

**Parallel Opportunities:**
- T011-T013 (wrapper functions) can be implemented in parallel per function

**Dependencies:** WP01 (needs library package built)

**Risks:**
- Token authentication mismatch between CLI and library
- Abort signal not properly propagating
- Mitigation: Test with real tokens early, verify signal cancellation

---

### WP03: Parallel Validation Harness
**Goal:** Build validation infrastructure to compare CLI vs library outputs
**Priority:** P0 - Critical for quality (gates cutover)
**Gate:** Gate 3 - Parallel Validation Harness Operational
**Prompt:** `WP03-parallel-validation-harness.md`

**Included Subtasks:**
- [x] T016: Create validation types (`tests/validation/types.ts`)
- [x] T017: Implement `validateToolParity()` function
- [x] T018: Implement CLI invocation wrapper (reuse existing invokeCliTool)
- [x] T019: Implement library invocation wrapper
- [x] T020: Implement output comparison logic (deep object diff)
- [x] T021: Implement validation report generation (JSON + human-readable)
- [x] T022: Create `npm run test:validation` script

**Implementation Sketch:**
1. Define ValidationResult interface (toolName, passed, cliOutput, libraryOutput, discrepancies)
2. Implement `validateToolParity(toolName, params)`:
   - Execute via invokeCliTool (existing CLI spawn)
   - Execute via library wrapper function
   - Parse CLI stdout as JSON
   - Deep compare library result vs CLI result
   - Identify discrepancies (field-level diff)
   - Return ValidationResult
3. Implement diff algorithm (recursive object comparison, ignore timing fields)
4. Generate validation reports (console output + JSON file)
5. Add npm script: `test:validation` runs validation suite

**Parallel Opportunities:**
- T017-T020 (implementation) largely sequential due to dependencies

**Dependencies:** WP02 (needs library wrapper functions)

**Risks:**
- Diff algorithm too strict (false positives on inconsequential differences)
- Timing fields causing spurious failures
- Mitigation: Whitelist timing fields to ignore, focus on data structure parity

---

## Per-Story Work Packages

### WP04: Pilot Tool Migration & Validation
**Goal:** Migrate single tool (`mittwald_app_list`) with parallel validation
**Priority:** P0 - Proves approach (User Story 2: CLI Business Logic Intact)
**Gate:** Gate 4 - Pilot Tool Validated (100% Parity)
**Prompt:** `WP04-pilot-tool-migration.md`

**Included Subtasks:**
- [x] T023: Select pilot tool (`mittwald_app_list` recommended)
- [x] T024: Update tool handler to call both CLI and library
- [x] T025: Run validation on pilot tool (success + error cases)
- [x] T026: Investigate discrepancies (if any)
- [x] T027: Fix library implementation to match CLI exactly
- [x] T028: Verify 100% output parity achieved
- [x] T029: Measure performance improvement (response time CLI vs library)

**Implementation Sketch:**
1. Choose `mittwald_app_list` (simple, high-traffic, good pilot)
2. Modify `src/handlers/tools/mittwald-cli/app/list-cli.ts`:
   - Import library wrapper `listApps()`
   - Call `validateToolParity('mittwald_app_list', { projectId, apiToken })`
   - Log validation result
   - Return library output (validated)
3. Run validation with various projectIds (success cases)
4. Run validation with invalid projectId (error case)
5. Check validation reports for discrepancies
6. Fix library if differences found (e.g., error message formatting)
7. Re-run until 100% parity
8. Benchmark: measure response time (baseline CLI: 200-400ms, target library: <50ms)

**Parallel Opportunities:**
- T025 (validation runs) can test multiple scenarios in parallel

**Dependencies:** WP03 (needs validation harness)

**Risks:**
- Pilot tool shows unexpected discrepancies
- Error handling differs between CLI and library
- Mitigation: Choose well-tested simple tool for pilot

---

### WP05: Batch Tool Migration
**Goal:** Migrate all ~100 MCP tools to library calls with validation
**Priority:** P0 - Core feature (User Story 1: Concurrent Users)
**Gate:** Gate 5 - All Tools Validated
**Prompt:** `WP05-batch-tool-migration.md`

**Included Subtasks:**
- [x] T030: Inventory all MCP tools (`src/handlers/tools/mittwald-cli/**/*.ts`)
- [x] T031: [P] Migrate app tools (app/*, ~25 tools)
- [x] T032: [P] Migrate project/org tools (project/*, org/*, ~20 tools)
- [x] T033: [P] Migrate database tools (database/*, ~25 tools)
- [x] T034: [P] Migrate infrastructure tools (container/*, backup/*, ~30 tools)
- [x] T035: Run full validation suite across all tools

**Implementation Sketch:**
1. Generate tool inventory (count tools in handlers/tools/mittwald-cli/)
2. For each tool category (parallelizable):
   - Create library wrapper functions for tool commands
   - Update tool handlers to use parallel validation pattern
   - Ensure library functions accept apiToken from session
3. Batch validation:
   - Run `npm run test:validation` against all tools
   - Generate consolidated validation report
   - Flag any tools with parity failures
4. Fix failures incrementally (update library wrappers)
5. Re-run validation until 100% pass rate

**Parallel Opportunities:**
- T031-T034 (tool category migration) fully parallelizable by category
- Different tool categories can be worked on concurrently

**Dependencies:** WP04 (proven migration pattern from pilot)

**Risks:**
- Some tools have complex multi-step workflows hard to replicate
- Error handling edge cases differ across tools
- Mitigation: Leverage pilot pattern, fix category by category

---

## Polish Work Packages

### WP06: CLI Removal & Cleanup
**Goal:** Remove all CLI spawning infrastructure after validation passes
**Priority:** P0 - Complete migration (User Story 3: Tool Signatures Unchanged)
**Gate:** Gate 6 - CLI Spawning Removed
**Prompt:** `WP06-cli-removal-cleanup.md`

**Included Subtasks:**
- [x] T036: Remove parallel validation code from tool handlers
- [x] T037: Update tool handlers to use library-only calls
- [x] T038: Delete `src/utils/cli-wrapper.ts`
- [x] T039: Delete `src/tools/cli-adapter.ts`
- [x] T040: Remove child_process imports across codebase
- [x] T041: Run test suite to verify zero CLI dependencies remain

**Implementation Sketch:**
1. Update all tool handlers:
   - Remove `validateToolParity()` calls
   - Call library functions directly (no CLI comparison)
   - Keep same return format (LibraryResult → MCP response)
2. Delete CLI spawning files:
   - `src/utils/cli-wrapper.ts` (spawn logic)
   - `src/tools/cli-adapter.ts` (CLI adapter)
   - `src/utils/session-aware-cli.ts` (if CLI-specific)
3. Search codebase for `child_process` imports (`grep -r "from 'child_process'"`)
4. Remove any remaining CLI-related code
5. Run existing test suite (`npm test`)
6. Verify tests pass without CLI binary in PATH

**Parallel Opportunities:**
- T036-T037 (handler updates) can be done per tool category in parallel

**Dependencies:** WP05 (all tools validated)

**Risks:**
- Tests fail after CLI removal (unexpected dependencies)
- Mitigation: Thorough grep for CLI references before removal

---

### WP07: Production Deployment & Validation
**Goal:** Deploy to production, validate concurrency and performance
**Priority:** P0 - Go-live (User Story 1 & 5: Concurrent Users, Performance)
**Gate:** Gate 7 - Production Validation
**Prompt:** `WP07-production-deployment.md`

**Included Subtasks:**
- [x] T042: Update root package.json workspace dependencies
- [x] T043: Build library package for production
- [x] T044: Commit changes to `main` branch (triggers GitHub Actions deploy)
- [x] T045: Monitor deployment to `mittwald-mcp-fly2` (gh run watch)
- [x] T046: Run concurrency test (10 concurrent users, different tools)
- [x] T047: Measure response time (<50ms median target)
- [x] T048: Verify zero process spawning (monitor metrics)

**Implementation Sketch:**
1. Update workspace config:
   - Add `packages/mittwald-cli-core` to workspace in root package.json
   - Run `npm install` to link workspace dependencies
2. Build library for production:
   - `cd packages/mittwald-cli-core && npm run build`
   - Verify dist/ output ready for deployment
3. Commit and push to main:
   - Triggers `.github/workflows/deploy-fly.yml`
   - Wait for GitHub Actions to complete
4. Monitor deployment:
   - `gh run list --limit 5` (check status)
   - `gh run watch` (watch active deployment)
   - `flyctl logs -a mittwald-mcp-fly2` (verify startup)
5. Concurrency testing:
   - Script: spawn 10 parallel MCP requests (mix of tools)
   - Verify all complete successfully (zero failures)
   - Check for process spawning in logs (should be zero `mw` processes)
6. Performance benchmarking:
   - Run 100 requests to `mittwald_project_list`
   - Calculate median response time (target: <50ms)
7. Production validation:
   - Verify authentication still works (OAuth flow unchanged)
   - Verify tool signatures unchanged (existing clients work)

**Parallel Opportunities:**
- T046-T048 (testing) can run concurrently

**Dependencies:** WP06 (CLI removed)

**Risks:**
- Production deployment fails (build errors, dependency issues)
- Concurrency issues emerge only in production
- Mitigation: Staging environment recommended, rollback plan ready

---

## Test Strategy

**No automated testing explicitly requested in spec.**

Manual validation via:
- Parallel validation harness (WP03) - compares CLI vs library outputs
- Pilot tool validation (WP04) - proves migration pattern works
- Batch validation (WP05) - ensures all tools maintain parity
- Production validation (WP07) - confirms concurrency and performance targets

**Validation checkpoints:**
- Gate 4: Pilot tool 100% parity
- Gate 5: All tools 100% parity
- Gate 7: Production concurrency (10 users) + performance (<50ms)

---

## MVP Scope

**Recommended MVP:** WP01 → WP02 → WP03 → WP04

Delivers:
- Library package extracted and buildable
- Core wrapper functions implemented
- Validation harness operational
- Single pilot tool migrated with proven parity

**Value:** Proves feasibility, validates approach, unblocks batch migration

**Next iteration:** WP05 (batch migration) → WP06 (cleanup) → WP07 (production)

---

## Implementation Sequence

```
Setup: [None required]
  ↓
Foundational: WP01 → WP02 → WP03
  ↓
Per-Story: WP04 (pilot) → WP05 (batch)
  ↓
Polish: WP06 (cleanup) → WP07 (production)
```

**Critical path:** All work packages are sequential (each gate depends on previous)

**Estimated effort:**
- WP01-WP03: 2-3 days (foundational)
- WP04: 1 day (pilot validation)
- WP05: 3-5 days (batch migration ~100 tools)
- WP06: 1 day (cleanup)
- WP07: 1 day (deployment + validation)

**Total:** ~8-12 days for complete migration

---

## Dependencies Graph

```
WP01 (Extract Library)
  ↓
WP02 (Wrapper Functions)
  ↓
WP03 (Validation Harness)
  ↓
WP04 (Pilot Tool) ─────> [Validation Pattern Proven]
  ↓
WP05 (Batch Migration) ─> [All Tools Validated]
  ↓
WP06 (CLI Removal) ─────> [Library-Only Code]
  ↓
WP07 (Production) ──────> [Go-Live]
```

**No parallel work packages** - each depends on previous gate passing

---

## Risk Summary

| Risk | Probability | Impact | Mitigation | Work Package |
|------|-------------|--------|------------|--------------|
| Output parity failures | Medium | High | Parallel validation catches early | WP03, WP04 |
| Performance regression | Low | Medium | Benchmark in pilot (WP04) | WP04, WP07 |
| Token flow issues | Low | Medium | Test early in pilot | WP04 |
| Circular import errors | Medium | Medium | Thorough installer extraction | WP01 |
| Production concurrency bugs | Low | High | Staging validation recommended | WP07 |

---

## Definition of Done

**Feature Complete When:**
- [ ] All 7 work packages completed (WP01-WP07)
- [ ] All 48 subtasks completed (T001-T048)
- [ ] All 7 evaluation gates passed
- [ ] Success criteria met:
  - [ ] SC-001: 10 concurrent users, zero failures (WP07)
  - [ ] SC-002: Tools function identically (WP05)
  - [ ] SC-003: Zero CLI processes (WP06, WP07)
  - [ ] SC-004: <50ms response time (WP07)
  - [ ] SC-005: 1000 req/sec throughput (WP07)
  - [ ] SC-006: Auth layer unchanged (WP04, WP07)
  - [ ] SC-007: Tool signatures unchanged (WP06, WP07)
  - [ ] SC-008: 100% tool coverage (WP05)
- [ ] Production deployed and validated (WP07)
- [ ] No rollback required

---

**Next Step:** Begin implementation with WP01 (Library Package Extraction)

**Command:** `/spec-kitty.implement` to start execution
