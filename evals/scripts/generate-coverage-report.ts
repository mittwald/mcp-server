#!/usr/bin/env npx tsx

/**
 * Coverage Reporter
 *
 * Aggregates eval results into comprehensive coverage reports.
 * Produces both machine-readable JSON and human-readable Markdown.
 *
 * Usage:
 *   npx tsx generate-coverage-report.ts [assessments-dir] [inventory-path] [output-dir]
 *
 * Default paths are used when arguments are not provided:
 *   - assessments-dir: evals/results/self-assessments
 *   - inventory-path: evals/inventory/tools.json
 *   - output-dir: evals/results
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Type Definitions
// ============================================================================

type ProblemType =
  | 'auth_error'
  | 'resource_not_found'
  | 'validation_error'
  | 'timeout'
  | 'api_error'
  | 'permission_denied'
  | 'quota_exceeded'
  | 'dependency_missing'
  | 'other';

interface Problem {
  type: ProblemType;
  description: string;
  recovery_attempted?: boolean;
  recovered?: boolean;
}

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: Problem[];
  resources_created: Array<{ type: string; id: string; name?: string; verified?: boolean }>;
  resources_verified: Array<{ type: string; id: string; status: string }>;
  tool_response_summary?: string;
  execution_notes?: string;
}

interface ToolEntry {
  mcp_name: string;
  display_name: string;
  domain: string;
  tier: number;
  description: string;
  dependencies: string[];
  required_resources: string[];
  success_indicators: string[];
  is_destructive: boolean;
  is_interactive: boolean;
}

interface ToolInventory {
  generated_at: string;
  tool_count: number;
  source: string;
  domains: Record<string, number>;
  tools: ToolEntry[];
}

interface DomainCoverage {
  domain: string;
  total_tools: number;
  executed: number;
  success_count: number;
  failure_count: number;
  pending_count: number;
  success_rate: number;
  coverage_rate: number;
}

interface TierCoverage {
  tier: number;
  total_tools: number;
  executed: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
}

interface ProblemSummary {
  type: string;
  count: number;
  affected_tools: string[];
  sample_descriptions: string[];
}

interface CoverageReport {
  generated_at: string;
  summary: {
    total_tools: number;
    total_executed: number;
    total_success: number;
    total_failure: number;
    overall_success_rate: number;
    overall_coverage_rate: number;
  };
  by_domain: DomainCoverage[];
  by_tier: TierCoverage[];
  problems: ProblemSummary[];
  tools_without_assessment: string[];
  execution_metadata: {
    start_time?: string;
    end_time?: string;
    total_duration_ms?: number;
  };
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * Load all self-assessments from a directory
 */
