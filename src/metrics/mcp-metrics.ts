import { Counter, Histogram, Gauge } from 'prom-client';
import { register, metricsEnabled } from './registry.js';

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
