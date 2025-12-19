#!/usr/bin/env npx tsx

/**
 * Best-of Aggregator
 *
 * Generates a "best-of" report across multiple runs by marking a tool as successful
 * if it succeeded in ANY of the specified runs. This filters out transient fixture
 * issues and shows the true capability of each tool.
 *
 * Usage:
 *   npx tsx aggregate-best-of.ts <run-id-1> <run-id-2> <run-id-3> [--output-dir dir]
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadRunResults } from './run-manager.js';
import { loadInventory, generateMarkdownReport, type CoverageReport } from './generate-coverage-report.js';

const EVALS_ROOT = path.join(process.cwd(), 'evals');
const RUNS_DIR = path.join(EVALS_ROOT, 'results', 'runs');
const INVENTORY_PATH = path.join(EVALS_ROOT, 'inventory', 'tools-current.json');

interface AggregatedResult {
  tool: string;
  domain: string;
  ever_succeeded: boolean;
  success_count: number;
  total_runs: number;
  success_in_runs: string[];
  last_success_run?: string;
  last_failure_run?: string;
  best_confidence?: string;
  persistent_problems: string[];
}

async function aggregateBestOf(runIds: string[]): Promise<Map<string, AggregatedResult>> {
  const aggregated = new Map<string, AggregatedResult>();

  console.log(`\nAggregating results from ${runIds.length} runs...`);

  // Load results from all runs
  const allResults: Array<{ runId: string; results: Map<string, any> }> = [];

  for (const runId of runIds) {
    console.log(`  Loading ${runId}...`);
    const results = await loadRunResults(runId);
    allResults.push({ runId, results });
  }

  // Build tool list from inventory
  const inventory = loadInventory(INVENTORY_PATH);

  for (const tool of inventory.tools) {
    const toolName = tool.mcpName;

    const agg: AggregatedResult = {
      tool: toolName,
      domain: tool.domain,
      ever_succeeded: false,
      success_count: 0,
      total_runs: 0,
      success_in_runs: [],
      persistent_problems: [],
    };

    // Check each run
    for (const { runId, results } of allResults) {
      const result = results.get(toolName);

      if (result) {
        agg.total_runs++;

        if (result.success) {
          agg.ever_succeeded = true;
          agg.success_count++;
          agg.success_in_runs.push(runId);
          agg.last_success_run = runId;

          // Track best confidence
          if (!agg.best_confidence || result.confidence === 'high') {
            agg.best_confidence = result.confidence;
          }
        } else {
          agg.last_failure_run = runId;

          // Track persistent problems
          if (result.problems_encountered) {
            for (const problem of result.problems_encountered) {
              if (!agg.persistent_problems.includes(problem.type)) {
                agg.persistent_problems.push(problem.type);
              }
            }
          }
        }
      }
    }

    aggregated.set(toolName, agg);
  }

  return aggregated;
}

function generateBestOfReport(
  aggregated: Map<string, AggregatedResult>,
  runIds: string[]
): string {
  const lines: string[] = [];

  // Count overall stats
  const totalTools = aggregated.size;
  const everSucceeded = Array.from(aggregated.values()).filter(a => a.ever_succeeded).length;
  const neverSucceeded = totalTools - everSucceeded;

  // Domain breakdown
  const domainStats = new Map<string, { total: number; ever_succeeded: number }>();

  for (const agg of aggregated.values()) {
    if (!domainStats.has(agg.domain)) {
      domainStats.set(agg.domain, { total: 0, ever_succeeded: 0 });
    }

    const stats = domainStats.get(agg.domain)!;
    stats.total++;
    if (agg.ever_succeeded) stats.ever_succeeded++;
  }

  // Generate report
  lines.push('# Best-of Aggregate Report: Mittwald MCP Tools');
  lines.push('');
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Source Runs**: ${runIds.join(', ')}`);
  lines.push('');
  lines.push('## Methodology');
  lines.push('');
  lines.push('This report aggregates results from multiple eval runs and marks a tool as **successful**');
  lines.push('if it succeeded in **ANY** of the source runs. This filters out transient fixture issues');
  lines.push('and shows the true capability of each MCP tool.');
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- **Total Tools**: ${totalTools}`);
  lines.push(`- **Ever Succeeded**: ${everSucceeded} (${((everSucceeded / totalTools) * 100).toFixed(1)}%)`);
  lines.push(`- **Never Succeeded**: ${neverSucceeded} (${((neverSucceeded / totalTools) * 100).toFixed(1)}%)`);
  lines.push(`- **Source Runs**: ${runIds.length}`);
  lines.push('');

  lines.push('## Best-of Success by Domain');
  lines.push('');
  lines.push('| Domain | Total | Ever Succeeded | Never Succeeded | Success Rate |');
  lines.push('|--------|-------|----------------|-----------------|--------------|');

  const sortedDomains = Array.from(domainStats.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [domain, stats] of sortedDomains) {
    const rate = (stats.ever_succeeded / stats.total) * 100;
    lines.push(
      `| ${domain} | ${stats.total} | ${stats.ever_succeeded} | ${stats.total - stats.ever_succeeded} | ${rate.toFixed(1)}% |`
    );
  }

  lines.push('');
  lines.push('## Consistency Analysis');
  lines.push('');
  lines.push('Tools grouped by consistency across runs:');
  lines.push('');

  // Consistency buckets
  const alwaysSucceed = Array.from(aggregated.values()).filter(
    a => a.success_count === a.total_runs && a.total_runs > 0
  );
  const sometimesSucceed = Array.from(aggregated.values()).filter(
    a => a.ever_succeeded && a.success_count < a.total_runs
  );
  const neverSucceed = Array.from(aggregated.values()).filter(
    a => !a.ever_succeeded && a.total_runs > 0
  );
  const notTested = Array.from(aggregated.values()).filter(a => a.total_runs === 0);

  lines.push(`### Always Successful (${alwaysSucceed.length} tools)`);
  lines.push('');
  lines.push('Tools that succeeded in **all** runs where they were executed:');
  lines.push('');

  // Group by domain
  const alwaysByDomain = new Map<string, string[]>();
  for (const agg of alwaysSucceed) {
    if (!alwaysByDomain.has(agg.domain)) {
      alwaysByDomain.set(agg.domain, []);
    }
    alwaysByDomain.get(agg.domain)!.push(agg.tool.replace('mcp__mittwald__mittwald_', ''));
  }

  for (const [domain, tools] of Array.from(alwaysByDomain.entries()).sort()) {
    lines.push(`**${domain}** (${tools.length}):`);
    for (const tool of tools.sort()) {
      lines.push(`- \`${tool}\``);
    }
    lines.push('');
  }

  lines.push(`### Intermittent (${sometimesSucceed.length} tools)`);
  lines.push('');
  lines.push('Tools that succeeded in **some** runs but not all (fixture-dependent):');
  lines.push('');

  for (const agg of sometimesSucceed.slice(0, 20)) {
    const toolShort = agg.tool.replace('mcp__mittwald__mittwald_', '');
    lines.push(
      `- \`${toolShort}\` (${agg.domain}): ${agg.success_count}/${agg.total_runs} runs`
    );
  }

  if (sometimesSucceed.length > 20) {
    lines.push(`- ... and ${sometimesSucceed.length - 20} more`);
  }

  lines.push('');
  lines.push(`### Never Successful (${neverSucceed.length} tools)`);
  lines.push('');
  lines.push('Tools that **failed in all runs** where executed (true failures):');
  lines.push('');

  const neverByDomain = new Map<string, Array<{ tool: string; problems: string[] }>>();
  for (const agg of neverSucceed) {
    if (!neverByDomain.has(agg.domain)) {
      neverByDomain.set(agg.domain, []);
    }
    neverByDomain.get(agg.domain)!.push({
      tool: agg.tool.replace('mcp__mittwald__mittwald_', ''),
      problems: agg.persistent_problems,
    });
  }

  for (const [domain, tools] of Array.from(neverByDomain.entries()).sort()) {
    lines.push(`**${domain}** (${tools.length}):`);
    for (const { tool, problems } of tools) {
      const problemStr = problems.length > 0 ? ` (${problems.join(', ')})` : '';
      lines.push(`- \`${tool}\`${problemStr}`);
    }
    lines.push('');
  }

  if (notTested.length > 0) {
    lines.push(`### Not Tested (${notTested.length} tools)`);
    lines.push('');
    lines.push('Tools that were not executed in any of the source runs:');
    lines.push('');
    for (const agg of notTested.slice(0, 10)) {
      lines.push(`- \`${agg.tool.replace('mcp__mittwald__mittwald_', '')}\` (${agg.domain})`);
    }
    if (notTested.length > 10) {
      lines.push(`- ... and ${notTested.length - 10} more`);
    }
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');
  lines.push('1. **Focus on Never Successful tools** - These have consistent failures across all runs');
  lines.push('2. **Intermittent tools are likely OK** - Failures are due to fixture availability');
  lines.push(`3. **Overall capability**: ${everSucceeded}/${totalTools} tools (${((everSucceeded / totalTools) * 100).toFixed(1)}%) are proven to work`);
  lines.push('4. **Fixture management** - Consider creating persistent test fixtures for intermittent tools');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Best-of Aggregate Report - Shows maximum demonstrated capability across runs*');

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);

  // Filter out --output-dir and its value
  const outputDirIdx = args.indexOf('--output-dir');
  let outputDir = path.join(RUNS_DIR);

  if (outputDirIdx >= 0) {
    outputDir = args[outputDirIdx + 1];
    args.splice(outputDirIdx, 2);
  }

  const runIds = args;

  if (runIds.length < 2) {
    console.error('Usage: aggregate-best-of.ts <run-id-1> <run-id-2> [run-id-3...] [--output-dir dir]');
    console.error('\nExample:');
    console.error('  npx tsx aggregate-best-of.ts run-20251219-104746 run-20251219-113203 run-20251219-143517');
    process.exit(1);
  }

  console.log('Best-of Aggregation Report Generator');
  console.log('=====================================');

  const aggregated = await aggregateBestOf(runIds);

  // Generate markdown report
  const markdown = generateBestOfReport(aggregated, runIds);

  // Save report
  const reportPath = path.join(outputDir, `best-of-aggregate-${runIds.join('-')}.md`);
  fs.writeFileSync(reportPath, markdown);

  console.log(`\n✅ Best-of report generated: ${reportPath}`);

  // Generate summary JSON
  const summary = {
    generated_at: new Date().toISOString(),
    source_runs: runIds,
    total_tools: aggregated.size,
    ever_succeeded: Array.from(aggregated.values()).filter(a => a.ever_succeeded).length,
    never_succeeded: Array.from(aggregated.values()).filter(a => !a.ever_succeeded && a.total_runs > 0).length,
    not_tested: Array.from(aggregated.values()).filter(a => a.total_runs === 0).length,
    tools: Array.from(aggregated.values()).map(a => ({
      tool: a.tool,
      domain: a.domain,
      ever_succeeded: a.ever_succeeded,
      success_rate: a.total_runs > 0 ? (a.success_count / a.total_runs) * 100 : 0,
      runs_executed: a.total_runs,
    })),
  };

  const jsonPath = path.join(outputDir, `best-of-aggregate-${runIds.join('-')}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  console.log(`✅ Summary JSON saved: ${jsonPath}`);

  // Print quick stats
  const everSucceeded = Array.from(aggregated.values()).filter(a => a.ever_succeeded).length;
  const neverSucceeded = Array.from(aggregated.values()).filter(a => !a.ever_succeeded && a.total_runs > 0).length;

  console.log('\n=== Summary ===');
  console.log(`Total tools: ${aggregated.size}`);
  console.log(`Ever succeeded: ${everSucceeded} (${((everSucceeded / aggregated.size) * 100).toFixed(1)}%)`);
  console.log(`Never succeeded: ${neverSucceeded} (${((neverSucceeded / aggregated.size) * 100).toFixed(1)}%)`);
  console.log(`\nTrue capability: ${everSucceeded}/${aggregated.size} tools work`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
