/**
 * Session Log Parser
 *
 * Parses JSONL session log files into structured Session objects.
 * Implements T004: JSONL Parser and T006: Domain Grouping Integration.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { Session, Event, EventType, ToolCall, ToolResult, TokenUsage, SessionOutcome } from '../types.js';
import type { TestDomain } from '../../types/index.js';
import type {
  RawEvent,
  RawUserEvent,
  RawAssistantEvent,
  RawToolUseBlock,
  RawToolResultBlock,
  RawContentBlock,
  ParseStats,
} from './types.js';
import { mapToolToDomain } from '../../inventory/grouping.js';
import { parseToolName } from '../../inventory/discovery.js';

// =============================================================================
// Constants
// =============================================================================

const MCP_TOOL_PATTERN = /mcp__mittwald__\w+/;
const TARGET_TOOL_PATTERN = /testing the MCP tool "([^"]+)"/;

// =============================================================================
// Main Parser Functions
// =============================================================================

/**
 * Result of parsing a session file, including error bookkeeping.
 */
export interface ParseSessionResult {
  session: Session;
  stats: {
    totalLines: number;
    parsedLines: number;
    errors: Array<{ line: number; error: string }>;
  };
}

/**
 * Parse a single JSONL session file into a Session object.
 *
 * @param filePath Absolute path to the JSONL file
 * @returns Parsed Session object
 */
export async function parseSessionFile(filePath: string): Promise<Session> {
  const { session } = await parseSessionFileWithStats(filePath);
  return session;
}

/**
 * Parse a single JSONL session file and return parse stats.
 *
 * Errors are collected (file:line:message) so the caller can surface error rates.
 */
