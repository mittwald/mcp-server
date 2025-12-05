/**
 * Stream Parser - Event Parsing and Pattern Detection
 *
 * Parses Claude Code stream-json events and tracks patterns
 * for coordinator intervention detection.
 */

import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { StreamEvent } from '../types/index.js';

/**
 * Question patterns for detecting when Claude asks questions requiring user input (T006)
 *
 * These patterns identify direct questions and permission requests.
 * Start conservative to minimize false positives; expand based on real sessions.
 */
export const QUESTION_PATTERNS: RegExp[] = [
  /\?\s*$/m, // Ends with question mark (with optional trailing whitespace)
  /\bcould you\b/i,
  /\bwould you like\b/i,
  /\bplease (confirm|provide|specify|choose|select)\b/i,
  /\bshall i\b/i,
  /\bshould i\b/i,
  /\bdo you want\b/i,
  /\bwhat would you prefer\b/i,
  /\bwhich (one|option)\b/i,
  /\bwhat .* would you like\b/i,
  /\blet me know\b/i,
];

/**
 * Detect if text contains a question requiring user response (T007)
 *
 * @param text - The text to check for questions
 * @returns true if any question pattern matches
 */
export function detectQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Event emitted when a question is detected in assistant output (T008)
 */
export interface QuestionDetectedEvent {
  type: 'question_detected';
  timestamp: Date;
  messageContent: string;
  assistantMessageId?: string;
}

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
 * Extends EventEmitter to emit question_detected events (T008)
 */
export class StreamParser extends EventEmitter {
  private consecutiveErrors = 0;
  private lastActivityTime = new Date();
  private recentToolCalls: ToolCall[] = [];
  private recentOutput: string[] = [];
  private lastToolCall: ToolCall | null = null;
  private sameToolRepeatCount = 0;

  /**
   * Pending question awaiting user response (T009)
   * Set when a question is detected, cleared when user message is observed
   */
  private pendingQuestion: string | null = null;

  /**
   * Maximum tool calls to keep in sliding window
   */
  private readonly maxToolCallHistory = 50;

  /**
   * Maximum output lines to keep
   */
  private readonly maxOutputLines = 100;

  constructor() {
    super();
  }

  /**
   * Check if there's a pending question awaiting response (T009)
   */
  hasPendingQuestion(): boolean {
    return this.pendingQuestion !== null;
  }

  /**
   * Get the pending question text (T009)
   */
  getPendingQuestion(): string | null {
    return this.pendingQuestion;
  }

  /**
   * Clear the pending question (T009)
   * Called when user message is observed or question is answered
   */
  clearPendingQuestion(): void {
    this.pendingQuestion = null;
  }

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
      case 'message':
        this.processMessage(event);
        break;
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
        // Result types reset error count
        this.consecutiveErrors = 0;
    }
  }

  /**
   * Process a message event for question detection (T008, T009)
   */
  private processMessage(event: StreamEvent): void {
    const content = event.content as Record<string, unknown>;

    // Reset error count on any message
    this.consecutiveErrors = 0;

    // Determine if this is a user or assistant message
    const role = this.extractRole(content);

    if (role === 'user') {
      // User message clears any pending question (T009)
      this.clearPendingQuestion();
      return;
    }

    // For assistant messages, check for questions
    const messageText = this.extractMessageText(content);
    if (messageText && detectQuestion(messageText)) {
      // Set pending question state (T009)
      this.pendingQuestion = messageText;

      // Emit question_detected event (T008)
      const questionEvent: QuestionDetectedEvent = {
        type: 'question_detected',
        timestamp: new Date(),
        messageContent: messageText,
        assistantMessageId: content.id as string | undefined,
      };
      this.emit('question_detected', questionEvent);
    }
  }

  /**
   * Extract the role from a message event content
   */
  private extractRole(content: Record<string, unknown>): 'user' | 'assistant' | 'unknown' {
    // Check direct role field
    if (content.role === 'user') return 'user';
    if (content.role === 'assistant') return 'assistant';

    // Check nested message structure
    const message = content.message as Record<string, unknown> | undefined;
    if (message?.role === 'user') return 'user';
    if (message?.role === 'assistant') return 'assistant';

    // Default to assistant for messages without explicit role
    // (tool outputs and assistant responses typically don't have role field)
    return 'assistant';
  }

  /**
   * Extract text content from a message event
   */
  private extractMessageText(content: Record<string, unknown>): string | null {
    // Direct text field
    if (typeof content.text === 'string') {
      return content.text;
    }

    // Nested message.content (Claude API format)
    const message = content.message as Record<string, unknown> | undefined;
    if (message) {
      if (typeof message.content === 'string') {
        return message.content;
      }
      // Handle content array format
      if (Array.isArray(message.content)) {
        const textParts = message.content
          .filter((part: unknown) => {
            const p = part as Record<string, unknown>;
            return p.type === 'text' && typeof p.text === 'string';
          })
          .map((part: unknown) => (part as Record<string, unknown>).text as string);
        if (textParts.length > 0) {
          return textParts.join('\n');
        }
      }
    }

    // Content field (stream-json format)
    if (typeof content.content === 'string') {
      return content.content;
    }

    return null;
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
    this.pendingQuestion = null; // Clear pending question (T009)
  }
}

/**
 * Create a stream parser instance
 */
export function createStreamParser(): StreamParser {
  return new StreamParser();
}
