/**
 * Session Log Analysis - Main Entry Point
 *
 * Central orchestration module for the analysis pipeline.
 * Exports all public APIs from submodules.
 */

// =============================================================================
// Parser Exports
// =============================================================================

export { parseSessionFile, parseDirectory, parseToolName } from './parser/index.js';
export { indexCorpus, getToolNames, getSessionsByTool, getSessionsByDomain, getAllSessions } from './parser/indexer.js';
export { exportCorpusIndex, loadCorpusIndex } from './parser/export.js';

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core entities
  Session,
  Event,
  EventType,
  ToolCall,
  ToolResult,
  TokenUsage,
  Message,
  ToolUseContent,
  SessionOutcome,

  // Incident detection
  Incident,
  IncidentType,
  SeverityLevel,
  IncidentReport,

  // Dependencies
  Dependency,
  DependencyExport,

  // Tool chains
  ToolChain,
  Recommendation,

  // Reports
  DomainReport,
  CorpusIndex,
  Summary,
  CorpusStats,
  PatternRanking,
  ProblematicTool,
  DomainHealth,
  EfficiencyMetrics,

  // Re-exported
  TestDomain,
} from './types.js';

export type {
  CorpusIndexJson,
  SessionJson,
} from './parser/export.js';

export type {
  ParseStats,
} from './parser/index.js';
