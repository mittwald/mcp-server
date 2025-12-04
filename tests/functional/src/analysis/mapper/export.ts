/**
 * Dependency Export (T025, T026)
 *
 * Exports dependencies to JSON and DOT formats.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Dependency, DependencyExport, TestDomain } from '../types.js';
import { mapToolToDomain } from '../../inventory/grouping.js';
import { parseToolName } from '../../inventory/discovery.js';
import { MAPPER_CONFIG, MCP_TOOL_PREFIX } from './types.js';

// =============================================================================
// JSON Export (T025)
// =============================================================================

/**
 * Export dependencies to JSON file.
 *
 * @param deps Dependency export
 * @param outputPath Path to write dependencies.json
 */
export function exportToJson(deps: DependencyExport, outputPath: string): void {
  // Ensure output directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const json = {
    dependencies: deps.dependencies.map(d => ({
      ...d,
      // Limit evidence sessions for file size
      evidenceSessions: d.evidenceSessions.slice(0, 10),
    })),
    stats: deps.stats,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
}

// =============================================================================
// DOT Export (T026)
// =============================================================================

/**
 * Get color for confidence level.
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'green';
  if (confidence >= 0.5) return 'orange';
  return 'red';
}

/**
 * Get short display name for a tool.
 */
function getShortName(mcpToolName: string): string {
  // Remove prefix and convert to short form
  const displayName = parseToolName(mcpToolName);
  // Replace slashes with underscores for DOT node names
  return displayName.replace(/\//g, '_');
}

/**
 * Export dependencies to DOT format for Graphviz.
 *
 * @param deps Dependency export
 * @param outputPath Path to write dependencies.dot
 */
export function exportToDot(deps: DependencyExport, outputPath: string): void {
  // Ensure output directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Group nodes by domain
  const nodesByDomain = new Map<TestDomain, string[]>();
  const allNodes = new Set<string>();

  for (const dep of deps.dependencies) {
    allNodes.add(dep.from);
    allNodes.add(dep.to);
  }

  for (const node of allNodes) {
    const domain = mapToolToDomain(node);
    if (!nodesByDomain.has(domain)) {
      nodesByDomain.set(domain, []);
    }
    nodesByDomain.get(domain)!.push(node);
  }

  // Build DOT content
  const lines: string[] = [];
  lines.push('digraph ToolDependencies {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, fontsize=10];');
  lines.push('  edge [fontsize=8];');
  lines.push('');

  // Create subgraph clusters for each domain
  const domainColors: Record<string, string> = {
    'identity': '#e3f2fd',
    'organization': '#fff3e0',
    'project-foundation': '#e8f5e9',
    'apps': '#fce4ec',
    'containers': '#f3e5f5',
    'databases': '#e0f2f1',
    'domains-mail': '#fff8e1',
    'access-users': '#e8eaf6',
    'automation': '#efebe9',
    'backups': '#eceff1',
  };

  for (const [domain, nodes] of nodesByDomain) {
    if (nodes.length === 0) continue;

    const color = domainColors[domain] || '#f5f5f5';
    const clusterName = domain.replace(/-/g, '_');

    lines.push(`  subgraph cluster_${clusterName} {`);
    lines.push(`    label="${domain}";`);
    lines.push(`    style=filled;`);
    lines.push(`    fillcolor="${color}";`);
    lines.push('');

    for (const node of nodes) {
      const shortName = getShortName(node);
      lines.push(`    "${shortName}";`);
    }

    lines.push('  }');
    lines.push('');
  }

  // Add edges
  lines.push('  // Edges');

  // Limit edges for clarity
  const topEdges = deps.dependencies
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 100);

  for (const dep of topEdges) {
    const fromName = getShortName(dep.from);
    const toName = getShortName(dep.to);
    const color = getConfidenceColor(dep.confidence);
    const label = `${Math.round(dep.confidence * 100)}%`;
    const style = dep.type === 'error-recovery' ? 'dashed' : 'solid';

    lines.push(`  "${fromName}" -> "${toName}" [label="${label}", color="${color}", style="${style}"];`);
  }

  lines.push('}');

  writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

// =============================================================================
// Combined Export
// =============================================================================

/**
 * Export dependencies to both JSON and DOT formats.
 *
 * @param deps Dependency export
 * @param jsonPath Path for JSON output
 * @param dotPath Path for DOT output
 */
export function exportDependencies(
  deps: DependencyExport,
  jsonPath: string,
  dotPath: string
): void {
  exportToJson(deps, jsonPath);
  exportToDot(deps, dotPath);
}
