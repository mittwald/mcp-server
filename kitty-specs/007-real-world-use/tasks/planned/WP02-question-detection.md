---
work_package_id: "WP02"
subtasks:
  - "T006"
  - "T007"
  - "T008"
  - "T009"
  - "T010"
title: "Question Detection in Stream Parser"
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

# Work Package Prompt: WP02 – Question Detection in Stream Parser

## Objectives & Success Criteria

- Detect when Claude asks questions requiring user input during session execution
- Add pattern-based question detection to StreamParser
- Emit `question_detected` event with message context
- Track pending question state for controller integration

**Success Metric**: Parser emits events when assistant messages contain question patterns

## Context & Constraints

### Prerequisites
- Existing StreamParser in `tests/functional/src/harness/stream-parser.ts`
- Can run in parallel with WP01

### Key References
- `kitty-specs/007-real-world-use/research.md` - Question detection patterns
- `tests/functional/src/harness/stream-parser.ts` - Current event parsing

### Constraints
- Minimize false positives (rhetorical questions in explanations)
- Must work with existing event flow
- TypeScript with ES modules

## Subtasks & Detailed Guidance

### Subtask T006 – Define question patterns regex array

- **Purpose**: Create a set of patterns that identify questions requiring user response.

- **Steps**:
  1. Create constant array of RegExp patterns
  2. Include common question patterns:
     - `?` (direct questions)
     - "Could you" / "Would you"
     - "Please confirm" / "Please provide"
     - "Shall I" / "Should I"
     - "Do you want" / "Would you like"
  3. Use case-insensitive matching

- **Files**:
  - Modify: `tests/functional/src/harness/stream-parser.ts`

- **Parallel?**: Yes (pattern definition)

- **Example Patterns**:
```typescript
const QUESTION_PATTERNS: RegExp[] = [
  /\?$/,                    // Ends with question mark
  /could you/i,
  /would you like/i,
  /please (confirm|provide|specify)/i,
  /shall i/i,
  /should i/i,
  /do you want/i,
  /what would you prefer/i,
  /which (one|option)/i,
];
```

- **Notes**:
  - Start conservative, expand based on real sessions
  - Question mark at end of sentence is most reliable

### Subtask T007 – Add detectQuestion() function to stream-parser.ts

- **Purpose**: Encapsulate question detection logic in a reusable function.

- **Steps**:
  1. Create `detectQuestion(text: string): boolean` function
  2. Test text against all QUESTION_PATTERNS
  3. Return true on first match
  4. Export function for testing

- **Files**:
  - Modify: `tests/functional/src/harness/stream-parser.ts`

- **Parallel?**: No (depends on T006)

- **Example Implementation**:
```typescript
export function detectQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some(pattern => pattern.test(text));
}
```

### Subtask T008 – Emit question_detected event with message content

- **Purpose**: Notify listeners when a question is detected so the controller can respond.

- **Steps**:
  1. In StreamParser, after parsing assistant message, check for question
  2. If question detected, emit `question_detected` event
  3. Include full message content and any relevant context
  4. Add event type to StreamParser's event types

- **Files**:
  - Modify: `tests/functional/src/harness/stream-parser.ts`

- **Parallel?**: No (depends on T007)

- **Example Event**:
```typescript
interface QuestionDetectedEvent {
  type: 'question_detected';
  timestamp: Date;
  messageContent: string;
  assistantMessageId?: string;
}

// In parsing logic:
if (detectQuestion(assistantText)) {
  this.emit('question_detected', {
    type: 'question_detected',
    timestamp: new Date(),
    messageContent: assistantText
  });
}
```

### Subtask T009 – Track pending question state in parser

- **Purpose**: Track whether there's an unanswered question so controller knows when to inject.

- **Steps**:
  1. Add `pendingQuestion: string | null` state to StreamParser
  2. Set to message content when question detected
  3. Clear when user message is observed (question answered)
  4. Add getter method `hasPendingQuestion(): boolean`

- **Files**:
  - Modify: `tests/functional/src/harness/stream-parser.ts`

- **Parallel?**: No (depends on T008)

- **Notes**:
  - Only one pending question at a time (Claude waits for answer)
  - Clear state on any user message, not just specific answers

### Subtask T010 – Add question detection unit tests

- **Purpose**: Verify question detection works correctly with various inputs.

- **Steps**:
  1. Create test file `tests/functional/src/harness/__tests__/question-detection.test.ts`
  2. Test each pattern matches expected inputs
  3. Test false positives are avoided (rhetorical questions in explanations)
  4. Test event emission on question detection

- **Files**:
  - Create: `tests/functional/src/harness/__tests__/question-detection.test.ts`

- **Parallel?**: Yes (can write tests based on T006 patterns)

- **Example Tests**:
```typescript
describe('detectQuestion', () => {
  it('detects direct questions ending with ?', () => {
    expect(detectQuestion('What is your name?')).toBe(true);
  });

  it('detects permission requests', () => {
    expect(detectQuestion('Would you like me to proceed?')).toBe(true);
  });

  it('ignores rhetorical questions in middle of text', () => {
    // May need tuning based on real examples
    expect(detectQuestion('I will create the file. Ready.')).toBe(false);
  });
});
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positives on rhetorical questions | Require question mark at end of sentence, tune patterns |
| Missing real questions | Review session logs to find missed patterns |
| Event timing issues | Ensure event emitted after message fully parsed |
| Performance with many patterns | Use early exit on first match |

## Definition of Done Checklist

- [ ] T006: Question patterns defined
- [ ] T007: detectQuestion() function implemented
- [ ] T008: question_detected event emitted
- [ ] T009: Pending question state tracked
- [ ] T010: Unit tests pass
- [ ] All changes compile without TypeScript errors
- [ ] Existing 005 tests still pass (no regression)

## Review Guidance

- **Key Checkpoint**: Run unit tests and verify pattern matching
- **Verify**: Events are emitted at the right time (after full message parsed)
- **Verify**: Pending state is cleared when user message observed
- **Look For**: Edge cases with multi-part assistant messages

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
