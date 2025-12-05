---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
title: "Bidirectional Streaming Infrastructure"
phase: "Phase 1 - Foundation"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "5620"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T11:00:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "5620"
    action: "Started implementation"
---

# Work Package Prompt: WP01 – Bidirectional Streaming Infrastructure

## Objectives & Success Criteria

- Enable the controller to inject user responses into a running Claude CLI session via stdin
- Implement JSON message format compatible with Claude's `--input-format stream-json`
- Verify round-trip communication: inject message → observe Claude response
- Foundation for WP03 Supervisory Controller

**Success Metric**: Can inject a user message mid-session and see Claude acknowledge it in stdout

## Context & Constraints

### Prerequisites
- Existing 005 harness in `tests/functional/src/harness/`
- Claude CLI supports `--input-format stream-json` for bidirectional streaming

### Key References
- `kitty-specs/007-real-world-use/research.md` - Bidirectional streaming research
- `tests/functional/src/harness/session-runner.ts` - Current session spawning (stdin piped but unused)

### Constraints
- Must not break existing 005 functionality
- Use existing ChildProcess stdio pipes (already configured as `['pipe', 'pipe', 'pipe']`)
- TypeScript with ES modules

## Subtasks & Detailed Guidance

### Subtask T001 – Extend SessionRunner to expose stdin handle

- **Purpose**: The current SessionRunner spawns Claude but doesn't expose the stdin handle for writing. We need access to inject responses.

- **Steps**:
  1. Open `tests/functional/src/harness/session-runner.ts`
  2. Locate the `spawn()` call - stdin is already piped
  3. Modify return type or add method to expose `childProcess.stdin`
  4. Ensure stdin is not closed prematurely

- **Files**:
  - Modify: `tests/functional/src/harness/session-runner.ts`

- **Parallel?**: No (foundational change)

- **Notes**:
  - The ChildProcess.stdin is a Writable stream
  - May need to add `stdin` to the SessionRunner interface/class

### Subtask T002 – Create stdin-injector.ts with writeUserMessage() function

- **Purpose**: Provide a clean API for injecting user messages into Claude sessions.

- **Steps**:
  1. Create new file `tests/functional/src/harness/stdin-injector.ts`
  2. Define interface for message injection
  3. Implement `writeUserMessage(stdin: Writable, content: string): void`
  4. Add error handling for write failures

- **Files**:
  - Create: `tests/functional/src/harness/stdin-injector.ts`

- **Parallel?**: Yes (after T001 provides stdin access)

- **Example Implementation**:
```typescript
import { Writable } from 'stream';

export interface UserMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string;
  };
}

export function writeUserMessage(stdin: Writable, content: string): void {
  const message: UserMessage = {
    type: 'user',
    message: {
      role: 'user',
      content
    }
  };
  stdin.write(JSON.stringify(message) + '\n');
}
```

### Subtask T003 – Implement JSON message format for injection

- **Purpose**: Ensure message format matches what Claude CLI expects for `--input-format stream-json`.

- **Steps**:
  1. Study existing session logs for message format examples
  2. Implement exact format: `{"type": "user", "message": {"role": "user", "content": "..."}}`
  3. Ensure JSON is terminated with newline
  4. Add TypeScript types for all message variants

- **Files**:
  - Modify: `tests/functional/src/harness/stdin-injector.ts`

- **Parallel?**: Yes (with T002)

- **Notes**:
  - Session logs in `tests/functional/session-logs/005-mcp-functional-test/` show exact format
  - Message must be valid JSON on a single line

### Subtask T004 – Add --input-format stream-json flag to Claude CLI spawn args

- **Purpose**: Enable Claude to accept stdin input in stream-json format.

- **Steps**:
  1. Locate where Claude CLI args are constructed in session-runner.ts
  2. Add `--input-format`, `stream-json` to the args array
  3. Verify `--output-format stream-json` is also present (should be from 005)
  4. Test that Claude accepts both flags

- **Files**:
  - Modify: `tests/functional/src/harness/session-runner.ts`

- **Parallel?**: No (must coordinate with T001)

- **Notes**:
  - Both input and output format flags needed for bidirectional streaming
  - Check Claude CLI docs if flags have changed

### Subtask T005 – Create manual test script to verify round-trip communication

- **Purpose**: Validate that the entire injection pipeline works before WP03 integration.

- **Steps**:
  1. Create `tests/functional/scripts/test-stdin-injection.ts`
  2. Spawn Claude with a prompt that asks a question
  3. Wait for the question in stdout
  4. Inject an answer via stdin
  5. Verify Claude continues and acknowledges the answer

- **Files**:
  - Create: `tests/functional/scripts/test-stdin-injection.ts`

- **Parallel?**: No (needs all other subtasks)

- **Example Test Flow**:
```typescript
// 1. Spawn with prompt: "Ask me what color I prefer"
// 2. Wait for Claude to ask "What color do you prefer?"
// 3. Inject: {"type": "user", "message": {"role": "user", "content": "Blue"}}
// 4. Verify Claude responds with something about blue
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Claude CLI doesn't accept stdin after initial prompt | Test with minimal example first; may need different flag combination |
| Message format incorrect | Compare exact format from existing session logs |
| Race condition: write before Claude ready | Add small delay or wait for first output before injecting |
| stdin buffer issues | Flush writes, handle backpressure |

## Definition of Done Checklist

- [ ] T001: SessionRunner exposes stdin handle
- [ ] T002: stdin-injector.ts created with writeUserMessage()
- [ ] T003: Message format matches Claude expectations
- [ ] T004: --input-format stream-json added to spawn args
- [ ] T005: Test script demonstrates successful round-trip
- [ ] All changes compile without TypeScript errors
- [ ] Existing 005 tests still pass (no regression)

## Review Guidance

- **Key Checkpoint**: Run the test script (T005) and verify Claude responds to injected message
- **Verify**: stdin is not closed after initial prompt
- **Verify**: Message format exactly matches session log examples
- **Look For**: Error handling for write failures

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
