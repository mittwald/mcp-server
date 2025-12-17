---
work_package_id: WP08
title: CLI & Session Preservation
lane: done
history:
- timestamp: '2025-12-04T11:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T15:20:00Z'
  lane: doing
  agent: claude
  shell_pid: '72358'
  action: Started implementation
- timestamp: '2025-12-04T16:00:00Z'
  lane: for_review
  agent: claude
  shell_pid: '72358'
  action: 'Completed T052-T061: CLI commands, session log preservation, quickstart validation'
- timestamp: '2025-12-10T07:22:46Z'
  lane: done
  agent: claude-sonnet-4.5
  shell_pid: '74100'
  action: 'Code review complete: Implementation approved - CLI session preservation working'
agent: claude-sonnet-4.5
assignee: claude
phase: Phase 4 - Polish
review_status: approved without changes
reviewed_by: claude-sonnet-4.5
shell_pid: '74100'
subtasks:
- T052
- T053
- T054
- T055
- T056
- T057
- T058
- T059
- T060
- T061
---

# Work Package Prompt: WP08 – CLI & Session Preservation

## Objectives & Success Criteria

- Complete CLI interface for all harness operations
- Configure session log preservation for future analysis (FR-011, FR-014)
- Create session-to-log mapping for retrieval (FR-012, FR-015)

**Success Gate**: All CLI commands work; session logs retrievable by session_id.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-011, FR-012, FR-014, FR-015
  - `kitty-specs/005-mcp-functional-test/quickstart.md` - CLI usage examples
  - `kitty-specs/005-mcp-functional-test/data-model.md` - SessionLogRef
- **Log Location**: `~/.claude/projects/` (Claude Code managed)
- **Retention**: Configure `cleanupPeriodDays: 99999` in Claude settings
- **Depends on**: WP07 (harness orchestration)

## Subtasks & Detailed Guidance

### Subtask T052 – Create CLI entry point with command parsing

- **Purpose**: Provide command-line interface for harness operations.
- **Steps**:
  1. Update `src/harness/index.ts` with argument parsing
  2. Use `process.argv` or simple arg parser (avoid heavy dependencies)
  3. Parse common options:
     ```typescript
     interface CLIOptions {
       command: 'test' | 'coverage' | 'cleanup' | 'status' | 'list-resources';
       domain?: string;
       tool?: string;
       cleanRoom?: boolean;
       concurrency?: number;
       skipCleanup?: boolean;
       orphaned?: boolean;
       all?: boolean;
     }
     ```
  4. Display help on `--help` or invalid command
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No (foundation)

### Subtask T053 – Implement test:all command

- **Purpose**: Run complete test suite across all domains.
- **Steps**:
  1. `npm run test:all` → `node dist/harness/index.js --all`
  2. Load tool inventory
  3. Run all tests in tier order
  4. Display progress: `Testing tool X of 174...`
  5. Summary at end:
     ```
     Test Suite Complete
     Total: 174
     Passed: 168
     Failed: 6
     Duration: 45m 23s
     ```
  6. Exit code: 0 if all pass, 1 if any fail
- **Files**: `tests/functional/src/harness/index.ts`, `tests/functional/package.json`
- **Parallel?**: No

### Subtask T054 – Implement test:domain command

- **Purpose**: Run tests for a single domain.
- **Steps**:
  1. `npm run test:domain -- --domain apps` → `node dist/harness/index.js test --domain apps`
  2. Filter queue to specified domain only
  3. Run tests with same orchestration
  4. Cleanup only that domain after completion
  5. Validate domain name against known domains
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T055 – Implement test:tool command

