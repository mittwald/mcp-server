/**
 * Session Indexer
 *
 * Builds corpus index from parsed sessions with tool/domain mappings.
 * Implements T005: Session Indexer and T007: Sub-agent Log Linking.
 */

import type { Session, CorpusIndex, SessionOutcome } from '../types.js';
import type { TestDomain } from '../../types/index.js';
import { getDomainsInOrder } from '../../inventory/grouping.js';

// =============================================================================
// Main Indexer Functions
// =============================================================================

/**
 * Build corpus index from parsed sessions.
 *
 * @param sessions Array of parsed Session objects
 * @param inputDirectory Source directory path
 * @returns Complete CorpusIndex
 */
export function indexCorpus(sessions: Session[], inputDirectory: string): CorpusIndex {
  // Initialize domain buckets
  const domains = getDomainsInOrder();
  const byDomain: Record<TestDomain, string[]> = {} as Record<TestDomain, string[]>;
  for (const domain of domains) {
    byDomain[domain] = [];
  }

  // Build indexes
  const sessionsById: Record<string, Session> = {};
  const byTool: Record<string, string[]> = {};

  // First pass: index all sessions
  for (const session of sessions) {
    sessionsById[session.id] = session;

    // Index by tool
    if (session.targetTool) {
      if (!byTool[session.targetTool]) {
        byTool[session.targetTool] = [];
      }
      byTool[session.targetTool].push(session.id);
    }

    // Index by domain
    if (session.domain && byDomain[session.domain]) {
      byDomain[session.domain].push(session.id);
    }
  }

  // Second pass: link sub-agents to parents
  linkSubAgents(sessions, sessionsById);

  // Calculate aggregates
  const stats = calculateStats(sessions);

  return {
    generatedAt: new Date(),
    inputDirectory,
    sessions: sessionsById,
    byTool,
    byDomain,
    stats,
  };
}

// =============================================================================
// Sub-agent Linking (T007)
// =============================================================================

/**
 * Link sub-agent sessions to their parent sessions.
 *
 * Sub-agent logs have filenames like `agent-{shortid}.jsonl`.
 * Since sub-agents now have parentSessionId set during parsing (from their
 * sessionId field which contains the parent's ID), we just need to update
 * the parent's subAgents list.
 */
function linkSubAgents(sessions: Session[], sessionsById: Record<string, Session>): void {
  // Separate main sessions and sub-agent sessions
  const mainSessions: Session[] = [];
  const subAgentSessions: Session[] = [];

  for (const session of sessions) {
    if (isSubAgentSession(session)) {
      subAgentSessions.push(session);
    } else {
      mainSessions.push(session);
    }
  }

  // For each sub-agent, add to parent's subAgents list
  // parentSessionId is already set during parsing
  for (const subAgent of subAgentSessions) {
    const parentId = subAgent.parentSessionId;

    if (parentId) {
      // Add to parent's subAgents list
      const parent = sessionsById[parentId];
      if (parent && !parent.subAgents.includes(subAgent.id)) {
        parent.subAgents.push(subAgent.id);
      }
    }
  }
}

/**
 * Check if a session is a sub-agent session.
 */
function isSubAgentSession(session: Session): boolean {
  // Sub-agents have parentSessionId set during parsing
  if (session.parentSessionId) {
    return true;
  }

  // Check filename pattern as fallback
  if (session.filePath.includes('agent-')) {
    return true;
  }

  return false;
}


// =============================================================================
// Statistics Calculation
// =============================================================================

/**
 * Calculate aggregate statistics for the corpus.
 */
function calculateStats(sessions: Session[]): CorpusIndex['stats'] {
  let totalEvents = 0;
  let totalTokens = 0;
  let totalDurationMs = 0;
  const sessionsByOutcome: Record<SessionOutcome, number> = {
    success: 0,
    failure: 0,
    timeout: 0,
    unknown: 0,
  };

  for (const session of sessions) {
    totalEvents += session.events.length;
    totalTokens += session.totalTokens;
    totalDurationMs += session.durationMs;
    sessionsByOutcome[session.outcome]++;
  }

  return {
    totalSessions: sessions.length,
    totalEvents,
    totalTokens,
    totalDurationMs,
    sessionsByOutcome,
  };
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Get all tool names from the corpus.
 */
export function getToolNames(index: CorpusIndex): string[] {
  return Object.keys(index.byTool).sort();
}

/**
 * Get sessions for a specific tool.
 */
export function getSessionsByTool(index: CorpusIndex, toolName: string): Session[] {
  const sessionIds = index.byTool[toolName] || [];
  return sessionIds.map(id => index.sessions[id]).filter(Boolean);
}

/**
 * Get sessions for a specific domain.
 */
export function getSessionsByDomain(index: CorpusIndex, domain: TestDomain): Session[] {
  const sessionIds = index.byDomain[domain] || [];
  return sessionIds.map(id => index.sessions[id]).filter(Boolean);
}

/**
 * Get all sessions as array.
 */
export function getAllSessions(index: CorpusIndex): Session[] {
  return Object.values(index.sessions);
}

/**
 * Check if session is a sub-agent.
 */
export function isOrphanSubAgent(session: Session): boolean {
  return isSubAgentSession(session) && !session.parentSessionId;
}
