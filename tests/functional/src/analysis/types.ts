/**
 * Session Log Analysis - Shared Type Definitions
 *
 * Central type definitions used by all analysis modules.
 * Based on data-model.md from 006-session-log-analysis specification.
 */

import type { TestDomain } from '../types/index.js';

// =============================================================================
// Core Entities
// =============================================================================

/**
 * A single Claude Code execution representing one MCP tool test.
 */
export interface Session {
  id: string;                    // UUID from sessionId field
  filePath: string;              // Absolute path to JSONL file
  targetTool: string;            // MCP tool being tested (extracted from first user message)
  domain: TestDomain;            // Functional domain (from grouping.ts)
  events: Event[];               // Parsed log events
  subAgents: string[];           // IDs of child agent sessions
  parentSessionId?: string;      // If this is a sub-agent, link to parent
  parentEventUuid?: string;      // UUID of parent event if provided
  orphaned?: boolean;            // True if parent could not be resolved

  // Metrics
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalTokens: number;
  toolCallCount: number;
  errorCount: number;
  outcome: SessionOutcome;
}

export type SessionOutcome = 'success' | 'failure' | 'timeout' | 'unknown';

/**
 * A single log entry from a session.
 */
export interface Event {
  type: EventType;
  timestamp: Date;
  raw: Record<string, unknown>;  // Original JSON for debugging

  // Type-specific fields (populated based on type)
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  message?: Message;
  tokenUsage?: TokenUsage;
}

export type EventType =
  | 'queue-operation'
  | 'user'
  | 'assistant'
  | 'tool_use'
  | 'tool_result';

export interface ToolCall {
  id: string;                    // call_id for correlation
  name: string;                  // Tool name (e.g., "Bash", "SlashCommand", "mcp__mittwald__...")
  input: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;                // Correlates to ToolCall.id
  isError: boolean;
  content: string;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;
  filenames?: string[];
  totalTokens?: number;
  totalToolUseCount?: number;
  agentId?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ToolUseContent[];
}

export interface ToolUseContent {
  type: 'tool_use' | 'tool_result' | 'text';
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  tool_use_id?: string;
  is_error?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

// =============================================================================
// Incident Detection
// =============================================================================

/**
 * A detected confusion pattern.
 */
export interface Incident {
  id: string;                    // Generated UUID
  type: IncidentType;
  severity: SeverityLevel;
  severityScore: number;         // Numeric for ranking

  sessionId: string;             // Reference to Session.id
  toolAttempted?: string;        // What the LLM tried
  toolNeeded?: string;           // What it should have used

  tokenWaste: number;            // Tokens spent on failed/unnecessary operations
  timeWasteMs: number;           // Time spent on failed/unnecessary operations

  context: {
    eventRange: [number, number]; // Start/end event indices
    errorMessages: string[];      // Relevant error text
    description: string;          // Human-readable explanation
  };
}

export type IncidentType =
  | 'wrong-tool-selection'
  | 'retry-loop'
  | 'unnecessary-delegation'
  | 'stuck-indicator'
  | 'capability-mismatch'
  | 'exploration-waste';

export type SeverityLevel = 'high' | 'medium' | 'low';

/**
 * Aggregated incident report from all detectors.
 */
export interface IncidentReport {
  incidents: Incident[];
  byType: Record<IncidentType, number>;
  bySeverity: Record<SeverityLevel, number>;
  totalTokenWaste: number;
}

// =============================================================================
// Dependency Mapping
// =============================================================================

/**
 * A directed edge in the tool dependency graph.
 */
export interface Dependency {
  from: string;                  // Prerequisite tool
  to: string;                    // Dependent tool
  confidence: number;            // 0.0 - 1.0
  evidenceCount: number;         // Number of sessions supporting this
  evidenceSessions: string[];    // Session IDs as evidence
  type: 'sequence' | 'error-recovery';
}

/**
 * Tool dependency graph export.
 */
export interface DependencyExport {
  dependencies: Dependency[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConfidence: number;
  };
}

// =============================================================================
// Tool Chains & Recommendations
// =============================================================================

/**
 * A recommended sequence of tools for a use case.
 */
export interface ToolChain {
  id: string;
  useCase: string;               // Human-readable name
  description: string;           // What this achieves
  tools: string[];               // Ordered tool sequence
  requiredParams: Record<string, string>; // Parameter passing hints
  examplePrompt: string;         // Sample user prompt

  // Efficiency metrics
  avgTokens: number;
  avgDurationMs: number;
  successRate: number;

  // Evidence
  derivedFromSessions: string[];
}

/**
 * A tool chain recommendation.
 */
export interface Recommendation {
  id: string;
  title: string;
  tools: string[];
  examplePrompt: string;
  prerequisites: string[];
  avgTokens: number;
  frequency: number;
}

// =============================================================================
// Domain Reports
// =============================================================================

/**
 * Aggregated analysis for one functional domain.
 */
export interface DomainReport {
  domain: TestDomain;
  generatedAt: Date;

  // Coverage
  sessionCount: number;
  toolsTested: string[];
  toolsUntested: string[];       // Tools in domain with 0 sessions

  // Incidents
  incidents: Incident[];
  incidentsByType: Record<IncidentType, number>;
  totalTokenWaste: number;

  // Dependencies
  internalDependencies: Dependency[];  // Within domain
  externalDependencies: Dependency[];  // Cross-domain

  // Efficiency
  avgTokensPerSession: number;
  successRate: number;
  mostProblematicTool: string;

  // Recommendations
  recommendations: string[];
}

// =============================================================================
// Corpus Index
// =============================================================================

/**
 * Top-level index of all sessions.
 */
export interface CorpusIndex {
  generatedAt: Date;
  inputDirectory: string;

  // Session lookup
  sessions: Record<string, Session>;
  byTool: Record<string, string[]>;     // toolName -> sessionIds
  byDomain: Record<TestDomain, string[]>;

  // Aggregates
  stats: {
    totalSessions: number;
    totalEvents: number;
    totalTokens: number;
    totalDurationMs: number;
    sessionsByOutcome: Record<SessionOutcome, number>;
  };
}

// =============================================================================
// Summary
// =============================================================================

/**
 * Corpus-wide analysis summary.
 */
export interface Summary {
  corpusStats: CorpusStats;
  patternRanking: PatternRanking[];
  problematicTools: ProblematicTool[];
  domainHealth: DomainHealth[];
  generatedAt: string;
}

export interface CorpusStats {
  totalSessions: number;
  totalEvents: number;
  totalTokens: number;
  avgTokensPerSession: number;
  avgEventsPerSession: number;
  analysisDate: string;
}

export interface PatternRanking {
  type: IncidentType;
  count: number;
  totalTokenWaste: number;
  avgSeverityScore: number;
  mostAffectedDomain: TestDomain;
}

export interface ProblematicTool {
  tool: string;
  incidentCount: number;
  tokenWaste: number;
  primaryPattern: IncidentType;
}

export interface DomainHealth {
  domain: TestDomain;
  sessionsCount: number;
  incidentCount: number;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
}

// =============================================================================
// Efficiency Metrics
// =============================================================================

export interface EfficiencyMetrics {
  avgTokensPerSession: number;
  successRate: number;
  mostProblematicTool: string;
  incidentCount: number;
  avgTimePerSession: number;
}

// =============================================================================
// Re-exports
// =============================================================================

export type { TestDomain } from '../types/index.js';
