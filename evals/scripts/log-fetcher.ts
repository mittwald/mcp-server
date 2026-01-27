/**
 * Log fetcher abstraction for multi-target tool call tracking.
 *
 * Supports three log sources:
 * - Local: Parse from subprocess stdout
 * - Fly.io: Fetch from `flyctl logs`
 * - mittwald.de: No logs available (outcome validation only)
 */

import { execSync } from 'child_process';
import type { TestTarget } from '../config/test-targets.js';

/**
 * MCP tool call log entry (from WP01 structured logging).
 */
export interface MCPToolCallLog {
  event: 'tool_call_start' | 'tool_call_success' | 'tool_call_error';
  toolName: string;
  toolDomain: string;
  sessionId: string;
  performance?: {
    durationMs: number;
    memoryDeltaMB?: number;
    memoryPressurePct?: number;
  };
  output?: {
    status: string;
    errorMessage?: string;
    resultSize?: number;
  };
}

/**
 * Fetch tool call logs for a given session.
 *
 * @param target - Test target (determines log source)
 * @param sessionId - Session ID to filter logs
 * @param localLogBuffer - For local target: captured stdout from subprocess
 * @returns Array of parsed tool call logs
 */
export async function fetchToolCallLogs(
  target: TestTarget,
  sessionId: string,
  localLogBuffer?: string
): Promise<MCPToolCallLog[]> {
  switch (target.logSource) {
    case 'local':
      return parseLogsFromBuffer(localLogBuffer || '', sessionId);

    case 'flyctl':
      return fetchLogsFromFlyio(sessionId);

    case 'outcome-validation':
      // No logs available for mittwald.de
      // Coverage tracked via outcome validation instead
      return [];

    default:
      throw new Error(`Unknown log source: ${target.logSource}`);
  }
}

/**
 * Parse structured JSON logs from local subprocess output.
 *
 * Looks for Pino JSON logs matching the sessionId.
 *
 * @param logBuffer - Raw stdout/stderr from subprocess
 * @param sessionId - Session ID to filter
 * @returns Parsed tool call logs
 */
function parseLogsFromBuffer(
  logBuffer: string,
  sessionId: string
): MCPToolCallLog[] {
  const logs: MCPToolCallLog[] = [];

  // Split by newlines and attempt to parse each as JSON
  const lines = logBuffer.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line);

      // Check if this is a tool call log with matching sessionId
      if (
        parsed.event &&
        parsed.event.startsWith('tool_call_') &&
        parsed.sessionId === sessionId
      ) {
        logs.push({
          event: parsed.event,
          toolName: parsed.toolName,
          toolDomain: parsed.toolDomain || 'unknown',
          sessionId: parsed.sessionId,
          performance: parsed.performance,
          output: parsed.output,
        });
      }
    } catch (error) {
      // Not JSON or not a structured log - skip
      continue;
    }
  }

  return logs;
}

/**
 * Fetch logs from Fly.io using `flyctl logs`.
 *
 * Executes: `flyctl logs -a mittwald-mcp-fly2 | grep sessionId`
 *
 * @param sessionId - Session ID to filter
 * @returns Parsed tool call logs
 */
function fetchLogsFromFlyio(sessionId: string): MCPToolCallLog[] {
  try {
    // Fetch logs from Fly.io (last 1000 lines, filter by sessionId)
    const command = `flyctl logs -a mittwald-mcp-fly2 --no-tail | grep "${sessionId}"`;

    const output = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000, // 30s timeout
    });

    // Parse the Fly.io log format
    // Fly.io logs are: [timestamp] app[machine-id] [region] [level]<json>
    // We need to extract the JSON part after [level]
    const logs: MCPToolCallLog[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        // Find the JSON part (starts with '{' after the log prefix)
        const jsonStart = line.indexOf('{');
        if (jsonStart === -1) continue;

        const jsonPart = line.substring(jsonStart);
        const parsed = JSON.parse(jsonPart);

        if (
          parsed.event &&
          parsed.event.startsWith('tool_call_') &&
          parsed.sessionId === sessionId
        ) {
          logs.push({
            event: parsed.event,
            toolName: parsed.toolName,
            toolDomain: parsed.toolDomain || 'unknown',
            sessionId: parsed.sessionId,
            performance: parsed.performance,
            output: parsed.output,
          });
        }
      } catch (error) {
        // Failed to parse this line - skip
        continue;
      }
    }

    return logs;
  } catch (error) {
    console.warn(
      `Failed to fetch logs from Fly.io: ${error instanceof Error ? error.message : String(error)}`
    );
    console.warn(`Continuing with empty log set (tool coverage may be incomplete)`);
    return [];
  }
}

/**
 * Extract tool names called during a scenario.
 *
 * Filters for successful tool calls only (tool_call_success events).
 *
 * @param logs - Tool call logs
 * @returns Array of unique tool names
 */
export function extractToolNames(logs: MCPToolCallLog[]): string[] {
  const toolNames = logs
    .filter((log) => log.event === 'tool_call_success')
    .map((log) => log.toolName);

  // Return unique tool names
  return Array.from(new Set(toolNames));
}
