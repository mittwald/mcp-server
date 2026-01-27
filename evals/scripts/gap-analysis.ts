import fs from 'fs';
import path from 'path';
import { loadValidationDatabase } from './coverage-tracker.js';
import { loadToolInventory, getAllDomains, getToolsByDomain } from './tool-inventory.js';
import type { ToolInfo } from './tool-inventory.js';

/**
 * Gap analysis for uncovered tools.
 * Identifies tools not validated by scenarios and recommends custom scenarios.
 */

export interface GapAnalysis {
  uncovered_tools: Array<{
    tool_name: string;
    tool_domain: string;
    tier: number;
    recommended_scenario_type: string;
  }>;
  uncovered_by_domain: Record<string, number>;
  uncovered_by_tier: Record<number, number>;
  priority_tools: string[];  // Tier 0-2 uncovered tools (high priority)
  recommendations: string[];
}

/**
 * Analyze coverage gaps.
 */
export function analyzeGaps(): GapAnalysis {
  const database = loadValidationDatabase();
  const inventory = loadToolInventory();

  // Get uncovered tools
  const uncoveredRecords = database.tools.filter(t => t.status === 'not_tested');
  const uncoveredTools = uncoveredRecords.map(record => {
    const toolInfo = inventory.find(t => t.tool_name === record.tool_name);
    return {
      tool_name: record.tool_name,
      tool_domain: record.tool_domain,
      tier: toolInfo?.tier || 4,
      recommended_scenario_type: recommendScenarioType(record.tool_name, record.tool_domain, toolInfo?.tier || 4),
    };
  });

  // Group by domain
  const uncoveredByDomain: Record<string, number> = {};
  const domains = getAllDomains();

  for (const domain of domains) {
    uncoveredByDomain[domain] = uncoveredTools.filter(t => t.tool_domain === domain).length;
  }

  // Group by tier
  const uncoveredByTier: Record<number, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  for (const tool of uncoveredTools) {
    uncoveredByTier[tool.tier]++;
  }

  // Identify priority tools (Tier 0-2)
  const priorityTools = uncoveredTools
    .filter(t => t.tier <= 2)
    .map(t => t.tool_name);

  // Generate recommendations
  const recommendations = generateRecommendations(uncoveredTools, uncoveredByDomain, uncoveredByTier);

  return {
    uncovered_tools: uncoveredTools,
    uncovered_by_domain: uncoveredByDomain,
    uncovered_by_tier: uncoveredByTier,
    priority_tools: priorityTools,
    recommendations,
  };
}

/**
 * Recommend scenario type for uncovered tool.
 */
function recommendScenarioType(toolName: string, domain: string, tier: number): string {
  // Tier 0-2: Simple, standalone scenarios
  if (tier <= 2) {
    return 'simple-standalone';
  }

  // Domain-specific recommendations
  if (domain === 'container') {
    return 'container-deployment-workflow';
  } else if (domain === 'automation') {
    return 'automation-trigger-workflow';
  } else if (domain === 'database') {
    return 'database-migration-workflow';
  } else if (domain === 'domain' || domain === 'mail') {
    return 'domain-email-setup-workflow';
  } else if (domain === 'backup') {
    return 'backup-restore-workflow';
  } else {
    return 'generic-crud-workflow';
  }
}

/**
 * Generate recommendations for custom scenarios.
 */
function generateRecommendations(
  uncoveredTools: GapAnalysis['uncovered_tools'],
  uncoveredByDomain: Record<string, number>,
  uncoveredByTier: Record<number, number>
): string[] {
  const recommendations: string[] = [];

  // Priority recommendation
  if (uncoveredByTier[0] + uncoveredByTier[1] + uncoveredByTier[2] > 0) {
    recommendations.push(
      `High priority: ${uncoveredByTier[0] + uncoveredByTier[1] + uncoveredByTier[2]} Tier 0-2 tools uncovered. Create simple standalone scenarios first.`
    );
  }

  // Domain-specific recommendations
  const topUncoveredDomains = Object.entries(uncoveredByDomain)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topUncoveredDomains.length > 0) {
    recommendations.push(
      `Top uncovered domains: ${topUncoveredDomains.map(([d, c]) => `${d} (${c})`).join(', ')}. Consider domain-grouped custom scenarios.`
    );
  }

  // Tier 4 recommendation
  if (uncoveredByTier[4] > 0) {
    recommendations.push(
      `${uncoveredByTier[4]} Tier 4 tools uncovered. These require complex multi-step workflows. Consider deferring until Tier 0-3 are complete.`
    );
  }

  // Overall recommendation
  if (uncoveredTools.length === 0) {
    recommendations.push('All tools validated! No custom scenarios needed.');
  } else {
    recommendations.push(
      `Estimated ${Math.ceil(uncoveredTools.length / 5)} custom scenarios needed (average 5 tools per scenario).`
    );
  }

  return recommendations;
}

/**
 * Save gap analysis to JSON.
 */
export function saveGapAnalysis(analysis: GapAnalysis): void {
  const outputPath = path.join(process.cwd(), 'evals', 'coverage', 'gap-analysis.json');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`Gap analysis saved: ${outputPath}`);
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/gap-analysis.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const analysis = analyzeGaps();
  saveGapAnalysis(analysis);

  console.log('\nGap Analysis Summary:');
  console.log(`  Uncovered tools: ${analysis.uncovered_tools.length}`);
  console.log(`  Priority tools (Tier 0-2): ${analysis.priority_tools.length}`);
  console.log('\nRecommendations:');
  analysis.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
}
