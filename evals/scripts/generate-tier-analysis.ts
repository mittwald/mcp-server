#!/usr/bin/env npx tsx

/**
 * Tier Analysis Report Generator
 *
 * Analyzes tool tier distribution and generates execution order recommendations.
 *
 * Usage:
 *   npx tsx generate-tier-analysis.ts [inventory-path] [graph-path] [output-dir]
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
  is_destructive?: boolean;
}

interface ToolInventory {
  tool_count: number;
  tools: ToolEntry[];
}

interface DependencyGraph {
  generated_at: string;
  node_count: number;
  edge_count: number;
  tiers: Record<number, string[]>;
  domains: Record<string, string[]>;
}

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

interface ExecutionPhase {
  phase: number;
  name: string;
  tier: number;
  tools: string[];
  parallel_safe: boolean;
  notes: string;
}

// ============================================================================
// Tier Analysis Functions
// ============================================================================

const TIER_DESCRIPTIONS = [
  'No prerequisites - can execute immediately',
  'Organization-level - requires authenticated user context',
  'Server-level - requires access to a server',
  'Project creation - creates project resources',
  'Project-dependent - requires existing project/resources',
];

/**
 * Analyze tool distribution across tiers
 */
function analyzeTiers(inventory: ToolInventory): TierAnalysis[] {
  const tiers: Map<number, TierAnalysis> = new Map();

  // Initialize tiers 0-4
  for (let i = 0; i <= 4; i++) {
    tiers.set(i, {
      tier: i,
      description: TIER_DESCRIPTIONS[i],
      tool_count: 0,
      percentage: 0,
      domains_represented: [],
      tools: [],
      execution_notes: [],
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
      is_destructive: isDestructive(tool.display_name),
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

/**
 * Check if a tool is destructive
 */
function isDestructive(displayName: string): boolean {
  return (
    displayName.includes('delete') ||
    displayName.includes('uninstall') ||
    displayName.includes('revoke') ||
    displayName.includes('remove') ||
    displayName.includes('abort')
  );
}

/**
 * Generate execution notes for a tier
 */
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
      if (analysis.tools.some((t) => t.is_destructive)) {
        notes.push('WARNING: Contains destructive operations (delete, uninstall)');
        notes.push('Execute destructive tools last within each domain');
      }
      break;
  }

  return notes;
}

// ============================================================================
// Execution Order Generation
// ============================================================================

/**
 * Generate phased execution order
 */
function generateExecutionOrder(tiers: TierAnalysis[], graph: DependencyGraph): ExecutionPhase[] {
  const phases: ExecutionPhase[] = [];

  // Phase 0: Tier 0 tools (all parallel-safe)
  const tier0 = tiers.find((t) => t.tier === 0);
  if (tier0 && tier0.tools.length > 0) {
    phases.push({
      phase: 0,
      name: 'Foundation',
      tier: 0,
      tools: tier0.tools.map((t) => t.display_name),
      parallel_safe: true,
      notes: 'All Tier 0 tools can run in parallel',
    });
  }

  // Phase 1: Tier 1 tools
  const tier1 = tiers.find((t) => t.tier === 1);
  if (tier1 && tier1.tools.length > 0) {
    phases.push({
      phase: 1,
      name: 'Organization',
      tier: 1,
      tools: tier1.tools.map((t) => t.display_name),
      parallel_safe: true,
      notes: 'Org-level tools, parallel within domain',
    });
  }

  // Phase 2: Tier 2 & 3 tools (sequential - creates resources)
  const tier2Tools = tiers.find((t) => t.tier === 2)?.tools.map((t) => t.display_name) || [];
  const tier3Tools = tiers.find((t) => t.tier === 3)?.tools.map((t) => t.display_name) || [];
  if (tier2Tools.length > 0 || tier3Tools.length > 0) {
    phases.push({
      phase: 2,
      name: 'Resource Creation',
      tier: 3,
      tools: [...tier2Tools, ...tier3Tools],
      parallel_safe: false,
      notes: 'Sequential execution - creates shared resources',
    });
  }

  // Phase 3+: Tier 4 tools by domain
  const tier4 = tiers.find((t) => t.tier === 4);
  if (tier4) {
    const byDomain = new Map<string, typeof tier4.tools>();
    for (const tool of tier4.tools) {
      if (!byDomain.has(tool.domain)) {
        byDomain.set(tool.domain, []);
      }
      byDomain.get(tool.domain)!.push(tool);
    }

    let phaseNum = 3;
    for (const [domain, tools] of byDomain) {
      // Separate destructive and non-destructive
      const nonDestructive = tools.filter((t) => !t.is_destructive).map((t) => t.display_name);
      const destructive = tools.filter((t) => t.is_destructive).map((t) => t.display_name);

      if (nonDestructive.length > 0) {
        phases.push({
          phase: phaseNum++,
          name: `${domain} - Operations`,
          tier: 4,
          tools: nonDestructive,
          parallel_safe: true,
          notes: `Non-destructive ${domain} tools`,
        });
      }

      if (destructive.length > 0) {
        phases.push({
          phase: phaseNum++,
          name: `${domain} - Cleanup`,
          tier: 4,
          tools: destructive,
          parallel_safe: false,
          notes: `Destructive ${domain} tools - execute last`,
        });
      }
    }
  }

  return phases;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate markdown tier analysis report
 */
function generateTierReport(tiers: TierAnalysis[], phases: ExecutionPhase[]): string {
  const lines: string[] = [
    '# Tier Analysis: Mittwald MCP Tools',
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Total Tools**: ${tiers.reduce((sum, t) => sum + t.tool_count, 0)}`,
    '',
    '## Tier Distribution',
    '',
    '| Tier | Description | Tools | % | Domains |',
    '|------|-------------|-------|---|---------|',
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
      lines.push(
        `**Tools**: ${phase.tools.slice(0, 5).map((t) => `\`${t}\``).join(', ')}... and ${phase.tools.length - 5} more`
      );
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

// ============================================================================
// Main Function
// ============================================================================

async function generateTierAnalysis(
  inventoryPath: string,
  graphPath: string,
  outputDir: string
): Promise<void> {
  console.log('Loading inventory...');
  const inventory: ToolInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

  console.log('Analyzing tiers...');
  const tiers = analyzeTiers(inventory);

  console.log('Loading dependency graph...');
  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  console.log('Generating execution order...');
  const phases = generateExecutionOrder(tiers, graph);

  // Write outputs
  fs.mkdirSync(outputDir, { recursive: true });

  // Execution order JSON
  const orderPath = path.join(outputDir, 'execution-order.json');
  fs.writeFileSync(
    orderPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_phases: phases.length,
        phases,
      },
      null,
      2
    )
  );
  console.log(`Execution order written to: ${orderPath}`);

  // Tier analysis report
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

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const inventoryPath = args[0] || 'evals/inventory/tools.json';
  const graphPath = args[1] || 'evals/inventory/dependency-graph.json';
  const outputDir = args[2] || 'evals/inventory';

  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(graphPath)) {
    console.error(`Dependency graph not found: ${graphPath}`);
    console.error('Run WP-05 (Dependency Graph Generation) first.');
    process.exit(1);
  }

  await generateTierAnalysis(inventoryPath, graphPath, outputDir);
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-tier-analysis.ts')) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

export { generateTierAnalysis, analyzeTiers, generateExecutionOrder, generateTierReport };
