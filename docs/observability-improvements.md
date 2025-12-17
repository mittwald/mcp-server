# Observability Improvements for OOM Diagnosis

## Current State

**We have:**
- ✅ Tool execution duration (histogram)
- ✅ Tool call counts by status
- ✅ Active connections gauge
- ✅ Process memory metrics (Node.js default)
- ✅ Event loop lag metrics
- ✅ CLI command counts

**Gaps:**
- ❌ No memory usage per tool execution
- ❌ No CLI subprocess memory tracking
- ❌ No slow operation alerts in logs
- ❌ No request correlation IDs
- ❌ No memory high-water marks per tool
- ❌ No graceful degradation when memory is high

## Recommended Improvements

### 1. Per-Tool Memory Metrics

**Add memory tracking around each tool execution:**

```typescript
// In tool-handlers.ts
const memBefore = process.memoryUsage();
const result = await handler(request.params.arguments);
const memAfter = process.memoryUsage();

toolMemoryUsage.observe({
  tool_name: toolName
}, (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024); // MB
```

**Metrics to add:**
- `mcp_tool_memory_delta_mb` (histogram) - Memory change per tool call
- `mcp_tool_memory_peak_mb` (gauge) - Peak memory during tool execution

### 2. CLI Subprocess Memory Tracking

**Track child process memory in cli-wrapper.ts:**

```typescript
import { spawn } from 'child_process';
import pidusage from 'pidusage'; // npm install pidusage

// Sample memory every 100ms during CLI execution
const memorySnapshots: number[] = [];
const interval = setInterval(async () => {
  const stats = await pidusage(child.pid);
  memorySnapshots.push(stats.memory / 1024 / 1024); // MB
}, 100);

// After execution:
cliSubprocessMemoryPeak.observe({
  command: cliCommand
}, Math.max(...memorySnapshots));
```

**Metrics to add:**
- `cli_subprocess_memory_peak_mb` (histogram) - Peak memory per CLI call
- `cli_subprocess_duration_seconds` (histogram) - Already have via tool_duration

### 3. Slow Operation Logging

**Add warnings when operations exceed thresholds:**

```typescript
const SLOW_TOOL_THRESHOLD_MS = 5000; // 5 seconds
const VERY_SLOW_TOOL_THRESHOLD_MS = 30000; // 30 seconds

if (durationMs > VERY_SLOW_TOOL_THRESHOLD_MS) {
  logger.warn(`🐌 VERY SLOW tool execution`, {
    tool: toolName,
    durationMs,
    memoryUsedMB: memoryDelta,
    sessionId
  });
} else if (durationMs > SLOW_TOOL_THRESHOLD_MS) {
  logger.info(`⏱️  Slow tool execution`, {
    tool: toolName,
    durationMs,
    sessionId
  });
}
```

### 4. Request Correlation IDs

**Add correlation IDs to trace requests through the system:**

```typescript
// Generate unique ID per tool call
const correlationId = `${toolName}-${Date.now()}-${Math.random().toString(36)}`;

logger.info(`[${correlationId}] Tool started`, { tool: toolName });
// ... execution ...
logger.info(`[${correlationId}] Tool completed`, {
  tool: toolName,
  duration: durationMs
});
```

### 5. Memory Pressure Detection

**Add proactive memory monitoring:**

```typescript
function checkMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
  const usage = process.memoryUsage();
  const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;

  if (heapPercent > 90) return 'critical';
  if (heapPercent > 75) return 'high';
  if (heapPercent > 50) return 'medium';
  return 'low';
}

// Before executing expensive operations:
const pressure = checkMemoryPressure();
if (pressure === 'critical') {
  logger.error('⚠️  CRITICAL memory pressure, rejecting new operations');
  throw new Error('Server under memory pressure, please try again');
}
```

### 6. Structured Error Context

**When errors occur, capture full context:**

```typescript
catch (error) {
  logger.error('Tool execution failed', {
    tool: toolName,
    error: error.message,
    stack: error.stack,
    memoryUsage: process.memoryUsage(),
    activeConnections: activeConnectionsCount,
    uptime: process.uptime(),
    correlationId
  });
}
```

### 7. Grafana Dashboard Queries

**For Prometheus/Grafana visualization:**

```promql
# Memory usage trend
process_resident_memory_bytes{service="mcp-server"}

# Top memory-consuming tools
topk(10, sum by (tool_name) (mcp_tool_memory_delta_mb_sum))

# Slow tools (>5s)
sum(rate(mcp_tool_duration_seconds_bucket{le="5"}[5m])) by (tool_name)

# CLI subprocess memory spikes
cli_subprocess_memory_peak_mb > 200
```

## Implementation Priority

### High Priority (Do Now)
1. **Per-tool memory tracking** - Essential for finding memory leaks
2. **Slow operation logging** - Immediate visibility into problems
3. **Memory pressure detection** - Prevent OOMs proactively

### Medium Priority (This Week)
4. **Request correlation IDs** - Better debugging
5. **Structured error context** - Better error reports
6. **CLI subprocess memory tracking** - Identify subprocess leaks

### Low Priority (Nice to Have)
7. **Grafana dashboards** - Visual monitoring

## Expected Outcomes

After implementing these improvements, when an OOM occurs we'll know:
- ✅ Which tool was executing
- ✅ How much memory it was using
- ✅ How long it had been running
- ✅ What the memory pressure was at the time
- ✅ The full request context
- ✅ Memory trend leading up to the OOM

This will make root cause analysis trivial instead of guesswork.
