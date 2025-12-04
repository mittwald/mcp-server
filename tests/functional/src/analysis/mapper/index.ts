/**
 * Dependency Mapper (T019, T020)
 *
 * Discovers tool prerequisite relationships from session data.
 */

import type { Session, Dependency, DependencyExport } from '../types.js';
import type { ToolSequence, DependencyGraph } from './types.js';
import { MCP_TOOL_PREFIX } from './types.js';
import {
  buildDependencyGraph,
  detectErrorRecoveryDependencies,
  graphToDependencies,
  breakCycles,
} from './graph.js';

// =============================================================================
// Tool Sequence Extraction (T020)
// =============================================================================

/**
 * Extract ordered tool sequences from sessions.
 *
 * @param sessions Sessions to analyze
 * @returns Array of tool sequences
 */
export function extractToolSequences(sessions: Session[]): ToolSequence[] {
  const sequences: ToolSequence[] = [];

  for (const session of sessions) {
    const tools: string[] = [];

    for (const event of session.events) {
      if (event.toolCall) {
        const toolName = event.toolCall.name;
        // Filter to only MCP tools
        if (toolName.startsWith(MCP_TOOL_PREFIX)) {
          tools.push(toolName);
        }
      }
    }

    if (tools.length > 0) {
      sequences.push({
        sessionId: session.id,
        tools,
      });
    }
  }

  return sequences;
}

/**
 * Count sessions containing each tool.
 *
 * @param sessions Sessions to analyze
 * @returns Map of tool → session count
 */
export function countSessionsWithTool(sessions: Session[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    const toolsInSession = new Set<string>();

    for (const event of session.events) {
      if (event.toolCall) {
        const toolName = event.toolCall.name;
        if (toolName.startsWith(MCP_TOOL_PREFIX)) {
          toolsInSession.add(toolName);
        }
      }
    }

    for (const tool of toolsInSession) {
      counts.set(tool, (counts.get(tool) || 0) + 1);
    }
  }

  return counts;
}

// =============================================================================
// Main Mapping Function
// =============================================================================

/**
 * Map dependencies from parsed sessions.
 *
 * @param sessions Parsed sessions
 * @returns DependencyExport with all dependencies
 */
export function mapDependencies(sessions: Session[]): DependencyExport {
  // Extract tool sequences
  const sequences = extractToolSequences(sessions);

  // Count sessions per tool
  const sessionsWithTool = countSessionsWithTool(sessions);

  // Build graph from sequences
  const graph = buildDependencyGraph(sequences);

  // Add error-recovery dependencies
  const errorRecoveryEdges = detectErrorRecoveryDependencies(sessions);
  for (const edge of errorRecoveryEdges) {
    graph.nodes.add(edge.from);
    graph.nodes.add(edge.to);

    if (!graph.edges.has(edge.from)) {
      graph.edges.set(edge.from, []);
    }

    // Check if edge already exists
    const existingEdges = graph.edges.get(edge.from)!;
    const existing = existingEdges.find(e => e.to === edge.to);
    if (existing) {
      // Merge evidence
      for (const sessionId of edge.evidenceSessions) {
        if (!existing.evidenceSessions.includes(sessionId)) {
          existing.evidenceSessions.push(sessionId);
        }
      }
      // Upgrade to error-recovery type (stronger signal)
      existing.type = 'error-recovery';
    } else {
      existingEdges.push(edge);
    }
  }

  // Break any cycles
  breakCycles(graph, sessionsWithTool);

  // Convert to dependencies
  const dependencies = graphToDependencies(graph, sessionsWithTool);

  // Calculate stats
  const totalNodes = graph.nodes.size;
  const totalEdges = dependencies.length;
  const avgConfidence = dependencies.length > 0
    ? dependencies.reduce((sum, d) => sum + d.confidence, 0) / dependencies.length
    : 0;

  return {
    dependencies,
    stats: {
      totalNodes,
      totalEdges,
      avgConfidence,
    },
  };
}

// =============================================================================
// Re-exports
// =============================================================================

export type { ToolSequence, DependencyGraph } from './types.js';
export {
  buildDependencyGraph,
  detectErrorRecoveryDependencies,
  graphToDependencies,
  calculateConfidence,
  detectCycles,
  breakCycles,
} from './graph.js';
