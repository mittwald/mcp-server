/**
 * Parser Types - JSONL Event Structure Definitions
 *
 * Granular types for parsing Claude Code session log events.
 * These types match the raw JSONL structure from Claude Code 2.0.58+.
 */

// =============================================================================
// Raw Event Types (from JSONL)
// =============================================================================

/**
 * Base interface for all JSONL events
 */
export interface RawEvent {
  type: string;
  timestamp: string;
  sessionId: string;
  uuid: string;
  parentUuid: string | null;
  isSidechain?: boolean;
  userType?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  agentId?: string;
  slug?: string;
}

/**
 * Queue operation event (session start/end markers)
 */
export interface RawQueueEvent extends RawEvent {
  type: 'queue-operation';
  operation: 'dequeue' | 'enqueue';
}

/**
 * User message event
 */
export interface RawUserEvent extends RawEvent {
  type: 'user';
  message: RawMessage;
  toolUseResult?: RawToolUseResult;
}

/**
 * Assistant message event
 */
export interface RawAssistantEvent extends RawEvent {
  type: 'assistant';
  message: RawAssistantMessage;
  requestId?: string;
}

/**
 * Raw message structure
 */
export interface RawMessage {
  role: 'user' | 'assistant';
  content: string | RawContentBlock[];
}

/**
 * Raw assistant message with model info
 */
export interface RawAssistantMessage extends RawMessage {
  model?: string;
  id?: string;
  stop_reason?: string | null;
  stop_sequence?: string | null;
  usage?: RawUsage;
  context_management?: {
    applied_edits: unknown[];
  };
}

/**
 * Content block in message
 */
export type RawContentBlock = RawTextBlock | RawToolUseBlock | RawToolResultBlock;

export interface RawTextBlock {
  type: 'text';
  text: string;
}

export interface RawToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface RawToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | RawContentBlock[];
  is_error?: boolean;
}

/**
 * Token usage in assistant message
 */
export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
  service_tier?: string;
}

/**
 * Tool use result attached to user events
 */
export interface RawToolUseResult {
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;
  isImage?: boolean;
  filenames?: string[];
  durationMs?: number;
  numFiles?: number;
  truncated?: boolean;
  query?: string;
  results?: string[];
  durationSeconds?: number;
  // Task tool result
  status?: string;
  prompt?: string;
  agentId?: string;
  content?: RawContentBlock[];
  totalDurationMs?: number;
  totalTokens?: number;
  totalToolUseCount?: number;
  usage?: RawUsage;
}

// =============================================================================
// Parsed Event Types
// =============================================================================

/**
 * Parsed tool call extracted from assistant message
 */
export interface ParsedToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  timestamp: Date;
  parentEventUuid: string;
}

/**
 * Parsed tool result extracted from user message
 */
export interface ParsedToolResult {
  callId: string;
  isError: boolean;
  content: string;
  durationMs?: number;
  timestamp: Date;
  parentEventUuid: string;

  // Extended result info
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;

  // Task agent results
  agentId?: string;
  totalTokens?: number;
  totalToolUseCount?: number;
}

/**
 * Token usage summary for a message
 */
export interface ParsedTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Result of parsing a single JSONL line
 */
export interface ParseLineResult {
  success: boolean;
  event?: RawEvent;
  error?: string;
  lineNumber: number;
}

/**
 * Parse statistics for a session file
 */
export interface ParseStats {
  totalLines: number;
  parsedLines: number;
  errorLines: number;
  errors: Array<{ line: number; error: string }>;
}

/**
 * Tool name extraction patterns
 */
export const MCP_TOOL_PREFIX = 'mcp__mittwald__';
export const EXPLORATION_TOOLS = ['Glob', 'Grep', 'Read', 'WebSearch', 'WebFetch'];
export const DELEGATION_TOOLS = ['Task'];
export const WRONG_TOOL_CANDIDATES = ['SlashCommand', 'Bash'];
