---
work_package_id: "WP03"
subtasks:
  - "T011"
  - "T012"
  - "T013"
  - "T014"
  - "T015"
  - "T016"
  - "T017"
  - "T018"
title: "Supervisory Controller"
phase: "Phase 1 - Foundation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP03 – Supervisory Controller

## Objectives & Success Criteria

- Create SupervisoryController to orchestrate multi-step use case execution
- Implement execution state machine: pending → running → (success | failure | timeout)
- Enforce configurable timeouts (default 10min, max 30min)
- Handle agent questions with predefined answers, skip, or escalate
- Detect success/failure based on use-case-specific patterns

**Success Metric**: Controller correctly identifies success/failure/timeout for test scenarios

## Context & Constraints

### Prerequisites
- WP01: Bidirectional Streaming (stdin injection)
- WP02: Question Detection (parser events)
- Existing coordinator pattern in `tests/functional/src/harness/coordinator.ts`

### Key References
- `kitty-specs/007-real-world-use/data-model.md` - SupervisoryState interface
- `kitty-specs/007-real-world-use/spec.md` - FR-011 through FR-015

### Constraints
- Must integrate with existing SessionRunner/StreamParser
- Timeout max 30 minutes per spec
- No infinite execution allowed

## Subtasks & Detailed Guidance

### Subtask T011 – Create SupervisoryController class with state machine

- **Purpose**: Central orchestrator for multi-step use case execution.

- **Steps**:
  1. Create `tests/functional/src/harness/supervisory-controller.ts`
  2. Extend EventEmitter for state change notifications
  3. Define state machine with transitions
  4. Initialize with use case configuration

- **Files**:
  - Create: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (foundational)

- **Example Structure**:
```typescript
import { EventEmitter } from 'events';
import { UseCase } from '../use-cases/types';

export type ExecutionState = 'pending' | 'running' | 'success' | 'failure' | 'timeout';

export class SupervisoryController extends EventEmitter {
  private state: ExecutionState = 'pending';
  private useCase: UseCase;
  private timeoutHandle?: NodeJS.Timeout;

  constructor(useCase: UseCase) {
    super();
    this.useCase = useCase;
  }

  getState(): ExecutionState {
    return this.state;
  }

  private transition(newState: ExecutionState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit('state_change', { from: oldState, to: newState });
  }
}
```

### Subtask T012 – Implement execution states: pending, running, success, failure, timeout

- **Purpose**: Clear state machine with well-defined transitions.

- **Steps**:
  1. Define valid transitions:
     - pending → running (on start)
     - running → success (on completion)
     - running → failure (on error/stuck)
     - running → timeout (on timer)
  2. Add guard to prevent invalid transitions
  3. Emit event on each transition

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (extends T011)

- **Notes**:
  - Only terminal states: success, failure, timeout
  - Once terminal, no further transitions allowed

### Subtask T013 – Add configurable timeout enforcement

- **Purpose**: Ensure no use case runs forever (FR-011: default 10min, max 30min).

- **Steps**:
  1. Start timer when transitioning to 'running'
  2. Use `setTimeout` with use case's timeout value
  3. On timeout: transition to 'timeout', emit event, cleanup
  4. Clear timer on success/failure (prevent double-fire)
  5. Add `remainingTime()` method for monitoring

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (extends T012)

- **Example**:
```typescript
start(): void {
  this.transition('running');
  const timeoutMs = (this.useCase.timeout || 10) * 60 * 1000;
  this.timeoutHandle = setTimeout(() => {
    this.transition('timeout');
    this.cleanup();
  }, timeoutMs);
}

private clearTimeout(): void {
  if (this.timeoutHandle) {
    clearTimeout(this.timeoutHandle);
    this.timeoutHandle = undefined;
  }
}
```

### Subtask T014 – Implement success detection based on use-case-specific patterns

- **Purpose**: Detect when use case has completed successfully.

