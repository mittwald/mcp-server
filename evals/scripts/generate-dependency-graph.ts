#!/usr/bin/env npx tsx

/**
 * Dependency Graph Generator
 *
 * Generates tool dependency graph in JSON and DOT formats from the inventory.
 *
 * Usage:
 *   npx tsx generate-dependency-graph.ts [inventory-path] [output-dir]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Type Definitions
// ============================================================================

interface ToolEntry {
  mcp_name: string;
  display_name: string;
  domain: string;
  tier: number;
  dependencies: string[];
}

interface ToolInventory {
  tool_count: number;
  tools: ToolEntry[];
}

interface DependencyNode {
  tool_name: string;
  mcp_name: string;
  domain: string;
  tier: number;
  requires: string[];
  required_by: string[];
  transitive_deps: string[];
}

interface DependencyGraph {
  generated_at: string;
  node_count: number;
  edge_count: number;
  tiers: Record<number, string[]>;
  domains: Record<string, string[]>;
  nodes: DependencyNode[];
  adjacency_list: Record<string, string[]>;
  inverse_adjacency: Record<string, string[]>;
}

interface CrossDomainDep {
  source_tool: string;
  source_domain: string;
  target_tool: string;
  target_domain: string;
  relationship: string;
}

// ============================================================================
// Graph Building Functions
// ============================================================================

/**
 * Build adjacency list from inventory
 */
function buildAdjacencyList(inventory: ToolInventory): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};

  for (const tool of inventory.tools) {
    adjacency[tool.display_name] = tool.dependencies || [];
  }

  return adjacency;
}

/**
 * Build inverse adjacency list
 */
function buildInverseAdjacency(adjacency: Record<string, string[]>): Record<string, string[]> {
  const inverse: Record<string, string[]> = {};

  for (const node of Object.keys(adjacency)) {
    inverse[node] = [];
  }

  for (const [node, deps] of Object.entries(adjacency)) {
    for (const dep of deps) {
      if (inverse[dep]) {
        inverse[dep].push(node);
      }
    }
  }

  return inverse;
}

/**
 * Compute transitive dependencies using BFS
 */
