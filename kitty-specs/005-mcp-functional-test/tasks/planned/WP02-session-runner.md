---
work_package_id: "WP02"
subtasks:
  - "T007"
  - "T008"
  - "T009"
  - "T010"
  - "T011"
  - "T012"
  - "T013"
title: "Session Runner - Claude Code Spawning"
phase: "Phase 1 - Foundation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-04T11:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP02 – Session Runner - Claude Code Spawning

## Objectives & Success Criteria

- Spawn Claude Code headless sessions with streaming JSON output
- Enforce `--disallowedTools "Bash(mw)"` on all sessions (FR-002)
- Parse streaming JSONL output and extract session_id (FR-004)
- Handle session timeout and termination

**Success Gate**: Single test prompt executes, session_id is captured, attempting `mw` command fails.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-001, FR-002, FR-004
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - ISessionRunner interface
- **Claude Code Command**: `claude -p "<prompt>" --output-format stream-json --disallowedTools "Bash(mw)" --mcp-config <path>`
- **Depends on**: WP01 (types must be available)

## Subtasks & Detailed Guidance

### Subtask T007 – Implement session-runner.ts spawn logic

- **Purpose**: Create the core subprocess spawning for Claude Code headless mode.
- **Steps**:
  1. Create `src/harness/session-runner.ts`
  2. Implement `spawn(options: SpawnSessionOptions)` function
  3. Use `child_process.spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'] })`
  4. Build argument array:
     ```typescript
     const args = [
       '-p', options.prompt,
       '--output-format', 'stream-json',
       '--print-cost',
     ];
     if (options.mcpConfig) {
       args.push('--mcp-config', options.mcpConfig);
     }
     ```
  5. Add `--model claude-3-haiku-20240307` for cost-efficient test agents (FR-001a)
  6. Return object with `stream`, `result` promise, and `kill` function
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No (foundation for T008-T013)

### Subtask T008 – Add disallowedTools enforcement

- **Purpose**: Block `mw` CLI usage in all test sessions (FR-002).
- **Steps**:
  1. Add to spawn args: `--disallowedTools "Bash(mw)"`
  2. Always include this flag - no opt-out
  3. If `options.disallowedTools` contains additional tools, concatenate them
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No
- **Notes**: This is critical for test validity. Agents MUST use MCP tools, not CLI.

### Subtask T009 – Implement streaming JSON parsing

- **Purpose**: Parse Claude's stream-json output format line by line.
- **Steps**:
  1. Use `readline.createInterface({ input: childProcess.stdout })`
  2. Each line is a JSON object with a `type` field
  3. Emit parsed events via AsyncIterable:
     ```typescript
     for await (const line of rl) {
       const event = JSON.parse(line);
       yield {
         type: event.type,
         timestamp: new Date(),
         content: event
       };
     }
     ```
  4. Handle malformed JSON gracefully (log and skip)
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No

### Subtask T010 – Extract session_id from result events

- **Purpose**: Capture the session_id for log correlation (FR-004).
- **Steps**:
  1. Session ID appears in the final `result` type event
  2. Look for `event.session_id` in the stream
  3. Store in SessionResult object
  4. If no session_id found, generate a fallback UUID and log warning
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No
- **Notes**: Session ID is critical for log retrieval (FR-015).

### Subtask T011 – Implement session timeout and kill

- **Purpose**: Allow graceful and forced session termination.
- **Steps**:
  1. Accept `timeoutMs` in SpawnSessionOptions
  2. Set up `setTimeout` to call `kill()` if timeout exceeded
  3. Implement `kill()` function:
     ```typescript
     function kill(): void {
       childProcess.kill('SIGTERM');
       setTimeout(() => childProcess.kill('SIGKILL'), 5000);
     }
     ```
  4. On timeout, set status to `'timeout'`
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No

### Subtask T012 – Handle subprocess errors and exit codes

- **Purpose**: Properly detect and report session failures.
- **Steps**:
  1. Listen to `childProcess.on('error', ...)` for spawn failures
  2. Listen to `childProcess.on('exit', code, signal)` for completion
  3. Map exit codes to status:
     - 0 → check result for pass/fail
     - non-zero → `'failed'`
     - null (signal) → `'interrupted'`
  4. Capture stderr output for error messages
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No

### Subtask T013 – Create SpawnSessionOptions and SessionResult implementation

- **Purpose**: Ensure all interface contracts are satisfied.
- **Steps**:
  1. Export `ISessionRunner` interface implementation
  2. Ensure `SessionResult` includes all required fields:
     - sessionId, status, result, error
     - metrics: { durationMs, totalCostUsd, numTurns }
  3. Calculate duration from start to end time
  4. Parse cost from `--print-cost` output if available
- **Files**: `tests/functional/src/harness/session-runner.ts`
- **Parallel?**: No

## Test Strategy

No unit tests specified. Validate by:
1. Run a simple prompt: `claude -p "What is 2+2?" --output-format stream-json`
2. Verify session_id is captured
3. Run a prompt that tries to use `mw`: `claude -p "Run mw --help" --disallowedTools "Bash(mw)" --output-format stream-json`
4. Verify the command is blocked

## Risks & Mitigations

- **Claude CLI version changes**: The `stream-json` format may change. Pin version in documentation.
- **Session ID location**: May vary by Claude version. Check multiple event types.
- **Timeout race conditions**: Ensure kill is called only once.

## Definition of Done Checklist

- [ ] `session-runner.ts` exports spawn function matching ISessionRunner
- [ ] All test sessions include `--disallowedTools "Bash(mw)"`
- [ ] Streaming JSON parsed correctly into StreamEvent objects
- [ ] session_id extracted from result events
- [ ] Timeout and kill functionality works
- [ ] Exit codes correctly mapped to status values
- [ ] SessionResult includes all metric fields
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Run a test prompt and verify JSON streaming works
- Attempt to use `mw` CLI and verify it's blocked
- Check that session_id is captured in the result
- Verify timeout kills the process correctly

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