- **Steps**:
  1. Accept success criteria from UseCase definition
  2. Monitor session output for success patterns
  3. Track which criteria have been met
  4. Transition to 'success' when all criteria met

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: Yes (with T015)

- **Notes**:
  - Success patterns may include:
    - Specific tool calls completed
    - Output contains success phrases
    - No errors in last N messages

### Subtask T015 – Implement failure detection: repeated errors, stuck indicators

- **Purpose**: Detect when use case is stuck or has failed.

- **Steps**:
  1. Track consecutive error count
  2. Detect stuck indicators (same tool called repeatedly, no progress)
  3. Listen for explicit failure signals from Claude
  4. Transition to 'failure' when thresholds exceeded

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: Yes (with T014)

- **Thresholds** (from existing coordinator):
  - MAX_CONSECUTIVE_ERRORS = 3
  - MAX_SAME_TOOL_REPEATS = 5
  - MAX_IDLE_TIME_MS = 60000

### Subtask T016 – Add question handling: match predefined answers, skip, or escalate

- **Purpose**: Respond to agent questions automatically during execution.

- **Steps**:
  1. Listen for `question_detected` events from StreamParser
  2. Match question against use case's predefined answers
  3. If match: inject answer via stdin
  4. If no match and skipUnknown: continue without answering
  5. If no match and escalate: transition to failure with "manual intervention required"

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (depends on T017)

- **Example**:
```typescript
handleQuestion(question: string): void {
  const match = this.useCase.questionAnswers.find(
    qa => new RegExp(qa.questionPattern, 'i').test(question)
  );

  if (match) {
    if (match.skip) {
      // Don't inject anything, let Claude continue
      return;
    }
    if (match.escalate) {
      this.transition('failure');
      return;
    }
    this.injectResponse(match.answer);
  } else {
    // No match - default behavior based on config
    if (this.skipUnknownQuestions) {
      return;
    }
    this.transition('failure');
  }
}
```

### Subtask T017 – Integrate with StdinInjector for response injection

- **Purpose**: Wire up the controller to actually inject responses.

- **Steps**:
  1. Accept stdin Writable in controller constructor or method
  2. Import and use writeUserMessage from stdin-injector.ts
  3. Add method `injectResponse(content: string)`
  4. Log injected responses for debugging

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (requires WP01 complete)

### Subtask T018 – Create controller event emitter for state changes

- **Purpose**: Allow external monitoring of controller state.

- **Steps**:
  1. Define event types: state_change, question_handled, timeout_warning
  2. Emit state_change on every transition
  3. Emit question_handled after processing question
  4. Emit timeout_warning at 80% of timeout (optional)

- **Files**:
  - Modify: `tests/functional/src/harness/supervisory-controller.ts`

- **Parallel?**: No (extends base class)

- **Event Types**:
```typescript
interface StateChangeEvent {
  from: ExecutionState;
  to: ExecutionState;
  timestamp: Date;
}

interface QuestionHandledEvent {
  question: string;
  action: 'answered' | 'skipped' | 'escalated';
  answer?: string;
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Race conditions in state transitions | Use mutex or serialize all state updates |
| Timeout fires after success | Clear timeout handle on any terminal state |
| Question patterns too broad/narrow | Start conservative, tune based on real sessions |
| Stdin injection fails silently | Log all injections, verify in session log |

## Definition of Done Checklist

- [ ] T011: SupervisoryController class created
- [ ] T012: State machine with valid transitions
- [ ] T013: Timeout enforcement working
- [ ] T014: Success detection implemented
- [ ] T015: Failure detection implemented
- [ ] T016: Question handling working
- [ ] T017: Stdin injection integrated
- [ ] T018: Events emitted for monitoring
- [ ] All changes compile without TypeScript errors
- [ ] Can run a simple use case through success/failure/timeout paths

## Review Guidance

- **Key Checkpoint**: Test each state transition path
- **Verify**: Timeout clears on success/failure
- **Verify**: Questions are matched and answered correctly
- **Look For**: Edge cases with rapid state changes

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
