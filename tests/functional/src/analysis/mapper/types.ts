/**
 * Mapper Types
 *
 * Type definitions for tool dependency mapping.
 */

import type { Dependency, DependencyExport, TestDomain } from '../types.js';

/**
 * Ordered tool sequence from a session.
 */
export interface ToolSequence {
  sessionId: string;
  tools: string[];
}

/**
 * Internal edge representation during graph building.
 */
export interface Edge {
  from: string;
  to: string;
  count: number;
  evidenceSessions: string[];
  type: 'sequence' | 'error-recovery';
}

/**
 * Dependency graph structure.
 */
export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Edge[]>;  // from → Edge[]
}

/**
 * Configuration for dependency detection.
 */
export const MAPPER_CONFIG = {
  minConfidence: 0.1,       // Minimum confidence to include edge (lowered for sparse data)
  minEvidence: 1,           // Minimum evidence sessions required (lowered for sparse data)
  errorRecoveryBonus: 0.2,  // Confidence bonus for error-recovery patterns
  maxEdgesPerNode: 10,      // Limit edges per node for DOT clarity
} as const;

/**
 * Tool name constants.
 */
export const MCP_TOOL_PREFIX = 'mcp__mittwald__';
