---
work_package_id: WP02
title: MCP Server Application Metrics
lane: done
history:
- timestamp: '2025-12-04T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T09:53:44Z'
  lane: done
  agent: chatgpt
  shell_pid: ''
  action: Review accepted via /spec-kitty.review – FR-002/003/004/005 verified
agent: claude
assignee: claude
phase: Phase 2 - Application Metrics (P1)
shell_pid: '36921'
subtasks:
- T005
- T006
- T007
- T008
---

# Work Package Prompt: WP02 – MCP Server Application Metrics

## Objectives & Success Criteria

- **Primary Objective**: Instrument MCP tool calls with counters, histograms, and gauges
- **Success Criteria**:
  - `mcp_tool_calls_total` counter increments on each tool invocation
  - `mcp_tool_duration_seconds` histogram records accurate timing
  - `mcp_active_connections` gauge reflects current connection count
  - `mittwald_cli_calls_total` counter tracks CLI invocations

## Context & Constraints

- **Spec Reference**: `kitty-specs/004-prometheus-metrics-integration/spec.md` - FR-002, FR-003, FR-004, FR-005
- **Depends On**: WP01 (registry must exist)

**Architectural Constraints**:
- Use `startTimer()` pattern for accurate duration measurement
- Labels: `tool_name`, `status` (success/error), `command`
- Histogram buckets: [0.1, 0.5, 1, 2, 5, 10, 30] seconds

## Subtasks & Detailed Guidance

### Subtask T005 – Create mcp-metrics.ts

**Purpose**: Define all MCP-specific metrics in one module.

**Steps**:
1. Create `src/metrics/mcp-metrics.ts`:

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from './registry';

// Counter for total tool invocations
export const toolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool invocations',
  labelNames: ['tool_name', 'status'],
  registers: [register]
});

