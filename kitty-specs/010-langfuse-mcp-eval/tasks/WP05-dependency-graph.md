---
work_package_id: WP05
title: Dependency Graph Generation
lane: done
history:
- timestamp: '2025-12-16T13:05:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T16:39:00Z'
  lane: for_review
  agent: claude
  shell_pid: '78380'
  action: Generated dependency graph - 175 nodes, 140 edges, 43 cross-domain deps, no cycles
- timestamp: '2025-12-16T17:30:00Z'
  lane: done
  agent: claude-reviewer
  shell_pid: '20983'
  action: 'APPROVED - All criteria verified: 175 nodes, valid DOT, 43 cross-domain deps documented, transitive deps computed'
agent: claude-reviewer
assignee: claude
phase: Phase 2 - Dependency Graph & Inventory
review_status: approved
reviewed_by: claude-reviewer
shell_pid: '20983'
subtasks:
- T001
---

## Review Feedback

**Status**: ✅ **APPROVED**

**Review Summary**:
- JSON graph contains all 175 tools with proper node structure
- DOT file has valid Graphviz syntax (subgraphs, edges, proper closing)
- Cross-domain documentation comprehensive: 43 dependencies in 7 relationship categories
- Transitive dependencies computed correctly for all 175 nodes
- Graph statistics: 175 nodes, 140 edges, 5 tiers, 11 domains

# Work Package Prompt: WP05 – Dependency Graph Generation

## Objective

Generate a tool dependency graph in JSON adjacency list format and Graphviz DOT format for visualization. This graph enables:
1. Correct execution ordering (topological sort)
2. Understanding prerequisite chains
3. Identifying cross-domain dependencies

## Context

Tool dependencies follow a tier structure:
- Tier 0 tools have no dependencies
- Higher tier tools depend on lower tier tools
- Some tools have cross-domain dependencies (e.g., backup depends on database)

## Technical Requirements

### Input
- Tool inventory from WP-04: `evals/inventory/tools.json`

### Output
- `evals/inventory/dependency-graph.json` - Adjacency list representation
- `evals/inventory/dependency-graph.dot` - Graphviz DOT format
- `evals/inventory/cross-domain-deps.md` - Cross-domain dependency documentation

## Implementation Steps

### Step 1: Define Graph Structures

```typescript
interface DependencyNode {
  tool_name: string;        // display_name from inventory
  mcp_name: string;         // full MCP tool name
  domain: string;
  tier: number;
  requires: string[];       // direct dependencies (display_names)
  required_by: string[];    // inverse dependencies
  transitive_deps: string[]; // all dependencies (computed)
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
```

### Step 2: Build Adjacency Lists

```typescript
function buildAdjacencyList(inventory: ToolInventory): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};

  for (const tool of inventory.tools) {
    adjacency[tool.display_name] = tool.dependencies || [];
  }

  return adjacency;
}

function buildInverseAdjacency(adjacency: Record<string, string[]>): Record<string, string[]> {
  const inverse: Record<string, string[]> = {};

  // Initialize all nodes
  for (const node of Object.keys(adjacency)) {
    inverse[node] = [];
  }

  // Build inverse edges
  for (const [node, deps] of Object.entries(adjacency)) {
    for (const dep of deps) {
      if (inverse[dep]) {
        inverse[dep].push(node);
      }
    }
  }

  return inverse;
}
```

### Step 3: Compute Transitive Dependencies

```typescript
function computeTransitiveDeps(
  node: string,
  adjacency: Record<string, string[]>,
  cache: Map<string, string[]>
): string[] {
  if (cache.has(node)) {
    return cache.get(node)!;
  }

  const directDeps = adjacency[node] || [];
  const allDeps = new Set<string>(directDeps);

  for (const dep of directDeps) {
    const transitive = computeTransitiveDeps(dep, adjacency, cache);
    for (const t of transitive) {
      allDeps.add(t);
    }
  }

  const result = Array.from(allDeps);
  cache.set(node, result);
  return result;
}
```

### Step 4: Detect Cycles (Validation)

```typescript
function detectCycles(adjacency: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);

    for (const dep of adjacency[node] || []) {
      if (!visited.has(dep)) {
        if (dfs(dep, [...path, dep])) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        // Found cycle
        const cycleStart = path.indexOf(dep);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of Object.keys(adjacency)) {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  }

  return cycles;
}
```

### Step 5: Generate DOT Format

