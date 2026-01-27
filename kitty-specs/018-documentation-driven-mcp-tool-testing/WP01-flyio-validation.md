# WP01 Follow-up: Fly.io Log Validation (T005)

**Status**: Pending manual validation
**Created**: 2026-01-27
**Purpose**: Validate that WP01's structured logging works on Fly.io production environment

## Background

WP01 implemented Pino structured logging for MCP tool call tracking. The implementation was:
- Merged to main: commit da2c6744
- Pushed to GitHub: triggers automatic Fly.io deployment via GitHub Actions
- Deployment target: `mittwald-mcp-fly2.fly.dev`

## Validation Steps

### 1. Wait for Deployment

Wait for GitHub Actions to complete deployment (usually 2-5 minutes after push):

```bash
# Check deployment workflow status
gh workflow list --repo robertDouglass/mittwald-mcp
gh run list --repo robertDouglass/mittwald-mcp --limit 3
gh run watch  # Monitor active deployment
```

### 2. Trigger a Test Tool Call

Connect to Fly.io MCP server and make a test tool call:

```bash
# Start Claude Code CLI session with Fly.io MCP server
# (Requires authentication - see CLAUDE.md for auth setup)
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp

# Then in Claude Code CLI, trigger a simple tool call:
# Example: "Get my user information" → calls mittwald_user_get
```

### 3. Fetch and Verify Logs

Retrieve logs from Fly.io and verify structured JSON output:

```bash
# Fetch last 50 lines of logs
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50

# Look for structured JSON logs with these fields:
# - event: "tool_call_start" | "tool_call_success" | "tool_call_error"
# - toolName: "mittwald_user_get" (or whatever tool was called)
# - sessionId: UUID string
# - performance: { durationMs, memoryDeltaMB, memoryPressurePct }
# - input.arguments: Should show [REDACTED] for access_token

# Verify NO sensitive data exposed:
grep -i "access_token.*mittwald" <(flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -100)
# Should return: access_token: '[REDACTED:hash]' (NOT the actual token)
```

### 4. Validation Checklist

- [ ] GitHub Actions deployment completed successfully
- [ ] MCP server is running on Fly.io (health check passes)
- [ ] At least one tool call log visible in `flyctl logs`
- [ ] Log is valid JSON (parseable)
- [ ] Required fields present: `event`, `toolName`, `sessionId`, `performance`
- [ ] Sensitive data redacted: `access_token` shows `[REDACTED:hash]` not actual value
- [ ] No errors in logs related to Pino or structured logging

## Expected Log Format

### Tool Call Start (debug level)
```json
{
  "level": "debug",
  "time": 1706356800000,
  "event": "tool_call_start",
  "toolName": "mittwald_user_get",
  "toolDomain": "user",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "arguments": {}
  },
  "msg": "Tool call initiated"
}
```

### Tool Call Success (info level)
```json
{
  "level": "info",
  "time": 1706356801234,
  "event": "tool_call_success",
  "toolName": "mittwald_user_get",
  "toolDomain": "user",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "output": {
    "status": "success",
    "resultSize": 1234
  },
  "performance": {
    "durationMs": 234,
    "memoryDeltaMB": 12.5,
    "memoryPressurePct": 45.2
  },
  "context": {
    "nodeVersion": "v24.11.0",
    "serverUptime": 3600
  },
  "msg": "Tool call completed"
}
```

### Tool Call Error (error level)
```json
{
  "level": "error",
  "time": 1706356802000,
  "event": "tool_call_error",
  "toolName": "mittwald_app_list",
  "toolDomain": "app",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "output": {
    "status": "error",
    "errorMessage": "Missing required parameter: projectId",
    "errorCode": "VALIDATION_ERROR"
  },
  "performance": {
    "durationMs": 5
  },
  "msg": "Tool call failed"
}
```

## Success Criteria

This validation task is complete when:

1. ✅ Deployment to Fly.io confirmed successful
2. ✅ At least one structured JSON log entry visible in `flyctl logs`
3. ✅ Log contains all required fields (`event`, `toolName`, `sessionId`, `performance`)
4. ✅ Sensitive data properly redacted (OAuth tokens show `[REDACTED:hash]`)
5. ✅ No Pino-related errors in logs
6. ✅ Log format matches `evals/docs/log-format.md` specification

## Documentation Output

Once validated, create `evals/docs/log-format.md` documenting the exact log structure for WP03 (Coverage Tracking) to parse:

```markdown
# MCP Tool Call Log Format

Structured logs from Pino for tracking MCP tool calls.

## Log Levels
- `debug`: tool_call_start events (high frequency)
- `info`: tool_call_success events
- `error`: tool_call_error events

## Common Fields
- `event`: "tool_call_start" | "tool_call_success" | "tool_call_error"
- `toolName`: Full MCP tool name (e.g., "mittwald_app_list")
- `toolDomain`: Extracted domain (e.g., "app")
- `sessionId`: UUID for correlating related calls
- `performance`: { durationMs, memoryDeltaMB?, memoryPressurePct? }

## Log Sources by Target
- **Local**: Parse from subprocess stdout
- **Fly.io**: Parse from `flyctl logs -a mittwald-mcp-fly2`
- **mittwald.de**: No log access - outcome validation only

## Parsing Example
\`\`\`typescript
const logs = await fetchFlyioLogs(sessionId);
const toolsCalled = logs
  .filter(log => log.event === 'tool_call_success')
  .map(log => log.toolName);
\`\`\`
```

## Next Steps

After T005 validation completes:

1. ✅ Mark WP01 as fully validated (including Fly.io)
2. 🔄 Proceed with **Step 3**: Implement WP02 with multi-target architecture
3. 🔄 Proceed with **Step 4**: Update Feature 018 documentation with multi-target strategy

## References

- WP01 Implementation: commit 8509b469
- WP01 Merge: commit da2c6744
- Research: `kitty-specs/018-documentation-driven-mcp-tool-testing/research.md`
- Data Model: `kitty-specs/018-documentation-driven-mcp-tool-testing/data-model.md`
- CLAUDE.md: Operations checklist for Fly.io logs