// Histogram for tool execution duration
export const toolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Duration of MCP tool executions in seconds',
  labelNames: ['tool_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

// Gauge for active MCP connections
export const activeConnections = new Gauge({
  name: 'mcp_active_connections',
  help: 'Number of currently active MCP connections',
  registers: [register]
});

// Counter for Mittwald CLI calls
export const cliCallsTotal = new Counter({
  name: 'mittwald_cli_calls_total',
  help: 'Total calls to Mittwald CLI',
  labelNames: ['command', 'status'],
  registers: [register]
});
```

2. Update `src/metrics/index.ts` to export these metrics:

```typescript
export { register } from './registry';
export * from './mcp-metrics';
```

**Files**:
- CREATE: `src/metrics/mcp-metrics.ts`
- MODIFY: `src/metrics/index.ts`

**Parallel?**: No (other subtasks depend on this)

### Subtask T006 – Instrument tool handler

**Purpose**: Track every tool invocation with timing and success/failure status.

**Steps**:
1. Locate the tool handler (likely `src/handlers/tool-handler.ts` or similar)
2. Import metrics: `import { toolCallsTotal, toolDuration } from '../metrics';`
3. Wrap tool execution with instrumentation:

```typescript
export async function handleToolCall(toolName: string, args: unknown) {
  const end = toolDuration.startTimer({ tool_name: toolName });

  try {
    const result = await executeToolLogic(toolName, args);
    toolCallsTotal.inc({ tool_name: toolName, status: 'success' });
    end(); // Records duration automatically
    return result;
  } catch (error) {
    toolCallsTotal.inc({ tool_name: toolName, status: 'error' });
    end();
    throw error;
  }
}
```

**Files**:
- MODIFY: `src/handlers/tool-handler.ts` (or equivalent)

**Parallel?**: No (depends on T005)

**Notes**:
- Find the actual tool execution entry point
- Ensure `end()` is called in both success and error paths
- The `startTimer()` returns a function that records elapsed time when called

### Subtask T007 – Instrument CLI wrapper

**Purpose**: Track calls to the Mittwald CLI for monitoring API usage.

**Steps**:
1. Locate CLI wrapper (likely `src/utils/cli-wrapper.ts`)
2. Import metrics: `import { cliCallsTotal } from '../metrics';`
3. Instrument CLI calls:

```typescript
export async function executeCliCommand(args: string[]): Promise<string> {
  const command = args[0] || 'unknown';

  try {
    const result = await execFile('mw', args);
    cliCallsTotal.inc({ command, status: 'success' });
    return result;
  } catch (error) {
    cliCallsTotal.inc({ command, status: 'error' });
    throw error;
  }
}
```

**Files**:
- MODIFY: `src/utils/cli-wrapper.ts`

**Parallel?**: Yes (can proceed alongside T008 after T005)

**Notes**:
- Extract command name from args for the label
- Consider using first 1-2 args as command identifier (e.g., "app list")

### Subtask T008 – Add active connections gauge

**Purpose**: Track the number of active MCP client connections.

**Steps**:
1. Locate transport/connection handling code (likely `src/transports/` or `src/server.ts`)
2. Import metrics: `import { activeConnections } from '../metrics';`
3. Increment on connection, decrement on disconnect:

```typescript
// On new connection
activeConnections.inc();

// On connection close
connection.on('close', () => {
  activeConnections.dec();
});
```

**Files**:
- MODIFY: `src/transports/*.ts` or connection handling code

**Parallel?**: Yes (can proceed alongside T007 after T005)

**Notes**:
- Ensure decrement happens in all disconnect scenarios (clean close, error, timeout)
- Initialize gauge to 0 on startup

## Test Strategy

Manual verification:
```bash
# Start server and make tool calls
curl -X POST http://localhost:3000/mcp -d '{"method":"tools/call","params":{"name":"app_list"}}'

# Check metrics
curl http://localhost:3000/metrics | grep mcp_

# Expected output:
# mcp_tool_calls_total{tool_name="app_list",status="success",service="mcp-server"} 1
# mcp_tool_duration_seconds_bucket{tool_name="app_list",le="0.1",...} 0
# mcp_active_connections{service="mcp-server"} 1
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tool handler structure varies | Search for tool dispatch/execution logic |
| High cardinality from tool names | ~170 known tools is bounded; acceptable |
| Timer not called on error | Ensure `end()` in finally block or catch |

## Definition of Done Checklist

- [x] `mcp-metrics.ts` created with all four metrics
- [x] Tool handler instrumented with counter and histogram
- [x] CLI wrapper instrumented with counter
- [x] Connection tracking implemented with gauge
- [x] All metrics visible in `/metrics` output after usage

## Review Guidance

- Verify `end()` is called in all code paths (success and error)
- Check label values are consistent and bounded
- Ensure no duplicate instrumentation (metrics counted twice)
- Verify histogram buckets cover expected latency range

## Activity Log

- 2025-12-04T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-04T09:35:00Z – claude – lane=doing – Started implementation
- 2025-12-04T09:40:00Z – claude – lane=done – Completed all subtasks (T005-T008), committed 890ca4a
- 2025-12-04T09:53:44Z – chatgpt – lane=done – Review accepted via /spec-kitty.review – FR-002/003/004/005 verified

## Review Report (2025-12-04T09:53:44Z by chatgpt)

**Outcome**: ACCEPTED (remains in done)

### Findings
- Metrics definitions align with spec: counters/histogram/gauge names match FR-002/FR-003/FR-004/FR-005 with the required labels and buckets.
- Instrumentation is wired in the correct execution paths: `handleToolCall` wraps execution with histogram timer and increments status counters; CLI wrapper increments success/error counters; active connection gauge increments/decements on session lifecycle events.
- Service label applied via custom registry so Prometheus output is properly annotated.

### Notes
- No blockers. Integration tests for `/metrics` behavior will be covered by WP06; consider adding a smoke curl check in that work.
