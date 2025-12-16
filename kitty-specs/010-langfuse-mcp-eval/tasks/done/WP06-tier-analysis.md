---
work_package_id: "WP06"
subtasks:
  - "T001"
title: "Tier Analysis Report"
phase: "Phase 2 - Dependency Graph & Inventory"
lane: "done"
assignee: "claude"
agent: "claude"
shell_pid: "21470"
review_status: "approved without changes"
reviewed_by: "claude"
history:
  - timestamp: "2025-12-16T13:06:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T16:41:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "78380"
    action: "Generated tier analysis - 21 phases, Tier 4 has 80% (140 tools)"
  - timestamp: "2025-12-16T15:55:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "21470"
    action: "Review approved - all acceptance criteria met"
---

# Work Package Prompt: WP06 – Tier Analysis Report

## Objective

Analyze and document the tier distribution of all 175 MCP tools, providing execution order recommendations and tier-specific considerations for eval execution.

## Context

Tools are classified into tiers 0-4 based on their dependency depth:
- **Tier 0**: No prerequisites (can run immediately)
- **Tier 1**: Requires authenticated user/org context
- **Tier 2**: Requires server access
- **Tier 3**: Project creation tools
- **Tier 4**: Requires existing project/resources

Understanding this distribution helps plan efficient eval execution.

## Technical Requirements

### Input
- Tool inventory from WP-04: `evals/inventory/tools.json`
- Dependency graph from WP-05: `evals/inventory/dependency-graph.json`

### Output
- `evals/inventory/tier-analysis.md` - Comprehensive tier analysis report
- `evals/inventory/execution-order.json` - Recommended execution sequence

## Implementation Steps

### Step 1: Load and Analyze Inventory

```typescript
interface TierAnalysis {
  tier: number;
  description: string;
  tool_count: number;
  percentage: number;
  domains_represented: string[];
  tools: Array<{
    display_name: string;
    domain: string;
    dependencies: string[];
    is_destructive: boolean;
  }>;
  execution_notes: string[];
}

async function analyzeTiers(inventoryPath: string): Promise<TierAnalysis[]> {
  const inventory: ToolInventory = JSON.parse(
    fs.readFileSync(inventoryPath, 'utf-8')
  );

  const tierDescriptions = [
    'No prerequisites - can execute immediately',
    'Organization-level - requires authenticated user context',
    'Server-level - requires access to a server',
    'Project creation - creates project resources',
    'Project-dependent - requires existing project/resources'
  ];

  const tiers: Map<number, TierAnalysis> = new Map();

  // Initialize tiers
  for (let i = 0; i <= 4; i++) {
    tiers.set(i, {
      tier: i,
      description: tierDescriptions[i],
      tool_count: 0,
      percentage: 0,
      domains_represented: [],
      tools: [],
      execution_notes: []
    });
  }

  // Categorize tools
  for (const tool of inventory.tools) {
    const analysis = tiers.get(tool.tier)!;
    analysis.tool_count++;
    analysis.tools.push({
      display_name: tool.display_name,
      domain: tool.domain,
      dependencies: tool.dependencies,
      is_destructive: tool.is_destructive || false
    });

    if (!analysis.domains_represented.includes(tool.domain)) {
      analysis.domains_represented.push(tool.domain);
    }
  }

  // Calculate percentages and add notes
  const total = inventory.tool_count;
  for (const analysis of tiers.values()) {
    analysis.percentage = (analysis.tool_count / total) * 100;
    analysis.execution_notes = generateTierNotes(analysis);
  }

  return Array.from(tiers.values());
}
```

### Step 2: Generate Tier-Specific Notes

```typescript
function generateTierNotes(analysis: TierAnalysis): string[] {
  const notes: string[] = [];

  switch (analysis.tier) {
    case 0:
      notes.push('Execute first to validate authentication and basic connectivity');
      notes.push('No setup required - ideal for smoke testing');
      notes.push('Failures here indicate fundamental issues (auth, network, server)');
      break;
    case 1:
      notes.push('Verify organization membership before executing');
      notes.push('Some tools may modify org settings - review before execution');
      notes.push('Extension tools may have additional prerequisites');
      break;
    case 2:
      notes.push('Requires access to at least one server');
      notes.push('Use server/list to identify available servers first');
      break;
    case 3:
      notes.push('CRITICAL: These tools create resources that affect quotas');
      notes.push('Consider using a dedicated test project');
      notes.push('Track created resources for cleanup');
      break;
    case 4:
      notes.push('Largest tier - contains most operational tools');
      notes.push('Execute after Tier 3 establishes project context');
      notes.push('Many tools are domain-isolated (can run in parallel within domain)');
      if (analysis.tools.some(t => t.is_destructive)) {
        notes.push('WARNING: Contains destructive operations (delete, uninstall)');
        notes.push('Execute destructive tools last within each domain');
      }
      break;
  }

  return notes;
}
```

