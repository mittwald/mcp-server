---
work_package_id: "WP03"
subtasks:
  - "T014"
  - "T015"
  - "T016"
  - "T017"
  - "T018"
  - "T019"
  - "T020"
title: "Stream Parser & Haiku Coordinator"
phase: "Phase 1 - Foundation"
lane: "doing"
assignee: "claude"
agent: "claude"
shell_pid: "72358"
history:
  - timestamp: "2025-12-04T11:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-04T13:38:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "72358"
    action: "Started implementation"
---

# Work Package Prompt: WP03 – Stream Parser & Haiku Coordinator

## Objectives & Success Criteria

- Parse streaming events to extract tool usage patterns
- Implement Haiku-powered coordinator for intelligent stuck detection (FR-005a)
- Detect intervention triggers: >3 consecutive errors, >60s idle, >5 repeated tool calls

**Success Gate**: Coordinator correctly identifies stuck patterns and returns appropriate decisions.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-005a intervention triggers
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - ICoordinator interface
  - `kitty-specs/005-mcp-functional-test/data-model.md` - CoordinatorState, SessionMonitor
- **Haiku Model**: Use `claude-3-haiku-20240307` via @anthropic-ai/sdk
- **Depends on**: WP02 (stream events)

## Subtasks & Detailed Guidance

### Subtask T014 – Implement stream-parser.ts

- **Purpose**: Parse stream-json events into typed StreamEvent objects.
- **Steps**:
  1. Create `src/harness/stream-parser.ts`
  2. Define event type mapping:
     ```typescript
     type StreamEventType = 'message' | 'tool_use' | 'tool_result' | 'error' | 'result';
     ```
  3. Implement `parseStreamEvent(line: string): StreamEvent | null`
  4. Handle event subtypes:
     - `message`: Assistant text output
     - `tool_use`: Tool invocation (extract tool name, arguments)
     - `tool_result`: Tool response (extract success/error)
     - `error`: Error messages
     - `result`: Final session result with session_id
- **Files**: `tests/functional/src/harness/stream-parser.ts`
- **Parallel?**: No (needed for T015-T16)

### Subtask T015 – Extract tool call patterns from events

- **Purpose**: Track which tools are being called and how often.
- **Steps**:
  1. Maintain a sliding window of recent tool calls
  2. For each `tool_use` event:
     - Extract tool name (e.g., `mcp__mittwald__project_create`)
     - Track invocation timestamp
     - Track arguments (for duplicate detection)
  3. Export pattern data for coordinator analysis
- **Files**: `tests/functional/src/harness/stream-parser.ts`
- **Parallel?**: No

### Subtask T016 – Track error/idle/repeat patterns

- **Purpose**: Detect stuck indicators for coordinator intervention.
- **Steps**:
  1. **Consecutive Errors**: Count sequential `error` events or `tool_result` with errors
     - Reset on successful tool_result
  2. **Idle Time**: Track time since last event
     - Update `lastActivityTime` on each event
  3. **Repeated Tool Calls**: Count same tool called with same arguments
     - Track: `{ toolName, argHash, count }`
  4. Expose as `SessionMonitor` state:
     ```typescript
     interface PatternState {
       consecutiveErrors: number;
       idleTimeMs: number;
       sameToolRepeated: number;
       lastToolName: string;
       lastActivityTime: Date;
     }
     ```
- **Files**: `tests/functional/src/harness/stream-parser.ts`
- **Parallel?**: No

### Subtask T017 – Implement coordinator.ts Haiku interface

- **Purpose**: Create the meta-agent that analyzes session state.
- **Steps**:
  1. Create `src/harness/coordinator.ts`
  2. Initialize Anthropic client:
     ```typescript
     import Anthropic from '@anthropic-ai/sdk';
     const anthropic = new Anthropic();
     ```
  3. Implement `analyze(input: CoordinatorInput): Promise<CoordinatorDecision>`
  4. Call Haiku with structured analysis prompt
  5. Parse response into `CoordinatorDecision`
