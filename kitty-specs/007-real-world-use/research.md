# Technical Research: Real-World Use Case Functional Testing

**Date**: 2025-12-05
**Feature**: 007-real-world-use

## Research Questions

1. How can the controller communicate with a running Claude session?
2. How does the existing 005 harness work?
3. What is the stream-json format for bidirectional communication?

## Findings

### 1. Bidirectional Streaming via stdin/stdout

**Discovery**: Claude CLI supports `--input-format stream-json` combined with `--output-format stream-json` for bidirectional communication.

**Key Insight**: The existing 005 harness spawns Claude with `stdio: ['pipe', 'pipe', 'pipe']` but only uses stdout/stderr. The stdin pipe is already available but unused.

**Implementation Approach**:
- Monitor stdout for assistant messages (already done by StreamParser)
- Detect questions in assistant messages via pattern matching
- Inject user responses via stdin write

**Message Format for Injection**:
```json
{"type": "user", "message": {"role": "user", "content": "Yes, please proceed"}}
```

### 2. Existing 005 Harness Architecture

**Session Runner** (`tests/functional/src/harness/session-runner.ts`):
```typescript
const childProcess: ChildProcess = spawn('claude', args, {
  stdio: ['pipe', 'pipe', 'pipe'],  // stdin already piped!
  cwd: options.workingDir,
  env: { ...process.env, ...options.env },
});
```

**Key Components**:
- `SessionRunner`: Spawns Claude CLI process, returns ChildProcess
- `StreamParser`: Parses JSONL stream events, tracks patterns
- `Coordinator`: Uses Haiku meta-agent to analyze state and decide actions

**Event Types Tracked by StreamParser**:
- `message`: Text output from Claude
- `tool_use`: Tool invocation
- `tool_result`: Tool response
- `error`: Error events
- `result`: Final result

**Pattern Detection** (existing):
- Consecutive errors threshold (MAX_CONSECUTIVE_ERRORS=3)
- Idle time threshold (MAX_IDLE_TIME_MS=60000)
- Repeated tool calls (MAX_SAME_TOOL_REPEATS=5)

### 3. Question Detection Strategy

**Patterns to Detect**:
- Direct questions: Contains `?`
- Permission requests: "Could you", "Would you like", "Do you want"
- Confirmation requests: "Please confirm", "Is this correct"
- Clarification requests: "Can you clarify", "What do you mean"

**Implementation**:
```typescript
const QUESTION_PATTERNS = [
  /\?/,
  /could you/i,
  /would you like/i,
  /do you want/i,
  /please confirm/i,
  /shall i/i,
];

function detectQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some(pattern => pattern.test(text));
}
```

### 4. Response Injection Protocol

**Process**:
1. StreamParser detects question in assistant message
2. Controller evaluates: answer, skip, or escalate
3. If answering, write JSON to stdin
4. Continue monitoring stdout

**Code Example**:
```typescript
function injectResponse(childProcess: ChildProcess, response: string): void {
  const message = JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: response
    }
  });
  childProcess.stdin?.write(message + '\n');
}
```

### 5. Tool Inventory (from 005)

**Total Tools**: 170+

**Domains** (from `tests/functional/src/inventory/grouping.ts`):
1. `identity` - User authentication and profile
2. `organization` - Organization management
3. `project-foundation` - Project CRUD operations
4. `apps` - Application deployment and management
5. `containers` - Container orchestration
6. `databases` - Database provisioning
7. `domains-mail` - Domain and email configuration
8. `access-users` - Access control and user permissions
9. `automation` - Cronjobs and automation
10. `backups` - Backup and restore operations

**Coverage Tracking**:
- Session logs record all tool invocations
- Can parse logs to extract `tool_use` events
- Compare against full inventory for gaps

### 6. Session Log Format

**JSONL Structure**:
```jsonl
{"type": "user", "message": {"role": "user", "content": "Deploy a PHP app"}}
{"type": "assistant", "message": {"content": [{"type": "text", "text": "I'll help..."}]}}
{"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "mcp__mittwald__app/create", ...}]}}
{"type": "tool_result", "content": "..."}
```

**Key Fields**:
- `type`: Event type (user, assistant, tool_result)
- `message.content`: Array of content blocks
- `content[].type`: "text" or "tool_use"
- `content[].name`: Tool name for tool_use events

## Conclusions

1. **Bidirectional communication is feasible** using existing stdin pipe
2. **No framework changes needed** - extend existing harness components
3. **Question detection via pattern matching** is straightforward
4. **Coverage tracking** can reuse session log infrastructure
5. **006 analysis pipeline** accepts JSONL format we already produce

## References

- 005 Harness: `tests/functional/src/harness/`
- 006 Analysis: `tests/functional/src/analysis/`
- Tool Inventory: `tests/functional/src/inventory/`
- Session Logs: `tests/functional/session-logs/005-mcp-functional-test/`