### Step 3: Generate Execution Order

```typescript
interface ExecutionPhase {
  phase: number;
  name: string;
  tier: number;
  tools: string[];
  parallel_safe: boolean;
  notes: string;
}

function generateExecutionOrder(
  tiers: TierAnalysis[],
  graph: DependencyGraph
): ExecutionPhase[] {
  const phases: ExecutionPhase[] = [];

  // Phase 0: Tier 0 tools (all parallel-safe)
  phases.push({
    phase: 0,
    name: 'Foundation',
    tier: 0,
    tools: tiers.find(t => t.tier === 0)?.tools.map(t => t.display_name) || [],
    parallel_safe: true,
    notes: 'All Tier 0 tools can run in parallel'
  });

  // Phase 1: Tier 1 tools
  phases.push({
    phase: 1,
    name: 'Organization',
    tier: 1,
    tools: tiers.find(t => t.tier === 1)?.tools.map(t => t.display_name) || [],
    parallel_safe: true,
    notes: 'Org-level tools, parallel within domain'
  });

  // Phase 2: Tier 2 & 3 tools (sequential - creates resources)
  const tier2Tools = tiers.find(t => t.tier === 2)?.tools.map(t => t.display_name) || [];
  const tier3Tools = tiers.find(t => t.tier === 3)?.tools.map(t => t.display_name) || [];
  phases.push({
    phase: 2,
    name: 'Resource Creation',
    tier: 3,
    tools: [...tier2Tools, ...tier3Tools],
    parallel_safe: false,
    notes: 'Sequential execution - creates shared resources'
  });

  // Phase 3+: Tier 4 tools by domain (parallel by domain)
  const tier4 = tiers.find(t => t.tier === 4);
  if (tier4) {
    const byDomain = new Map<string, string[]>();
    for (const tool of tier4.tools) {
      if (!byDomain.has(tool.domain)) {
        byDomain.set(tool.domain, []);
      }
      byDomain.get(tool.domain)!.push(tool.display_name);
    }

    let phaseNum = 3;
    for (const [domain, tools] of byDomain) {
      // Separate destructive and non-destructive
      const nonDestructive = tools.filter(t =>
        !t.includes('delete') && !t.includes('uninstall')
      );
      const destructive = tools.filter(t =>
        t.includes('delete') || t.includes('uninstall')
      );

      if (nonDestructive.length > 0) {
        phases.push({
          phase: phaseNum++,
          name: `${domain} - Operations`,
          tier: 4,
          tools: nonDestructive,
          parallel_safe: true,
          notes: `Non-destructive ${domain} tools`
        });
      }

      if (destructive.length > 0) {
        phases.push({
          phase: phaseNum++,
          name: `${domain} - Cleanup`,
          tier: 4,
          tools: destructive,
          parallel_safe: false,
          notes: `Destructive ${domain} tools - execute last`
        });
      }
    }
  }

  return phases;
}
```

### Step 4: Generate Markdown Report

