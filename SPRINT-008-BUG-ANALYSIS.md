# Sprint 008: Root Cause Analysis - Why toolsInvoked[] is Empty

## Executive Summary

Sprint 007 has **working code** to extract tool calls, but it's checking the wrong data location. This is a **parsing bug**, not a missing instrumentation problem.

**Impact**: All 31 execution results have `toolsInvoked: []` empty, even though the session logs contain 60+ tool calls each.

---

## Root Cause

### The Bug Location

**File**: `/Users/robert/Code/mittwald-mcp/tests/functional/src/use-cases/executor.ts`
**Lines**: 427-434

```typescript
// CURRENT CODE (BROKEN)
if (event.type === 'tool_use') {
  const content = event.content as Record<string, unknown>;
  const toolName = content.name as string;
  if (toolName) {
    toolsInvoked.add(toolName);
    controller.recordToolCall(toolName);
  }
}
```

### Why It Fails

The SessionRunner (line 40 in `session-runner.ts`) parses JSONL stream lines and sets:
```typescript
type: parsed.type || 'message'
```

This means `event.type` is set to the **top-level JSON field** from the JSONL:
- `type: "system"`
- `type: "assistant"`
- `type: "user"`
- `type: "result"`

**NOT** `type: "tool_use"` because tool_use is NESTED inside content, not at the top level.

### Evidence from Sample Log

Analysis of `/Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/apps-001-deploy-php-app-2025-12-05T18-59-15.jsonl`:

```
Event types at top level:
  system: 1
  assistant: 119
  user: 67
  result: 1

Tool uses at top level (event.type === 'tool_use'): 0 ← NOTHING MATCHES
Tool uses in assistant message content: 66 ← ACTUAL DATA HERE
```

### JSONL Structure

```json
{
  "type": "assistant",
  "message": {
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_01C448Xq1J9FrmtBZtZGQ88p",
        "name": "mcp__mittwald__mittwald_project_list",
        "input": {}
      }
    ]
  }
}
```

The tool_use is **inside** `message.content[]`, not at the top level.

---

## The Fix

Replace lines 427-434 in `executor.ts`:

```typescript
// FIXED CODE
if (event.type === 'assistant') {
  // Extract tool_use from message content
  const message = (event.content as Record<string, unknown>).message as Record<string, unknown>;
  if (message?.content && Array.isArray(message.content)) {
    for (const item of message.content) {
      if (typeof item === 'object' && item !== null && (item as Record<string, unknown>).type === 'tool_use') {
        const toolName = (item as Record<string, unknown>).name as string;
        if (toolName) {
          toolsInvoked.add(toolName);
          controller.recordToolCall(toolName);
        }
      }
    }
  }
}

// Also handle tool results
if (event.type === 'user') {
  // Extract tool_result from message content to track result metadata
  const message = (event.content as Record<string, unknown>).message as Record<string, unknown>;
  if (message?.content && Array.isArray(message.content)) {
    for (const item of message.content) {
      if (typeof item === 'object' && item !== null && (item as Record<string, unknown>).type === 'tool_result') {
        // Tool result tracking can be added here if needed
        // For now, this just documents the pattern
      }
    }
  }
}
```

---

## Implementation Approach Decision

Based on JSONL investigation, **Option C (Post-Processing Pipeline)** is the clear winner:

**Why**:
1. ✅ Data is ALREADY in session logs (no new collection needed)
2. ✅ Fix is isolated to parser logic only (executor.ts)
3. ✅ Can validate fix immediately against existing 31 logs
4. ✅ Preserves test harness stability for re-execution
5. ✅ Quick turnaround: ~1-2 hours to implement and test

**Implementation Tasks**:
1. Fix executor.ts tool extraction logic (lines 427-434)
2. Rebuild project (`npm run build`)
3. Test fix on sample 10% of existing logs to verify extraction works
4. Spot-check 100% accuracy on extracted vs. manual review
5. Once verified, proceed with prompt rewriting (WP3)

---

## Metrics Impact

Once fixed, each execution will populate `toolsInvoked[]` with complete tool metadata:

**Sample from Current (Broken) State**:
```json
{
  "toolsInvoked": []  ← Empty
}
```

**Expected After Fix**:
```json
{
  "toolsInvoked": [
    "mcp__mittwald__mittwald_project_list",
    "mcp__mittwald__mittwald_app_create_php",
    "mcp__mittwald__mittwald_database_mysql_create"
  ]
}
```

This enables all downstream analysis: pattern classification, baseline metrics, validation.

---

## Timeline

**WP1 Implementation**: 2-4 hours
- Fix executor parsing logic
- Rebuild and test on sample logs
- Verify 100% accuracy

**Validation**: 1-2 hours
- Run full 31 logs through fixed extractor
- Spot-check results
- Generate baseline metrics

**Total WP1-2**: 4-6 hours (Ready for WP3 prompt rewriting)