function computeTransitiveDeps(
  node: string,
  adjacency: Record<string, string[]>,
  cache: Map<string, string[]>
): string[] {
  if (cache.has(node)) {
    return cache.get(node)!;
  }

  const visited = new Set<string>();
  const queue = [...(adjacency[node] || [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
      const deps = adjacency[current] || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  const result = Array.from(visited);
  cache.set(node, result);
  return result;
}

/**
 * Detect cycles in the graph using DFS
 */
function detectCycles(adjacency: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), node]);
      }
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);

    for (const dep of adjacency[node] || []) {
      dfs(dep, [...path, node]);
    }

    recursionStack.delete(node);
  }

  for (const node of Object.keys(adjacency)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

/**
 * Find cross-domain dependencies
 */
function findCrossDomainDeps(inventory: ToolInventory, adjacency: Record<string, string[]>): CrossDomainDep[] {
  const crossDeps: CrossDomainDep[] = [];
  const toolDomains = new Map<string, string>();

  for (const tool of inventory.tools) {
    toolDomains.set(tool.display_name, tool.domain);
  }

  for (const [source, deps] of Object.entries(adjacency)) {
    const sourceDomain = toolDomains.get(source);

    for (const dep of deps) {
      const targetDomain = toolDomains.get(dep);

      if (sourceDomain && targetDomain && sourceDomain !== targetDomain) {
        crossDeps.push({
          source_tool: source,
          source_domain: sourceDomain,
          target_tool: dep,
          target_domain: targetDomain,
          relationship: `${sourceDomain} → ${targetDomain}`,
        });
      }
    }
  }

  return crossDeps;
}

// ============================================================================
// DOT Format Generation
// ============================================================================

const DOMAIN_COLORS: Record<string, string> = {
  identity: '#E3F2FD',
  organization: '#F3E5F5',
  'project-foundation': '#E8F5E9',
  apps: '#FFF3E0',
  containers: '#E0F7FA',
  databases: '#FCE4EC',
  'domains-mail': '#F1F8E9',
  'access-users': '#FFF8E1',
  automation: '#E8EAF6',
  backups: '#EFEBE9',
  misc: '#FAFAFA',
};

/**
 * Generate DOT format graph
 */
function generateDotGraph(graph: DependencyGraph): string {
  const lines: string[] = [
    'digraph MittWaldMCPTools {',
    '  rankdir=TB;',
    '  node [shape=box, style=filled];',
    '',
  ];

  // Create subgraphs by domain
  for (const [domain, tools] of Object.entries(graph.domains)) {
    const safeDomain = domain.replace(/-/g, '_');
    lines.push(`  subgraph cluster_${safeDomain} {`);
    lines.push(`    label="${domain}";`);
    lines.push(`    style=filled;`);
    lines.push(`    color="${DOMAIN_COLORS[domain] || '#FFFFFF'}";`);

    for (const tool of tools) {
      const safeId = tool.replace(/\//g, '_');
      lines.push(`    ${safeId} [label="${tool}"];`);
    }
    lines.push('  }');
    lines.push('');
  }

  // Add edges
  lines.push('  // Dependencies');
  for (const [node, deps] of Object.entries(graph.adjacency_list)) {
    const safeNode = node.replace(/\//g, '_');
    for (const dep of deps) {
      const safeDep = dep.replace(/\//g, '_');
      lines.push(`  ${safeNode} -> ${safeDep};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate cross-domain documentation markdown
 */
function generateCrossDomainDocs(crossDeps: CrossDomainDep[]): string {
  const lines: string[] = [
    '# Cross-Domain Dependencies',
    '',
    'This document identifies tools that depend on resources from other domains.',
    '',
    '## Summary',
    '',
  ];

  // Group by relationship
  const byRelationship = new Map<string, CrossDomainDep[]>();
  for (const dep of crossDeps) {
    const key = dep.relationship;
    if (!byRelationship.has(key)) {
      byRelationship.set(key, []);
    }
    byRelationship.get(key)!.push(dep);
  }

  lines.push('| Relationship | Count |');
  lines.push('|--------------|-------|');
  for (const [rel, deps] of Array.from(byRelationship.entries()).sort()) {
    lines.push(`| ${rel} | ${deps.length} |`);
  }

  lines.push('', '## Details', '');

  for (const [rel, deps] of Array.from(byRelationship.entries()).sort()) {
    lines.push(`### ${rel}`, '');
    for (const dep of deps) {
      lines.push(`- \`${dep.source_tool}\` depends on \`${dep.target_tool}\``);
    }
    lines.push('');
  }

  lines.push(
    '## Implications',
    '',
    '1. When executing evals, ensure cross-domain dependencies are established first',
    '2. Domain-parallel execution must respect these dependencies',
    '3. Resource cleanup should follow reverse dependency order'
  );

  return lines.join('\n');
}

// ============================================================================
// Main Generation Function
// ============================================================================

async function generateDependencyGraph(inventoryPath: string, outputDir: string): Promise<void> {
  console.log('Loading inventory...');
  const inventory: ToolInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

  console.log(`Building graph for ${inventory.tool_count} tools...`);

  // Build adjacency lists
  const adjacency = buildAdjacencyList(inventory);
  const inverse = buildInverseAdjacency(adjacency);

  // Check for cycles
  const cycles = detectCycles(adjacency);
  if (cycles.length > 0) {
    console.warn('WARNING: Cycles detected in dependency graph:');
    for (const cycle of cycles) {
      console.warn(`  Cycle: ${cycle.join(' -> ')}`);
    }
  } else {
    console.log('No cycles detected.');
  }

  // Build nodes with computed data
  const nodes: DependencyNode[] = [];
  const cache = new Map<string, string[]>();

  for (const tool of inventory.tools) {
    nodes.push({
      tool_name: tool.display_name,
      mcp_name: tool.mcp_name,
      domain: tool.domain,
      tier: tool.tier,
      requires: adjacency[tool.display_name] || [],
      required_by: inverse[tool.display_name] || [],
      transitive_deps: computeTransitiveDeps(tool.display_name, adjacency, cache),
    });
  }

  // Group by tier and domain
  const tiers: Record<number, string[]> = {};
  const domains: Record<string, string[]> = {};

  for (const tool of inventory.tools) {
    if (!tiers[tool.tier]) tiers[tool.tier] = [];
    tiers[tool.tier].push(tool.display_name);

    if (!domains[tool.domain]) domains[tool.domain] = [];
    domains[tool.domain].push(tool.display_name);
  }

  // Count edges
  let edgeCount = 0;
  for (const deps of Object.values(adjacency)) {
    edgeCount += deps.length;
  }

  // Build final graph
  const graph: DependencyGraph = {
    generated_at: new Date().toISOString(),
    node_count: inventory.tool_count,
    edge_count: edgeCount,
    tiers,
    domains,
    nodes,
    adjacency_list: adjacency,
    inverse_adjacency: inverse,
  };

  // Write outputs
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'dependency-graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2));
  console.log(`JSON graph written to: ${jsonPath}`);

  const dotPath = path.join(outputDir, 'dependency-graph.dot');
  fs.writeFileSync(dotPath, generateDotGraph(graph));
  console.log(`DOT graph written to: ${dotPath}`);

  // Generate cross-domain docs
  const crossDeps = findCrossDomainDeps(inventory, adjacency);
  const crossDocsPath = path.join(outputDir, 'cross-domain-deps.md');
  fs.writeFileSync(crossDocsPath, generateCrossDomainDocs(crossDeps));
  console.log(`Cross-domain docs written to: ${crossDocsPath}`);

  console.log(`\nGraph summary:`);
  console.log(`  Nodes: ${graph.node_count}`);
  console.log(`  Edges: ${graph.edge_count}`);
  console.log(`  Cross-domain deps: ${crossDeps.length}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const inventoryPath = args[0] || 'evals/inventory/tools.json';
  const outputDir = args[1] || 'evals/inventory';

  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    process.exit(1);
  }

  await generateDependencyGraph(inventoryPath, outputDir);
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-dependency-graph.ts')) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

export { generateDependencyGraph, buildAdjacencyList, detectCycles, findCrossDomainDeps };
