/**
 * Dependency Graph Builder (T021, T022, T023, T024)
 *
 * Builds directed acyclic graph from tool sequences.
 * Implements sequence-based and error-recovery dependency detection.
 */

import type { Session, Dependency } from '../types.js';
import type { DependencyGraph, Edge, ToolSequence } from './types.js';
import { MAPPER_CONFIG, MCP_TOOL_PREFIX } from './types.js';

// =============================================================================
// Graph Building (T021)
// =============================================================================

/**
 * Build dependency graph from tool sequences.
 *
 * @param sequences Tool sequences from sessions
 * @returns DependencyGraph with nodes and edges
 */
export function buildDependencyGraph(sequences: ToolSequence[]): DependencyGraph {
  const nodes = new Set<string>();
  const edgeMap = new Map<string, Map<string, Edge>>();  // from → to → Edge

  // Build edges from sequences
  for (const sequence of sequences) {
    // Add all tools as nodes
    for (const tool of sequence.tools) {
      nodes.add(tool);
    }

    // Create edges for consecutive pairs
    for (let i = 0; i < sequence.tools.length - 1; i++) {
      const from = sequence.tools[i];
      const to = sequence.tools[i + 1];

      // Skip self-loops
      if (from === to) continue;

      // Get or create edge map for 'from'
      if (!edgeMap.has(from)) {
        edgeMap.set(from, new Map());
      }
      const fromEdges = edgeMap.get(from)!;

      // Get or create edge
      if (!fromEdges.has(to)) {
        fromEdges.set(to, {
          from,
          to,
          count: 0,
          evidenceSessions: [],
          type: 'sequence',
        });
      }

      const edge = fromEdges.get(to)!;
      edge.count++;
      if (!edge.evidenceSessions.includes(sequence.sessionId)) {
        edge.evidenceSessions.push(sequence.sessionId);
      }
    }
  }

  // Convert to edge array format
  const edges = new Map<string, Edge[]>();
  for (const [from, toMap] of edgeMap) {
    edges.set(from, Array.from(toMap.values()));
  }

  return { nodes, edges };
}

// =============================================================================
// Sequence-Based Detection (T022)
// =============================================================================

/**
 * Calculate co-occurrence ratio for an edge.
 * Ratio = count(A→B) / count(sessions with B)
 *
 * @param edge Edge to analyze
 * @param sessionsWithTarget Number of sessions containing the target tool
 * @returns Co-occurrence ratio (0-1)
 */
export function calculateCoOccurrence(edge: Edge, sessionsWithTarget: number): number {
  if (sessionsWithTarget === 0) return 0;
  return edge.evidenceSessions.length / sessionsWithTarget;
}

// =============================================================================
// Error-Recovery Detection (T023)
// =============================================================================

/**
 * Detect error-recovery dependencies from sessions.
 * Pattern: A(fail) → B → A(success)
 *
 * @param sessions Sessions to analyze
 * @returns Array of error-recovery edges
 */
export function detectErrorRecoveryDependencies(sessions: Session[]): Edge[] {
  const edges: Edge[] = [];
  const edgeMap = new Map<string, Edge>();

  for (const session of sessions) {
    const events = session.events;

    for (let i = 0; i < events.length - 2; i++) {
      const first = events[i];
      const second = events[i + 1];
      const third = events[i + 2];

      // Look for A(fail) → B → A(success) pattern
      if (
        first.toolResult?.isError &&
        second.toolCall &&
        third.toolResult &&
        !third.toolResult.isError
      ) {
        // Find the tool call for the first failed result
        const firstToolCall = events.slice(0, i).reverse().find(e => e.toolCall);
        const thirdToolCall = events.slice(i + 2, i + 5).reverse().find(e => e.toolCall);

        if (
          firstToolCall?.toolCall?.name &&
          thirdToolCall?.toolCall?.name &&
          firstToolCall.toolCall.name === thirdToolCall.toolCall.name
        ) {
          const failedTool = firstToolCall.toolCall.name;
          const recoveryTool = second.toolCall.name;

          // Create edge: recovery → failed (B is prerequisite for A)
          const key = `${recoveryTool}→${failedTool}`;

          if (!edgeMap.has(key)) {
            edgeMap.set(key, {
              from: recoveryTool,
              to: failedTool,
              count: 0,
              evidenceSessions: [],
              type: 'error-recovery',
            });
          }

          const edge = edgeMap.get(key)!;
          edge.count++;
          if (!edge.evidenceSessions.includes(session.id)) {
            edge.evidenceSessions.push(session.id);
          }
        }
      }
    }
  }

  return Array.from(edgeMap.values());
}