export async function loadAssessments(dir: string): Promise<Map<string, SelfAssessment>> {
  const assessments = new Map<string, SelfAssessment>();

  if (!fs.existsSync(dir)) {
    console.warn(`Assessments directory not found: ${dir}`);
    return assessments;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle both direct assessment and wrapped extraction result formats
      const assessment: SelfAssessment | undefined = data.assessment || data;

      if (assessment && assessment.tool_executed) {
        assessments.set(assessment.tool_executed, assessment);
      }
    } catch (e) {
      console.warn(`Failed to load ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return assessments;
}

/**
 * Load tool inventory from file
 */
export function loadInventory(inventoryPath: string): ToolInventory {
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`Inventory file not found: ${inventoryPath}`);
  }

  return JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
}

// ============================================================================
// Coverage Calculation Functions
// ============================================================================

/**
 * Calculate coverage statistics by domain
 */
export function calculateDomainCoverage(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): DomainCoverage[] {
  const domainStats = new Map<string, DomainCoverage>();

  // Initialize all domains from inventory
  for (const tool of inventory.tools) {
    if (!domainStats.has(tool.domain)) {
      domainStats.set(tool.domain, {
        domain: tool.domain,
        total_tools: 0,
        executed: 0,
        success_count: 0,
        failure_count: 0,
        pending_count: 0,
        success_rate: 0,
        coverage_rate: 0,
      });
    }
    domainStats.get(tool.domain)!.total_tools++;
  }

  // Count results from assessments
  for (const tool of inventory.tools) {
    const stats = domainStats.get(tool.domain)!;
    const assessment = assessments.get(tool.mcp_name);

    if (assessment) {
      stats.executed++;
      if (assessment.success) {
        stats.success_count++;
      } else {
        stats.failure_count++;
      }
    } else {
      stats.pending_count++;
    }
  }

  // Calculate rates
  for (const stats of domainStats.values()) {
    stats.coverage_rate = stats.total_tools > 0 ? (stats.executed / stats.total_tools) * 100 : 0;
    stats.success_rate = stats.executed > 0 ? (stats.success_count / stats.executed) * 100 : 0;
  }

  return Array.from(domainStats.values()).sort((a, b) => a.domain.localeCompare(b.domain));
}

/**
 * Calculate coverage statistics by tier
 */
export function calculateTierCoverage(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): TierCoverage[] {
  const tierStats = new Map<number, TierCoverage>();

  // Initialize tiers 0-4
  for (let tier = 0; tier <= 4; tier++) {
    tierStats.set(tier, {
      tier,
      total_tools: 0,
      executed: 0,
      success_count: 0,
      failure_count: 0,
      success_rate: 0,
    });
  }

  // Count by tier
  for (const tool of inventory.tools) {
    const stats = tierStats.get(tool.tier)!;
    stats.total_tools++;

    const assessment = assessments.get(tool.mcp_name);
    if (assessment) {
      stats.executed++;
      if (assessment.success) {
        stats.success_count++;
      } else {
        stats.failure_count++;
      }
    }
  }

  // Calculate rates
  for (const stats of tierStats.values()) {
    stats.success_rate = stats.executed > 0 ? (stats.success_count / stats.executed) * 100 : 0;
  }

  return Array.from(tierStats.values()).sort((a, b) => a.tier - b.tier);
}

/**
 * Aggregate problem patterns from all assessments
 */
export function aggregateProblems(assessments: Map<string, SelfAssessment>): ProblemSummary[] {
  const problemMap = new Map<string, ProblemSummary>();

  for (const [toolName, assessment] of assessments) {
    for (const problem of assessment.problems_encountered || []) {
      if (!problemMap.has(problem.type)) {
        problemMap.set(problem.type, {
          type: problem.type,
          count: 0,
          affected_tools: [],
          sample_descriptions: [],
        });
      }

      const summary = problemMap.get(problem.type)!;
      summary.count++;
      summary.affected_tools.push(toolName);

      // Keep up to 3 sample descriptions
      if (summary.sample_descriptions.length < 3 && problem.description) {
        summary.sample_descriptions.push(problem.description);
      }
    }
  }

  // Sort by count descending
  return Array.from(problemMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Find tools without assessments
 */
export function findToolsWithoutAssessment(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): string[] {
  const missing: string[] = [];

  for (const tool of inventory.tools) {
    if (!assessments.has(tool.mcp_name)) {
      missing.push(tool.display_name);
    }
  }

  return missing.sort();
}

// ============================================================================
// Report Generation Functions
// ============================================================================

/**
 * Generate the complete coverage report object
 */
export function generateReport(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): CoverageReport {
  const byDomain = calculateDomainCoverage(inventory, assessments);
  const byTier = calculateTierCoverage(inventory, assessments);
  const problems = aggregateProblems(assessments);
  const toolsWithoutAssessment = findToolsWithoutAssessment(inventory, assessments);

  // Calculate overall statistics
  const totalExecuted = assessments.size;
  const totalSuccess = Array.from(assessments.values()).filter((a) => a.success).length;
  const totalFailure = totalExecuted - totalSuccess;

  const report: CoverageReport = {
    generated_at: new Date().toISOString(),
    summary: {
      total_tools: inventory.tool_count,
      total_executed: totalExecuted,
      total_success: totalSuccess,
      total_failure: totalFailure,
      overall_success_rate: totalExecuted > 0 ? (totalSuccess / totalExecuted) * 100 : 0,
      overall_coverage_rate:
        inventory.tool_count > 0 ? (totalExecuted / inventory.tool_count) * 100 : 0,
    },
    by_domain: byDomain,
    by_tier: byTier,
    problems,
    tools_without_assessment: toolsWithoutAssessment,
    execution_metadata: {},
  };

  return report;
}

/**
 * Generate Markdown report from coverage data
 */
export function generateMarkdownReport(report: CoverageReport): string {
  const lines: string[] = [
    '# Baseline Eval Report: Mittwald MCP Tools',
    '',
    `**Generated**: ${report.generated_at}`,
    '',
    '## Executive Summary',
    '',
    `- **Total Tools**: ${report.summary.total_tools}`,
    `- **Executed**: ${report.summary.total_executed} (${report.summary.overall_coverage_rate.toFixed(1)}%)`,
    `- **Successful**: ${report.summary.total_success} (${report.summary.overall_success_rate.toFixed(1)}%)`,
    `- **Failed**: ${report.summary.total_failure}`,
    '',
    '## Coverage by Domain',
    '',
    '| Domain | Tools | Executed | Success | Failure | Success Rate | Coverage |',
    '|--------|-------|----------|---------|---------|--------------|----------|',
  ];

  for (const domain of report.by_domain) {
    lines.push(
      `| ${domain.domain} | ${domain.total_tools} | ${domain.executed} | ${domain.success_count} | ${domain.failure_count} | ${domain.success_rate.toFixed(1)}% | ${domain.coverage_rate.toFixed(1)}% |`
    );
  }

  const tierDescriptions = [
    'No prerequisites',
    'Organization-level',
    'Server-level',
    'Project creation',
    'Requires project',
  ];

  lines.push(
    '',
    '## Coverage by Tier',
    '',
    '| Tier | Description | Tools | Executed | Success | Failure | Success Rate |',
    '|------|-------------|-------|----------|---------|---------|--------------|'
  );

  for (const tier of report.by_tier) {
    lines.push(
      `| ${tier.tier} | ${tierDescriptions[tier.tier] || 'Unknown'} | ${tier.total_tools} | ${tier.executed} | ${tier.success_count} | ${tier.failure_count} | ${tier.success_rate.toFixed(1)}% |`
    );
  }

  if (report.problems.length > 0) {
    lines.push(
      '',
      '## Problem Patterns',
      '',
      '| Problem Type | Count | Affected Tools |',
      '|--------------|-------|----------------|'
    );

    for (const problem of report.problems) {
      const toolList =
        problem.affected_tools.slice(0, 3).join(', ') +
        (problem.affected_tools.length > 3 ? '...' : '');
      lines.push(`| ${problem.type} | ${problem.count} | ${toolList} |`);
    }

    lines.push('', '### Sample Problem Descriptions', '');

    for (const problem of report.problems.slice(0, 5)) {
      lines.push(`**${problem.type}**:`);
      for (const desc of problem.sample_descriptions) {
        lines.push(`- ${desc}`);
      }
      lines.push('');
    }
  }

  if (report.tools_without_assessment.length > 0) {
    lines.push(
      '',
      '## Tools Without Assessment',
      '',
      `${report.tools_without_assessment.length} tools have not been evaluated yet:`,
      ''
    );

    // Group by first segment of display name
    const grouped = new Map<string, string[]>();
    for (const tool of report.tools_without_assessment) {
      const prefix = tool.split('/')[0];
      if (!grouped.has(prefix)) {
        grouped.set(prefix, []);
      }
      grouped.get(prefix)!.push(tool);
    }

    for (const [prefix, tools] of Array.from(grouped.entries()).sort()) {
      lines.push(`**${prefix}/** (${tools.length}):`);
      for (const tool of tools.slice(0, 10)) {
        lines.push(`- \`${tool}\``);
      }
      if (tools.length > 10) {
        lines.push(`- ... and ${tools.length - 10} more`);
      }
      lines.push('');
    }
  }

  lines.push(
    '',
    '## Recommendations',
    '',
    '1. Investigate tools with `auth_error` problems - may need scope configuration',
    '2. Review `resource_not_found` errors - may indicate dependency issues',
    '3. Consider retry strategy for `timeout` errors',
    '4. Tools with `permission_denied` may need role elevation',
    '',
    '---',
    '',
    '*This baseline report was generated by the Langfuse MCP Eval Suite.*'
  );

  return lines.join('\n');
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate coverage reports from assessments directory
 */
export async function generateCoverageReport(
  assessmentsDir: string,
  inventoryPath: string,
  outputDir: string
): Promise<CoverageReport> {
  console.log('Loading data...');
  const assessments = await loadAssessments(assessmentsDir);
  const inventory = loadInventory(inventoryPath);

  console.log(`Found ${assessments.size} assessments for ${inventory.tool_count} tools`);

  // Generate report
  const report = generateReport(inventory, assessments);

  // Write JSON report
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'coverage-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`JSON report written to: ${jsonPath}`);

  // Write Markdown report
  const mdPath = path.join(outputDir, 'baseline-report.md');
  fs.writeFileSync(mdPath, generateMarkdownReport(report));
  console.log(`Markdown report written to: ${mdPath}`);

  return report;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Use default paths when arguments are not provided (per WP03 spec)
  const assessmentsDir = args[0] || 'evals/results/self-assessments';
  const inventoryPath = args[1] || 'evals/inventory/tools.json';
  const outputDir = args[2] || 'evals/results';

  // Create assessments directory if it doesn't exist (allows running with zero assessments)
  if (!fs.existsSync(assessmentsDir)) {
    console.log(`Creating assessments directory: ${assessmentsDir}`);
    fs.mkdirSync(assessmentsDir, { recursive: true });
  }

  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    console.error('Run WP-04 (Tool Inventory Generation) first.');
    process.exit(1);
  }

  try {
    const report = await generateCoverageReport(assessmentsDir, inventoryPath, outputDir);

    console.log('\n--- Coverage Summary ---');
    console.log(`Total tools: ${report.summary.total_tools}`);
    console.log(
      `Executed: ${report.summary.total_executed} (${report.summary.overall_coverage_rate.toFixed(1)}%)`
    );
    console.log(
      `Success: ${report.summary.total_success} (${report.summary.overall_success_rate.toFixed(1)}%)`
    );
    console.log(`Failure: ${report.summary.total_failure}`);
    console.log(`\nDomains: ${report.by_domain.length}`);
    console.log(`Problem types: ${report.problems.length}`);
    console.log(`Tools without assessment: ${report.tools_without_assessment.length}`);
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

// Run if executed directly (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-coverage-report.ts')) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