- **Files**: `tests/functional/src/harness/coordinator.ts`
- **Parallel?**: Yes (can start once interface defined)
- **Notes**: Use environment variable `ANTHROPIC_API_KEY` for authentication.

### Subtask T018 – Define coordinator analysis prompt template

- **Purpose**: Create the prompt that Haiku uses to analyze session state.
- **Steps**:
  1. Define system prompt explaining the coordinator role:
     ```
     You are a test coordinator monitoring Claude Code agents testing MCP tools.
     Analyze the session state and decide whether to:
     - continue: Let the agent proceed
     - intervene: Send guidance to help the stuck agent
     - terminate: Kill the session as unrecoverable
     ```
  2. Define user prompt template with session context:
     ```
     Session: {sessionId}
     Tool under test: {toolUnderTest}

     Recent activity:
     {recentOutput}

     Metrics:
     - Consecutive errors: {consecutiveErrors}
     - Idle time: {idleTimeMs}ms
     - Same tool repeated: {sameToolRepeated} times

     What action should we take?
     ```
  3. Define expected response format (JSON)
- **Files**: `tests/functional/src/harness/coordinator.ts`
- **Parallel?**: Yes

### Subtask T019 – Implement intervention triggers

- **Purpose**: Apply the specific thresholds from FR-005a.
- **Steps**:
  1. Before calling Haiku, check hard thresholds:
     - `consecutiveErrors > 3` → suggest terminate
     - `idleTimeMs > 60000` → suggest intervene
     - `sameToolRepeated > 5` → suggest intervene
  2. If any threshold exceeded, include in prompt context
  3. Let Haiku make final decision (may override)
  4. Return `CoordinatorDecision`:
     ```typescript
     interface CoordinatorDecision {
       action: 'continue' | 'intervene' | 'terminate';
       reason?: string;
       suggestion?: string;
     }
     ```
- **Files**: `tests/functional/src/harness/coordinator.ts`
- **Parallel?**: No (depends on T17-T18)

### Subtask T020 – Add coordinator decision logging

- **Purpose**: Log all coordinator decisions for debugging and analysis.
- **Steps**:
  1. Create `output/coordinator.log` on first write
  2. Log each analysis request and response:
     ```json
     {
       "timestamp": "2025-12-04T12:00:00Z",
       "sessionId": "abc123",
       "input": { ... },
       "decision": { "action": "continue" },
       "latencyMs": 150
     }
     ```
  3. Append-only logging (same pattern as manifest)
- **Files**: `tests/functional/src/harness/coordinator.ts`, `tests/functional/output/coordinator.log`
- **Parallel?**: No

## Test Strategy

No unit tests specified. Validate by:
1. Create mock stream with 4 consecutive errors
2. Verify coordinator returns `terminate`
3. Create mock stream with 70s idle
4. Verify coordinator returns `intervene`

## Risks & Mitigations

- **Haiku API latency**: Don't call per-event. Batch analysis at intervals (e.g., every 10s).
- **API costs**: Haiku is cheap but track usage. Log token counts.
- **False positives**: Haiku may over-intervene. Start with `continue` bias.

## Definition of Done Checklist

- [ ] `stream-parser.ts` correctly parses all event types
- [ ] Tool call patterns extracted and tracked
- [ ] Error/idle/repeat metrics calculated correctly
- [ ] Coordinator connects to Haiku API successfully
- [ ] Prompt template produces valid decisions
- [ ] Thresholds (>3 errors, >60s idle, >5 repeats) trigger correctly
- [ ] All decisions logged to `coordinator.log`
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Test each intervention trigger independently
- Verify Haiku API calls are batched, not per-event
- Check log format is valid JSONL
- Ensure ANTHROPIC_API_KEY environment variable is documented

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
