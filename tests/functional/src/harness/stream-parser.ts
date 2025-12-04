/**
 * Stream Parser - Event Parsing and Pattern Detection
 *
 * Parses Claude Code stream-json events and tracks patterns
 * for coordinator intervention detection.
 */

import { createHash } from 'node:crypto';
import type { StreamEvent } from '../types/index.js';

/**
 * Event types from Claude Code stream-json format
 */
export type StreamEventType = 'message' | 'tool_use' | 'tool_result' | 'error' | 'result';

/**
 * Parsed tool call from stream events
 */
export interface ToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
  argumentHash: string;
  timestamp: Date;
}

/**
 * Pattern state for a session (exposed for coordinator)
 */
export interface PatternState {
  consecutiveErrors: number;
  idleTimeMs: number;
  sameToolRepeated: number;
  lastToolName: string;
  lastActivityTime: Date;
  recentToolCalls: ToolCall[];
  recentOutput: string[];
}

/**
 * Stream parser for tracking tool usage patterns
 */
export class StreamParser {
  private consecutiveErrors = 0;
  private lastActivityTime = new Date();
  private recentToolCalls: ToolCall[] = [];
  private recentOutput: string[] = [];
  private lastToolCall: ToolCall | null = null;
  private sameToolRepeatCount = 0;

  /**
   * Maximum tool calls to keep in sliding window
   */
  private readonly maxToolCallHistory = 50;

  /**
   * Maximum output lines to keep
   */
  private readonly maxOutputLines = 100;

  /**
   * Parse a stream event line into a typed StreamEvent
   */
  parseStreamEvent(line: string): StreamEvent | null {
    if (!line.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(line);
      const eventType = this.determineEventType(parsed);

      return {
        type: eventType,
        timestamp: new Date(),
        content: parsed,
      };
    } catch {
      console.warn('[stream-parser] Malformed JSON:', line.substring(0, 100));
      return null;
    }
  }

  /**
   * Determine the event type from parsed JSON
   */
  private determineEventType(parsed: Record<string, unknown>): StreamEventType {
    // Check explicit type field
    if (parsed.type && typeof parsed.type === 'string') {
      const type = parsed.type.toLowerCase();
      if (['message', 'tool_use', 'tool_result', 'error', 'result'].includes(type)) {
        return type as StreamEventType;
      }
    }

    // Infer from content
    if (parsed.error) {
      return 'error';
    }
    if (parsed.tool_name || parsed.name) {
      return 'tool_use';
    }
    if (parsed.tool_result !== undefined || parsed.output !== undefined) {
      return 'tool_result';
    }
    if (parsed.session_id || parsed.result) {
      return 'result';
    }

    return 'message';
  }

  /**
   * Process a stream event and update pattern tracking (T015, T016)
   */
  processEvent(event: StreamEvent): void {
    this.lastActivityTime = new Date();

    // Add to recent output
    const outputLine = this.formatEventForOutput(event);
    if (outputLine) {
      this.recentOutput.push(outputLine);
      if (this.recentOutput.length > this.maxOutputLines) {
        this.recentOutput.shift();
      }
    }

    switch (event.type) {
      case 'tool_use':
        this.processToolUse(event);
        break;
      case 'tool_result':
        this.processToolResult(event);
        break;
      case 'error':
        this.processError(event);
        break;
      default:
        // Message and result types reset error count
        this.consecutiveErrors = 0;
    }
  }

  /**
   * Process a tool_use event (T015)
   */
  private processToolUse(event: StreamEvent): void {
    const content = event.content as Record<string, unknown>;

    const toolName = String(content.tool_name || content.name || 'unknown');
    const args = (content.arguments || content.input || {}) as Record<string, unknown>;
    const argHash = this.hashArguments(args);

    const toolCall: ToolCall = {
      toolName,
      arguments: args,
      argumentHash: argHash,
      timestamp: event.timestamp,
    };

    // Track repeated tool calls
    if (this.lastToolCall && this.lastToolCall.toolName === toolName && this.lastToolCall.argumentHash === argHash) {
      this.sameToolRepeatCount++;
    } else {
      this.sameToolRepeatCount = 1;
    }

    this.lastToolCall = toolCall;

    // Add to history
    this.recentToolCalls.push(toolCall);
    if (this.recentToolCalls.length > this.maxToolCallHistory) {
      this.recentToolCalls.shift();
    }
  }

  /**
   * Process a tool_result event (T016)
   */
  private processToolResult(event: StreamEvent): void {
    const content = event.content as Record<string, unknown>;

    // Check for error in result
    const isError =
      content.is_error === true ||
      content.error !== undefined ||
      (typeof content.output === 'string' && content.output.toLowerCase().includes('error'));

    if (isError) {
      this.consecutiveErrors++;
    } else {
      this.consecutiveErrors = 0;
    }
  }

  /**
   * Process an error event (T016)
   */
  private processError(_event: StreamEvent): void {
    this.consecutiveErrors++;
  }

  /**
   * Hash arguments for duplicate detection
   */
  private hashArguments(args: Record<string, unknown>): string {
    const sorted = JSON.stringify(args, Object.keys(args).sort());
    return createHash('sha256').update(sorted).digest('hex').substring(0, 16);
  }

  /**
   * Format event for output log
   */
  private formatEventForOutput(event: StreamEvent): string | null {
    const content = event.content as Record<string, unknown>;

    switch (event.type) {
      case 'message':
        return content.text ? `[message] ${String(content.text).substring(0, 200)}` : null;
      case 'tool_use':
        return `[tool_use] ${content.tool_name || content.name}`;
      case 'tool_result':
        return `[tool_result] ${content.is_error ? 'ERROR: ' : ''}${String(content.output || '').substring(0, 100)}`;
      case 'error':
        return `[error] ${content.message || content.error}`;
      case 'result':
        return `[result] Session completed`;
      default:
        return null;
    }
  }

  /**
   * Get current pattern state for coordinator (T016)
   */
  getPatternState(): PatternState {
    const now = new Date();
    const idleTimeMs = now.getTime() - this.lastActivityTime.getTime();

    return {
      consecutiveErrors: this.consecutiveErrors,
      idleTimeMs,
      sameToolRepeated: this.sameToolRepeatCount,
      lastToolName: this.lastToolCall?.toolName || '',
      lastActivityTime: this.lastActivityTime,
      recentToolCalls: [...this.recentToolCalls],
      recentOutput: [...this.recentOutput],
    };
  }

  /**
   * Reset parser state for new session
   */
  reset(): void {
    this.consecutiveErrors = 0;
    this.lastActivityTime = new Date();
    this.recentToolCalls = [];
    this.recentOutput = [];
    this.lastToolCall = null;
    this.sameToolRepeatCount = 0;
  }
}

/**
 * Create a stream parser instance
 */
export function createStreamParser(): StreamParser {
  return new StreamParser();
}
