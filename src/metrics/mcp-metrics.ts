import { Counter, Histogram, Gauge } from 'prom-client';
import { register, metricsEnabled } from './registry.js';
import * as v8 from 'v8';

// Only register metrics if enabled
const registries = metricsEnabled ? [register] : [];

// Counter for total tool invocations
export const toolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool invocations',
  labelNames: ['tool_name', 'status'],
  registers: registries
});

// Histogram for tool execution duration
export const toolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Duration of MCP tool executions in seconds',
  labelNames: ['tool_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: registries
});

// Gauge for active MCP connections/sessions
export const activeConnections = new Gauge({
  name: 'mcp_active_connections',
  help: 'Number of currently active MCP connections',
  registers: registries
});

// Counter for Mittwald CLI calls
export const cliCallsTotal = new Counter({
  name: 'mittwald_cli_calls_total',
  help: 'Total calls to Mittwald CLI',
  labelNames: ['command', 'status'],
  registers: registries
});

// Gauge for in-flight Mittwald CLI processes (helps diagnose resource contention / OOM)
export const cliInflight = new Gauge({
  name: 'mcp_cli_inflight',
  help: 'Number of in-flight Mittwald CLI executions',
  registers: registries
});

// Gauge for queued Mittwald CLI executions waiting for a concurrency slot
export const cliQueueDepth = new Gauge({
  name: 'mcp_cli_queue_depth',
  help: 'Number of queued Mittwald CLI executions waiting for a slot',
  registers: registries
});

// Histogram for time spent waiting for a CLI concurrency slot
export const cliQueueWait = new Histogram({
  name: 'mcp_cli_queue_wait_seconds',
  help: 'Time spent waiting for a Mittwald CLI concurrency slot in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: registries
});

// Histogram for memory usage per tool
export const toolMemoryDelta = new Histogram({
  name: 'mcp_tool_memory_delta_mb',
  help: 'Memory change during tool execution in MB',
  labelNames: ['tool_name'],
  buckets: [0.1, 1, 5, 10, 25, 50, 100],
  registers: registries
});

// Gauge for current memory pressure level
export const memoryPressure = new Gauge({
  name: 'mcp_memory_pressure_percent',
  help: 'Current heap usage as percentage',
  registers: registries
});

// Gauge for Node.js heap size limit (for verifying --max-old-space-size flag)
export const heapSizeLimit = new Gauge({
  name: 'nodejs_heap_size_limit_bytes',
  help: 'Maximum heap size limit from V8 in bytes',
  registers: registries,
  collect() {
    // Update the gauge with current heap_size_limit from v8
    const stats = v8.getHeapStatistics();
    this.set(stats.heap_size_limit);
  }
});