export async function parseSessionFileWithStats(filePath: string): Promise<ParseSessionResult> {
  const content = readFileSync(filePath, 'utf-8');
  const rawLines = content.split('\n');
  const lines = rawLines.filter(line => line.trim());

  const events: Event[] = [];
  const errors: Array<{ line: number; error: string }> = [];
  let sessionId = '';
  let targetTool = '';
  let parentSessionId: string | undefined;
  let parentEventUuid: string | undefined;
  let isSubAgent = false;

  // Parse each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const rawEvent = JSON.parse(line) as RawEvent;

      // Extract session ID from first event
      // Sub-agent logs use their agentId as their unique ID to avoid collisions
      if (i === 0) {
        isSubAgent = rawEvent.agentId !== undefined;
        if (isSubAgent && rawEvent.agentId) {
          // Sub-agent: use agentId as session ID, store parent's sessionId
          sessionId = rawEvent.agentId;
          parentSessionId = rawEvent.sessionId;
        } else {
          // Main session: use sessionId directly
          sessionId = rawEvent.sessionId;
        }
      }

      // Capture parent event UUID if present (used to resolve orphaned sub-agents)
      if (!parentEventUuid && rawEvent.parentUuid) {
        parentEventUuid = rawEvent.parentUuid;
      }

      // Parse the event
      const event = parseEvent(rawEvent, i);
      if (event) {
        events.push(event);

        // Extract target tool from first user message
        if (!targetTool && event.type === 'user' && event.message?.content) {
          const extracted = extractTargetTool(event.message.content);
          if (extracted) {
            targetTool = extracted;
          }
        }
      }
    } catch (err) {
      errors.push({
        line: i + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Calculate metrics
  const metrics = calculateMetrics(events);

  // Determine domain from target tool
  const domain = targetTool ? mapToolToDomain(targetTool) : 'project-foundation';

  // Determine outcome
  const outcome = determineOutcome(events);

  // Build session object
  const session: Session = {
    id: sessionId || basename(filePath, '.jsonl'),
    filePath,
    targetTool,
    domain,
    events,
    subAgents: [],
    parentSessionId,
    parentEventUuid,
    startTime: metrics.startTime,
    endTime: metrics.endTime,
    durationMs: metrics.durationMs,
    totalTokens: metrics.totalTokens,
    toolCallCount: metrics.toolCallCount,
    errorCount: metrics.errorCount,
    outcome,
  };

  // Warn on parse errors for visibility
  if (errors.length > 0) {
    console.warn(`[parser] ${basename(filePath)} had ${errors.length} parse errors`);
  }

  return {
    session,
    stats: {
      totalLines: lines.length,
      parsedLines: events.length,
      errors,
    },
  };
}

/**
 * Parse all session files in a directory.
 *
 * @param inputDir Directory containing JSONL files
 * @returns Array of parsed sessions and parse statistics
 */
export async function parseDirectory(inputDir: string): Promise<{
  sessions: Session[];
  stats: ParseStats;
}> {
  const files = readdirSync(inputDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => join(inputDir, f));

  const sessions: Session[] = [];
  const errors: Array<{ filePath?: string; line: number; error: string }> = [];
  let totalLines = 0;
  let parsedLines = 0;
  let errorLines = 0;

  for (const file of files) {
    try {
      const result = await parseSessionFileWithStats(file);
      sessions.push(result.session);
      totalLines += result.stats.totalLines;
      parsedLines += result.stats.parsedLines;
      errorLines += result.stats.errors.length;
      for (const err of result.stats.errors) {
        errors.push({ ...err, filePath: basename(file) });
      }
    } catch (err) {
      errors.push({
        line: 0,
        filePath: basename(file),
        error: `Failed to parse ${basename(file)}: ${err instanceof Error ? err.message : String(err)}`,
      });
      errorLines++;
    }
  }

  return {
    sessions,
    stats: {
      totalLines,
      parsedLines,
      errorLines,
      errors,
    },
  };
}

// =============================================================================
// Event Parsing
// =============================================================================

/**
 * Parse a raw event into a structured Event object.
 */
function parseEvent(raw: RawEvent, index: number): Event | null {
  const timestamp = new Date(raw.timestamp);
  const type = mapEventType(raw.type);

  const event: Event = {
    type,
    timestamp,
    raw: (raw as unknown) as Record<string, unknown>,
  };

  // Parse type-specific content
  if (raw.type === 'assistant') {
    const assistantEvent = raw as RawAssistantEvent;

    // Extract tool calls from content
    if (assistantEvent.message?.content && Array.isArray(assistantEvent.message.content)) {
      const toolUseBlocks = (assistantEvent.message.content as RawContentBlock[])
        .filter((b): b is RawToolUseBlock => b.type === 'tool_use');

      if (toolUseBlocks.length > 0) {
        const firstToolUse = toolUseBlocks[0];
        event.toolCall = {
          id: firstToolUse.id,
          name: firstToolUse.name,
          input: firstToolUse.input || {},
        };
        event.type = 'tool_use';
      }

      // Extract text content for message
      const textBlocks = (assistantEvent.message.content as RawContentBlock[])
        .filter((b): b is { type: 'text'; text: string } => b.type === 'text');

      if (textBlocks.length > 0) {
        event.message = {
          role: 'assistant',
          content: textBlocks.map(b => b.text).join('\n'),
        };
      }
    } else if (typeof assistantEvent.message?.content === 'string') {
      event.message = {
        role: 'assistant',
        content: assistantEvent.message.content,
      };
    }

    // Extract token usage
    if (assistantEvent.message?.usage) {
      const usage = assistantEvent.message.usage;
      event.tokenUsage = {
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        cacheReadTokens: usage.cache_read_input_tokens || 0,
        cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      };
    }
  }

  if (raw.type === 'user') {
    const userEvent = raw as RawUserEvent;

    // Check for tool results in content
    if (userEvent.message?.content && Array.isArray(userEvent.message.content)) {
      const toolResultBlocks = (userEvent.message.content as RawContentBlock[])
        .filter((b): b is RawToolResultBlock => b.type === 'tool_result');

      if (toolResultBlocks.length > 0) {
        const firstResult = toolResultBlocks[0];
        const content = typeof firstResult.content === 'string'
          ? firstResult.content
          : JSON.stringify(firstResult.content);

        const toolUseResult = userEvent.toolUseResult && typeof userEvent.toolUseResult === 'object'
          ? userEvent.toolUseResult
          : undefined;

        event.toolResult = {
          callId: firstResult.tool_use_id,
          isError: firstResult.is_error || false,
          content,
          durationMs: toolUseResult?.durationMs,
          stdout: toolUseResult?.stdout,
          stderr: toolUseResult?.stderr,
          interrupted: toolUseResult?.interrupted,
          filenames: toolUseResult?.filenames,
          totalTokens: toolUseResult?.totalTokens,
          totalToolUseCount: toolUseResult?.totalToolUseCount,
          agentId: toolUseResult?.agentId,
        };
        event.type = 'tool_result';
      }
    } else if (typeof userEvent.message?.content === 'string') {
      event.message = {
        role: 'user',
        content: userEvent.message.content,
      };
    }

    // Check for direct toolUseResult (error shorthand)
    if (userEvent.toolUseResult && typeof userEvent.toolUseResult === 'string') {
      event.toolResult = {
        callId: '',
        isError: true,
        content: userEvent.toolUseResult as string,
      };
      event.type = 'tool_result';
    }
  }

  return event;
}

/**
 * Map raw event type to our EventType enum.
 */
function mapEventType(rawType: string): EventType {
  switch (rawType) {
    case 'queue-operation':
      return 'queue-operation';
    case 'user':
      return 'user';
    case 'assistant':
      return 'assistant';
    default:
      return 'user'; // Default fallback
  }
}

// =============================================================================
// Target Tool Extraction
// =============================================================================

/**
 * Extract the target MCP tool from a user message.
 */
function extractTargetTool(content: string | unknown[]): string | null {
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  // Try the standard pattern first
  const match = text.match(TARGET_TOOL_PATTERN);
  if (match) {
    return `mcp__mittwald__mittwald_${match[1].replace(/\//g, '_')}`;
  }

  // Look for MCP tool name directly
  const mcpMatch = text.match(MCP_TOOL_PATTERN);
  if (mcpMatch) {
    return mcpMatch[0];
  }

  return null;
}

// =============================================================================
// Metrics Calculation
// =============================================================================

/**
 * Calculate session metrics from parsed events.
 */
function calculateMetrics(events: Event[]): {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalTokens: number;
  toolCallCount: number;
  errorCount: number;
} {
  if (events.length === 0) {
    const now = new Date();
    return {
      startTime: now,
      endTime: now,
      durationMs: 0,
      totalTokens: 0,
      toolCallCount: 0,
      errorCount: 0,
    };
  }

  const startTime = events[0].timestamp;
  const endTime = events[events.length - 1].timestamp;
  const durationMs = endTime.getTime() - startTime.getTime();

  let totalTokens = 0;
  let toolCallCount = 0;
  let errorCount = 0;

  for (const event of events) {
    if (event.tokenUsage) {
      totalTokens += event.tokenUsage.inputTokens + event.tokenUsage.outputTokens;
    }

    if (event.toolCall) {
      toolCallCount++;
    }

    if (event.toolResult?.isError) {
      errorCount++;
    }
  }

  return {
    startTime,
    endTime,
    durationMs,
    totalTokens,
    toolCallCount,
    errorCount,
  };
}

/**
 * Determine session outcome from events.
 */
function determineOutcome(events: Event[]): SessionOutcome {
  if (events.length === 0) {
    return 'unknown';
  }

  // Look at the last few events for final tool result
  const lastEvents = events.slice(-5);

  for (let i = lastEvents.length - 1; i >= 0; i--) {
    const event = lastEvents[i];
    if (event.toolResult) {
      if (event.toolResult.isError) {
        return 'failure';
      }
      // Check for success indicators in content
      if (event.toolResult.content.includes('SUCCESS') ||
          event.toolResult.content.includes('success')) {
        return 'success';
      }
    }

    // Check for timeout indicators
    if (event.message?.content) {
      const content = typeof event.message.content === 'string'
        ? event.message.content
        : JSON.stringify(event.message.content);
      if (content.includes('timeout') || content.includes('TIMEOUT')) {
        return 'timeout';
      }
    }
  }

  // Check for high error rate as failure indicator
  const errorEvents = events.filter(e => e.toolResult?.isError);
  if (errorEvents.length > events.length * 0.5) {
    return 'failure';
  }

  return 'unknown';
}

// =============================================================================
// Exports
// =============================================================================

export { parseToolName };
export type { ParseStats };
