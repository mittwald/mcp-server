/**
 * Corpus Export
 *
 * Exports corpus index to JSON format.
 * Implements T008: Export corpus-index.json.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { CorpusIndex, Session, SessionOutcome } from '../types.js';
import type { TestDomain } from '../../types/index.js';

// =============================================================================
// Export Types
// =============================================================================

/**
 * JSON-serializable session format.
 */
interface SessionJson {
  id: string;
  filePath: string;
  targetTool: string;
  domain: TestDomain;
  parentSessionId?: string;
  parentEventUuid?: string;
  orphaned?: boolean;
  subAgents: string[];
  metrics: {
    startTime: string;
    endTime: string;
    durationMs: number;
    totalTokens: number;
    toolCallCount: number;
    errorCount: number;
    eventCount: number;
  };
  outcome: SessionOutcome;
}

/**
 * JSON-serializable corpus index format.
 */
interface CorpusIndexJson {
  generatedAt: string;
  inputDirectory: string;
  sessions: Record<string, SessionJson>;
  byTool: Record<string, string[]>;
  byDomain: Record<TestDomain, string[]>;
  stats: {
    totalSessions: number;
    totalEvents: number;
    totalTokens: number;
    totalDurationMs: number;
    sessionsByOutcome: Record<SessionOutcome, number>;
  };
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Export corpus index to JSON file.
 *
 * @param index CorpusIndex to export
 * @param outputPath Path to write corpus-index.json
 */
export function exportCorpusIndex(index: CorpusIndex, outputPath: string): void {
  // Ensure output directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Convert to JSON-serializable format
  const json = toJson(index);

  // Write with 2-space indentation
  writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
}

/**
 * Convert CorpusIndex to JSON-serializable format.
 */
function toJson(index: CorpusIndex): CorpusIndexJson {
  const sessions: Record<string, SessionJson> = {};

  for (const [id, session] of Object.entries(index.sessions)) {
    sessions[id] = sessionToJson(session);
  }

  return {
    generatedAt: index.generatedAt.toISOString(),
    inputDirectory: index.inputDirectory,
    sessions,
    byTool: index.byTool,
    byDomain: index.byDomain,
    stats: index.stats,
  };
}

/**
 * Convert Session to JSON-serializable format.
 *
 * Note: We don't include raw events in the export to keep file size manageable.
 * The original JSONL files can be referenced via filePath if raw events are needed.
 */
function sessionToJson(session: Session): SessionJson {
  return {
    id: session.id,
    filePath: session.filePath,
    targetTool: session.targetTool,
    domain: session.domain,
    parentSessionId: session.parentSessionId,
    parentEventUuid: session.parentEventUuid,
    orphaned: session.orphaned,
    subAgents: session.subAgents,
    metrics: {
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      durationMs: session.durationMs,
      totalTokens: session.totalTokens,
      toolCallCount: session.toolCallCount,
      errorCount: session.errorCount,
      eventCount: session.events.length,
    },
    outcome: session.outcome,
  };
}

/**
 * Load corpus index from JSON file.
 *
 * Note: This returns the JSON format without raw events.
 * For full event access, re-parse using parseDirectory().
 *
 * @param inputPath Path to corpus-index.json
 * @returns Parsed CorpusIndexJson
 */
export function loadCorpusIndex(inputPath: string): CorpusIndexJson {
  const { readFileSync } = require('node:fs');
  const content = readFileSync(inputPath, 'utf-8');
  return JSON.parse(content) as CorpusIndexJson;
}

// =============================================================================
// Type Exports
// =============================================================================

export type { CorpusIndexJson, SessionJson };