// =============================================================================
// Confidence Scoring (T024)
// =============================================================================

/**
 * Calculate confidence score for an edge.
 *
 * Formula: confidence = min(1.0, (evidenceCount / sessionsWithTarget) + errorRecoveryBonus)
 *
 * @param edge Edge to score
 * @param sessionsWithTarget Number of sessions containing target tool
 * @returns Confidence score (0-1)
 */
export function calculateConfidence(edge: Edge, sessionsWithTarget: number): number {
  const baseConfidence = sessionsWithTarget > 0
    ? edge.evidenceSessions.length / sessionsWithTarget
    : 0;

  const bonus = edge.type === 'error-recovery'
    ? MAPPER_CONFIG.errorRecoveryBonus
    : 0;

  return Math.min(1.0, baseConfidence + bonus);
}

// =============================================================================
// Cycle Detection
// =============================================================================

/**
 * Detect cycles in the graph using DFS.
 *
 * @param graph Dependency graph
 * @returns Array of cycles (each cycle is array of node names)
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const edges = graph.edges.get(node) || [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        dfs(edge.to);
      } else if (recursionStack.has(edge.to)) {
        // Found cycle
        const cycleStart = path.indexOf(edge.to);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), edge.to]);
        }
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Break cycles by removing lowest-confidence edges.
 *
 * @param graph Dependency graph to modify (mutates in place)
 * @param sessionsWithTool Map of tool → session count
 */
export function breakCycles(
  graph: DependencyGraph,
  sessionsWithTool: Map<string, number>
): void {
  let cycles = detectCycles(graph);

  while (cycles.length > 0) {
    // Find edge with lowest confidence in first cycle
    const cycle = cycles[0];
    let lowestEdge: { from: string; to: string; confidence: number } | null = null;

    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i];
      const to = cycle[i + 1];
      const edges = graph.edges.get(from);
      const edge = edges?.find(e => e.to === to);

      if (edge) {
        const confidence = calculateConfidence(edge, sessionsWithTool.get(to) || 0);
        if (!lowestEdge || confidence < lowestEdge.confidence) {
          lowestEdge = { from, to, confidence };
        }
      }
    }

    // Remove the edge
    if (lowestEdge) {
      const edges = graph.edges.get(lowestEdge.from);
      if (edges) {
        const idx = edges.findIndex(e => e.to === lowestEdge!.to);
        if (idx >= 0) {
          edges.splice(idx, 1);
        }
      }
    }

    // Re-detect cycles
    cycles = detectCycles(graph);
  }
}

// =============================================================================
// Conversion to Dependencies
// =============================================================================

/**
 * Convert graph to Dependency array with confidence scores.
 *
 * @param graph Dependency graph
 * @param sessionsWithTool Map of tool → session count
 * @returns Array of Dependencies
 */
export function graphToDependencies(
  graph: DependencyGraph,
  sessionsWithTool: Map<string, number>
): Dependency[] {
  const dependencies: Dependency[] = [];

  for (const [from, edges] of graph.edges) {
    for (const edge of edges) {
      const confidence = calculateConfidence(edge, sessionsWithTool.get(edge.to) || 0);

      // Apply minimum thresholds
      if (
        confidence >= MAPPER_CONFIG.minConfidence &&
        edge.evidenceSessions.length >= MAPPER_CONFIG.minEvidence
      ) {
        dependencies.push({
          from: edge.from,
          to: edge.to,
          confidence,
          evidenceCount: edge.evidenceSessions.length,
          evidenceSessions: edge.evidenceSessions,
          type: edge.type,
        });
      }
    }
  }

  // Sort by confidence descending
  dependencies.sort((a, b) => b.confidence - a.confidence);

  return dependencies;
}
