---
work_package_id: WP04
title: Manifest & Coverage Tracking
lane: done
history:
- timestamp: '2025-12-04T11:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T13:45:00Z'
  lane: doing
  agent: claude
  shell_pid: '72358'
  action: Started implementation
- timestamp: '2025-12-04T13:48:00Z'
  lane: for_review
  agent: claude
  shell_pid: '72358'
  action: Completed implementation - manifest.ts and coverage.ts with atomic append and coverage CLI
- timestamp: '2025-12-04T13:55:22Z'
  lane: planned
  agent: codex
  shell_pid: '90267'
  action: Returned for changes - coverage CLI must load tool inventory and DoD items remain unchecked
- timestamp: '2025-12-04T17:00:00Z'
  lane: for_review
  agent: claude
  shell_pid: '72358'
  action: Fixed T025 - coverage CLI now loads tool inventory via getKnownToolNames() and passes to getCoverage()
- timestamp: '2025-12-10T07:19:50Z'
  lane: done
  agent: claude-sonnet-4.5
  shell_pid: '73449'
  action: 'Code review complete: Implementation approved - all requirements met, feedback incorporated'
agent: claude-sonnet-4.5
assignee: claude
phase: Phase 2 - Core Features
review_status: approved without changes
reviewed_by: claude-sonnet-4.5
shell_pid: '73449'
subtasks:
- T021
- T022
- T023
- T024
- T025
- T026
---

# Work Package Prompt: WP04 – Manifest & Coverage Tracking

## Objectives & Success Criteria

- Implement append-only JSONL manifest for test results (FR-005)
- Support concurrent append operations without data loss (FR-005, SC-006)
- Provide coverage statistics querying (FR-020)

**Success Gate**: Multiple concurrent processes can append to manifest without corruption; coverage query returns accurate statistics.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-005, FR-018-020
  - `kitty-specs/005-mcp-functional-test/data-model.md` - ManifestEntry schema
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - IManifestManager
- **File Location**: `tests/functional/output/manifest.jsonl`
- **Concurrency**: Must handle 3-5 parallel test sessions appending simultaneously
- **Depends on**: WP01 (types)

## Subtasks & Detailed Guidance

### Subtask T021 – Implement manifest.ts atomic append

- **Purpose**: Create append-only JSONL file with atomic write guarantees.
- **Steps**:
  1. Create `src/harness/manifest.ts`
  2. Implement `append(entry: ManifestAppendOptions): Promise<void>`
  3. Use atomic append pattern:
     ```typescript
     import { appendFileSync, openSync, closeSync } from 'fs';

     function append(entry: ManifestAppendOptions): void {
       const line = JSON.stringify(entry) + '\n';
       const fd = openSync(MANIFEST_PATH, 'a');
       try {
         appendFileSync(fd, line);
       } finally {
         closeSync(fd);
       }
     }
     ```
  4. Create output directory if not exists
- **Files**: `tests/functional/src/harness/manifest.ts`
- **Parallel?**: No (foundation)
- **Notes**: JSONL = one JSON object per line, no array wrapper.

### Subtask T022 – Create ManifestEntry serialization

- **Purpose**: Ensure all manifest entries follow the defined schema.
- **Steps**:
  1. Implement serialization matching data-model.md:
     ```typescript
     interface ManifestEntry {
       toolName: string;
       sessionId: string;
       testId: string;
       status: 'passed' | 'failed' | 'timeout' | 'interrupted';
       timestamp: string;  // ISO 8601
       durationMs: number;
       toolCallCount: number;
       errorMessage?: string;
       domain: string;
       harnessVersion: string;
     }
     ```
  2. Add validation before append
  3. Generate timestamp using `new Date().toISOString()`
  4. Set `harnessVersion` from package.json
- **Files**: `tests/functional/src/harness/manifest.ts`
- **Parallel?**: No

### Subtask T023 – Implement getCoverage() statistics

- **Purpose**: Calculate and return coverage metrics (FR-020).
- **Steps**:
  1. Implement `getCoverage(): Promise<CoverageReport>`
  2. Read and parse entire manifest file
  3. Calculate statistics:
     ```typescript
     interface CoverageReport {
       totalTools: number;        // From tool inventory (~174)
       testedTools: number;       // Unique tools with any entry
       passedTools: number;       // Tools with latest status = passed
       failedTools: number;       // Tools with latest status = failed
       untestedTools: string[];   // Tools not in manifest
       coverage: number;          // (testedTools / totalTools) * 100
     }
     ```
  4. For each tool, use the LATEST entry (by timestamp) for status