```typescript
function generateTierReport(
  tiers: TierAnalysis[],
  phases: ExecutionPhase[]
): string {
  const lines: string[] = [
    '# Tier Analysis: Mittwald MCP Tools',
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Total Tools**: 175`,
    '',
    '## Tier Distribution',
    '',
    '| Tier | Description | Tools | % | Domains |',
    '|------|-------------|-------|---|---------|'
  ];

  for (const tier of tiers) {
    lines.push(
      `| ${tier.tier} | ${tier.description} | ${tier.tool_count} | ${tier.percentage.toFixed(1)}% | ${tier.domains_represented.join(', ')} |`
    );
  }

  lines.push('', '## Tier Details', '');

  for (const tier of tiers) {
    lines.push(
      `### Tier ${tier.tier}: ${tier.description}`,
      '',
      `**Tool Count**: ${tier.tool_count} (${tier.percentage.toFixed(1)}%)`,
      '',
      '**Execution Notes**:'
    );

    for (const note of tier.execution_notes) {
      lines.push(`- ${note}`);
    }

    lines.push('', '**Tools**:', '');

    // Group by domain
    const byDomain = new Map<string, typeof tier.tools>();
    for (const tool of tier.tools) {
      if (!byDomain.has(tool.domain)) {
        byDomain.set(tool.domain, []);
      }
      byDomain.get(tool.domain)!.push(tool);
    }

    for (const [domain, tools] of byDomain) {
      lines.push(`*${domain}*:`);
      for (const tool of tools) {
        const marker = tool.is_destructive ? ' ⚠️' : '';
        lines.push(`- \`${tool.display_name}\`${marker}`);
      }
      lines.push('');
    }
  }

  lines.push('## Recommended Execution Order', '');

  for (const phase of phases) {
    const parallelNote = phase.parallel_safe ? '(parallel)' : '(sequential)';
    lines.push(
      `### Phase ${phase.phase}: ${phase.name} ${parallelNote}`,
      '',
      `- **Tier**: ${phase.tier}`,
      `- **Tools**: ${phase.tools.length}`,
      `- **Notes**: ${phase.notes}`,
      ''
    );

    if (phase.tools.length <= 10) {
      lines.push('**Tools**:');
      for (const tool of phase.tools) {
        lines.push(`- \`${tool}\``);
      }
    } else {
      lines.push(`**Tools**: ${phase.tools.slice(0, 5).map(t => `\`${t}\``).join(', ')}... and ${phase.tools.length - 5} more`);
    }
    lines.push('');
  }

  lines.push(
    '## Parallelization Opportunities',
    '',
    '### Safe for Parallel Execution',
    '- All Tier 0 tools (no dependencies)',
    '- Tier 4 tools within the same domain (after dependencies met)',
    '- Read-only operations (list, get) across domains',
    '',
    '### Require Sequential Execution',
    '- Tier 3 (project creation) - affects shared state',
    '- Destructive operations within each domain',
    '- Tools with cross-domain dependencies',
    '',
    '### Recommended Parallelization Strategy',
    '1. Execute Tier 0 in parallel (foundation check)',
    '2. Execute Tier 1-3 sequentially (resource setup)',
    '3. Execute Tier 4 with domain-level parallelism',
    '4. Execute destructive operations last (sequential)',
    '',
    '## Legend',
    '',
    '- ⚠️ = Destructive operation (delete, uninstall, revoke)',
    '- Domains can be executed in parallel after Tier 3 completes'
  );

  return lines.join('\n');
}
```

### Step 5: Main Function

```typescript
async function main() {
  const inventoryPath = process.argv[2] || 'evals/inventory/tools.json';
  const graphPath = process.argv[3] || 'evals/inventory/dependency-graph.json';
  const outputDir = process.argv[4] || 'evals/inventory';

  console.log('Analyzing tiers...');
  const tiers = await analyzeTiers(inventoryPath);

  console.log('Loading dependency graph...');
  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  console.log('Generating execution order...');
  const phases = generateExecutionOrder(tiers, graph);

  // Write execution order JSON
  const orderPath = path.join(outputDir, 'execution-order.json');
  fs.writeFileSync(orderPath, JSON.stringify(phases, null, 2));
  console.log(`Execution order written to: ${orderPath}`);

  // Write tier analysis report
  const reportPath = path.join(outputDir, 'tier-analysis.md');
  fs.writeFileSync(reportPath, generateTierReport(tiers, phases));
  console.log(`Tier analysis written to: ${reportPath}`);

  // Summary
  console.log('\nTier Summary:');
  for (const tier of tiers) {
    console.log(`  Tier ${tier.tier}: ${tier.tool_count} tools (${tier.percentage.toFixed(1)}%)`);
  }
  console.log(`\nExecution phases: ${phases.length}`);
}

main().catch(console.error);
```

## Expected Tier Distribution

Based on research:

| Tier | Expected Count | Percentage |
|------|----------------|------------|
| 0 | ~15 | ~9% |
| 1 | ~12 | ~7% |
| 2 | ~2 | ~1% |
| 3 | ~4 | ~2% |
| 4 | ~142 | ~81% |

## Deliverables

- [ ] `evals/inventory/tier-analysis.md` - Complete tier analysis report
- [ ] `evals/inventory/execution-order.json` - Phased execution sequence
- [ ] All 175 tools categorized
- [ ] Parallelization opportunities documented

## Acceptance Criteria

1. All tiers (0-4) represented in analysis
2. Each tier has execution notes
3. Execution order respects dependencies
4. Destructive operations identified
5. Parallelization strategy documented

## Parallelization Notes

This WP:
- **Depends on**: WP-04 (Tool Inventory), WP-05 (Dependency Graph)
- **Can run in parallel with**: WP-05 (after WP-04 completes)
- **Informs**: Phase 4 execution strategy

## Dependencies

- `evals/inventory/tools.json` (from WP-04)
- `evals/inventory/dependency-graph.json` (from WP-05)