- **Purpose**: Run test for a single tool.
- **Steps**:
  1. `npm run test:tool -- --tool mittwald_project_create --clean-room`
  2. Find tool in inventory
  3. Determine mode:
     - `--clean-room`: No setup, agent discovers everything
     - Default: Harness creates prerequisites
  4. Run single test
  5. Display detailed output including session_id
  6. Skip domain cleanup (single tool doesn't complete domain)
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T056 – Implement cleanup command

- **Purpose**: Manual cleanup for specific domain or all resources.
- **Steps**:
  1. `npm run cleanup -- --domain apps` → cleanup apps domain
  2. `npm run cleanup -- --all` → cleanup all tracked resources
  3. Load tracker state
  4. Run cleanup in dependency order
  5. Report results: cleaned, failed
  6. Handle orphan cleanup option: `--orphaned`
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T057 – Implement status command

- **Purpose**: Show current harness status.
- **Steps**:
  1. `npm run status`
  2. Display:
     ```
     MCP Functional Test Harness Status

     Active Sessions: 3
     Queued Tests: 45
     Completed: 126
     Failed: 3

     Current Domain: apps
     Progress: 126/174 (72.4%)

     Resource Tracker:
     - Projects: 2 active
     - Apps: 5 active
     - Databases: 1 active
     ```
  3. If not running, show last run summary
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T058 – Implement session log preservation config

- **Purpose**: Configure Claude Code to retain logs indefinitely (FR-011).
- **Steps**:
  1. Document required settings in quickstart.md
  2. Settings file: `~/.claude/settings.json`
  3. Required setting:
     ```json
     {
       "cleanupPeriodDays": 99999
     }
     ```
  4. On harness startup, check if configured
  5. Warn if retention not set (logs may be deleted)
  6. Create helper script if needed
- **Files**: `tests/functional/src/harness/index.ts`, `kitty-specs/005-mcp-functional-test/quickstart.md`
- **Parallel?**: Yes (after T052)

### Subtask T059 – Create session mapping storage

- **Purpose**: Map session_id to log file location (FR-012, FR-015).
- **Steps**:
  1. Create `output/sessions/` directory
  2. After each test, save mapping:
     ```typescript
     // output/sessions/{session_id}.json
     {
       "sessionId": "abc123",
       "testId": "test-uuid",
       "toolName": "mittwald_project_create",
       "logPath": "~/.claude/projects/.../session.jsonl",
       "startTime": "2025-12-04T12:00:00Z",
       "endTime": "2025-12-04T12:05:00Z"
     }
     ```
  3. Implement `findSessionLog(sessionId: string): Promise<SessionLogRef | null>`
  4. Search `~/.claude/projects/` for matching session if not in mapping
- **Files**: `tests/functional/src/harness/index.ts`, `tests/functional/output/sessions/`
- **Parallel?**: Yes

### Subtask T060 – Implement orphan listing command

- **Purpose**: List resources that may be orphaned (crash recovery).
- **Steps**:
  1. `npm run list-resources -- --orphaned`
  2. Call orphan detection from cleanup.ts
  3. Display resources matching `test-*` pattern not in tracker
  4. Include guidance: "Use mw CLI to manually delete"
  5. Example output:
     ```
     Orphaned Test Resources:
     - project: test-apps-20251204-a3f9 (p-xxxxx)
     - app: test-apps-20251204-b2c1 (a-yyyyy)

     To cleanup, run:
       mw project delete p-xxxxx
       mw app uninstall a-yyyyy
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T061 – Validate quickstart.md scenario

- **Purpose**: Ensure quickstart documentation works end-to-end.
- **Steps**:
  1. Follow quickstart.md step by step
  2. Verify:
     - `npm install` works
     - MCP server config correct
     - Log retention configured
     - `npm run test:tool -- --tool mittwald_user_get` succeeds
     - `npm run coverage` shows results
  3. Fix any documentation gaps
  4. Add troubleshooting for common issues
- **Files**: `kitty-specs/005-mcp-functional-test/quickstart.md`
- **Parallel?**: No (final validation)

## Test Strategy

No unit tests specified. Validate by:
1. Run each CLI command and verify output
2. Follow quickstart from scratch
3. Verify session log mapping works

## Risks & Mitigations

- **Claude settings location**: May vary by installation. Document alternatives.
- **Log path discovery**: Claude may change log location. Implement fallback search.
- **Large session directories**: `~/.claude/projects/` may contain many projects. Optimize search.

## Definition of Done Checklist

- [ ] All CLI commands implemented and documented
- [ ] `test:all` runs complete suite with progress display
- [ ] `test:domain` runs single domain tests
- [ ] `test:tool` runs single tool with clean-room option
- [ ] `cleanup` command removes tracked resources
- [ ] `status` shows current harness state
- [ ] Log retention configuration documented
- [ ] Session → log file mapping stored
- [ ] `list-resources --orphaned` finds untracked resources
- [ ] Quickstart scenario validated end-to-end
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Follow quickstart from scratch, verify all steps work
- Test each CLI command with various options
- Verify session log can be retrieved by session_id
- Check orphan detection finds manually created test resources

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
- 2025-12-10T07:22:46Z – claude-sonnet-4.5 – shell_pid=74100 – lane=done – Code review complete: Implementation approved - CLI session preservation working