- **Files**: `tests/functional/src/harness/manifest.ts`
- **Parallel?**: No
- **Notes**: Requires tool inventory to know total tools. Accept as parameter or inject dependency.

### Subtask T024 – Implement getToolHistory() query

- **Purpose**: Retrieve all test entries for a specific tool.
- **Steps**:
  1. Implement `getToolHistory(toolName: string): Promise<ManifestAppendOptions[]>`
  2. Read manifest, filter by toolName
  3. Return entries sorted by timestamp (oldest first)
  4. Handle empty results (tool never tested)
- **Files**: `tests/functional/src/harness/manifest.ts`
- **Parallel?**: No

### Subtask T025 – Create coverage CLI command

- **Purpose**: Allow operators to query coverage status from command line.
- **Steps**:
  1. Create `src/harness/coverage.ts` CLI entry point
  2. Parse command line args (--json for machine-readable output)
  3. Load tool inventory for total count
  4. Call getCoverage() and display:
     ```
     Total Tools: 174
     Tested: 45 (25.9%)
     Passed: 42
     Failed: 3
     Untested: 129

     Untested tools:
     - mittwald_app_copy
     - mittwald_backup_create
     ...
     ```
  5. Exit code: 0 if coverage > 0%, 1 if no tests run
- **Files**: `tests/functional/src/harness/coverage.ts`
- **Parallel?**: Yes (after T023)

### Subtask T026 – Handle concurrent append safety

- **Purpose**: Ensure parallel sessions don't corrupt the manifest.
- **Steps**:
  1. Test concurrent writes:
     ```typescript
     // Write 100 entries from 5 parallel workers
     await Promise.all([
       writeEntries(0, 20),
       writeEntries(20, 40),
       writeEntries(40, 60),
       writeEntries(60, 80),
       writeEntries(80, 100),
     ]);
     ```
  2. Verify manifest has exactly 100 lines
  3. Verify each line is valid JSON
  4. If corruption detected, implement file locking fallback
- **Files**: `tests/functional/src/harness/manifest.ts`
- **Parallel?**: No
- **Notes**: On POSIX systems, append to file descriptor is atomic for writes < PIPE_BUF (typically 4KB). Our entries are ~500 bytes, so should be safe.

## Test Strategy

No unit tests specified. Validate by:
1. Append 10 entries sequentially, verify file has 10 valid JSON lines
2. Run concurrent append test (T026)
3. Query coverage with known tool list, verify math is correct

## Risks & Mitigations

- **Large manifest**: Over time, manifest grows. Consider archival strategy (out of scope for sprint).
- **Concurrent corruption**: Unlikely with atomic append, but test explicitly.
- **Clock skew**: Timestamp ordering assumes single-machine execution.

## Definition of Done Checklist

- [X] `manifest.ts` exports append, getCoverage, getToolHistory
- [X] ManifestEntry schema matches data-model.md exactly
- [X] Append creates file if not exists
- [X] Coverage calculation is accurate (now uses tool inventory)
- [X] Tool history returns correct entries
- [X] Coverage CLI displays readable output (with untested tools list)
- [X] Concurrent append test passes (100 entries, 5 workers)
- [X] `tasks.md` updated with completion status

## Review Guidance

- Run the concurrent append test and verify no corruption
- Check coverage math with known test data
- Verify JSONL format (one object per line, no array wrapper)

## Review Feedback

- ~~Needs changes: Coverage CLI (`tests/functional/src/harness/coverage.ts`) does not load tool inventory, so coverage always treats tested tools as total—violating T025 guidance to load inventory and the DoD item for accurate coverage. Please wire in the known tool list (from WP06 inventory) so untested tools and correct percentages are reported.~~
- ~~Please update DoD checklist and `tasks.md` (T021–T026) once fixed. Current prompt/tasks still show unchecked items.~~
- **Fixed 2025-12-04**: Coverage CLI now uses `getKnownToolNames()` to load tool inventory (from cached config or MCP discovery) and passes to `getCoverage()`. Untested tools are correctly reported.

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
- 2025-12-04T13:55:22Z – codex – lane=planned – Returned for changes (integrate inventory into coverage CLI; update DoD/tasks.md).
- 2025-12-10T07:19:50Z – claude-sonnet-4.5 – shell_pid=73449 – lane=done – Code review complete: Implementation approved - all requirements met, feedback incorporated