```typescript
function generateDotGraph(graph: DependencyGraph): string {
  const lines: string[] = [
    'digraph MittWaldMCPTools {',
    '  rankdir=TB;',
    '  node [shape=box, style=filled];',
    ''
  ];

  // Domain colors
  const domainColors: Record<string, string> = {
    'identity': '#E3F2FD',
    'organization': '#F3E5F5',
    'project-foundation': '#E8F5E9',
    'apps': '#FFF3E0',
    'containers': '#E0F7FA',
    'databases': '#FCE4EC',
    'domains-mail': '#F1F8E9',
    'access-users': '#FFF8E1',
    'automation': '#E8EAF6',
    'backups': '#EFEBE9',
    'misc': '#FAFAFA'
  };

  // Create subgraphs by domain
  for (const [domain, tools] of Object.entries(graph.domains)) {
    lines.push(`  subgraph cluster_${domain.replace('-', '_')} {`);
    lines.push(`    label="${domain}";`);
    lines.push(`    style=filled;`);
    lines.push(`    color="${domainColors[domain] || '#FFFFFF'}";`);

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
```

### Step 6: Identify Cross-Domain Dependencies

```typescript
interface CrossDomainDep {
  source_tool: string;
  source_domain: string;
  target_tool: string;
  target_domain: string;
  relationship: string;
}

function findCrossDomainDeps(
  inventory: ToolInventory,
  adjacency: Record<string, string[]>
): CrossDomainDep[] {
  const crossDeps: CrossDomainDep[] = [];
  const toolDomains = new Map<string, string>();

  // Build tool-to-domain map
  for (const tool of inventory.tools) {
    toolDomains.set(tool.display_name, tool.domain);
  }

  // Find cross-domain edges
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
          relationship: `${sourceDomain} → ${targetDomain}`
        });
      }
    }
  }

  return crossDeps;
}
```

### Step 7: Generate Cross-Domain Documentation

```typescript
function generateCrossDomainDocs(crossDeps: CrossDomainDep[]): string {
  const lines: string[] = [
    '# Cross-Domain Dependencies',
    '',
    'This document identifies tools that depend on resources from other domains.',
    '',
    '## Summary',
    ''
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
  for (const [rel, deps] of byRelationship) {
    lines.push(`| ${rel} | ${deps.length} |`);
  }

  lines.push('', '## Details', '');

  for (const [rel, deps] of byRelationship) {
    lines.push(`### ${rel}`, '');
    for (const dep of deps) {
      lines.push(`- \`${dep.source_tool}\` depends on \`${dep.target_tool}\``);
    }
    lines.push('');
  }

  lines.push('## Implications', '',
    '1. When executing evals, ensure cross-domain dependencies are established first',
    '2. Domain-parallel execution must respect these dependencies',
    '3. Resource cleanup should follow reverse dependency order'
  );

  return lines.join('\n');
}
```

### Step 8: Main Generation Function

```typescript
async function generateDependencyGraph(
  inventoryPath: string,
  outputDir: string
): Promise<void> {
  console.log('Loading inventory...');
  const inventory: ToolInventory = JSON.parse(
    fs.readFileSync(inventoryPath, 'utf-8')
  );

  console.log(`Building graph for ${inventory.tool_count} tools...`);

  // Build adjacency lists
  const adjacency = buildAdjacencyList(inventory);
  const inverse = buildInverseAdjacency(adjacency);

  // Check for cycles
  const cycles = detectCycles(adjacency);
  if (cycles.length > 0) {
    console.error('ERROR: Cycles detected in dependency graph!');
    for (const cycle of cycles) {
      console.error(`  Cycle: ${cycle.join(' -> ')}`);
    }
    process.exit(1);
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
      transitive_deps: computeTransitiveDeps(tool.display_name, adjacency, cache)
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
    inverse_adjacency: inverse
  };

  // Write JSON
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'dependency-graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2));
  console.log(`JSON graph written to: ${jsonPath}`);

  // Write DOT
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
```

## Deliverables

- [x] `evals/inventory/dependency-graph.json` - Complete adjacency list graph (85KB)
- [x] `evals/inventory/dependency-graph.dot` - Graphviz visualization (15KB)
- [x] `evals/inventory/cross-domain-deps.md` - Cross-domain documentation (43 deps)
- [x] No cycles detected in graph
- [x] All 175 tools represented as nodes

## Acceptance Criteria

1. ✅ JSON graph contains all 175 tools (node_count: 175)
2. ✅ No circular dependencies detected (tier-based hierarchy ensures DAG)
3. ✅ DOT file renders in Graphviz (valid syntax verified)
4. ✅ Cross-domain dependencies documented (7 relationship categories)
5. ✅ Transitive dependencies computed correctly (all 175 nodes have transitive_deps)

## Visualizing the Graph

After generation, render the DOT file:

```bash
# Generate PNG
dot -Tpng dependency-graph.dot -o dependency-graph.png

# Generate SVG (better for large graphs)
dot -Tsvg dependency-graph.dot -o dependency-graph.svg

# Generate PDF
dot -Tpdf dependency-graph.dot -o dependency-graph.pdf
```

## Parallelization Notes

This WP:
- **Depends on**: WP-04 (Tool Inventory)
- **Can run in parallel with**: WP-06 (Tier Analysis) - both depend only on WP-04
- **Enables**: Execution ordering in Phase 4

## Dependencies

- `evals/inventory/tools.json` (from WP-04)
- Graphviz (for visualization, optional)

