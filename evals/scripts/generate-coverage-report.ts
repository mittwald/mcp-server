import fs from 'fs';
import path from 'path';
import { loadValidationDatabase, getValidationSummary } from './coverage-tracker.js';
import { loadFailurePatterns } from './cluster-failures.js';
import { loadToolInventory, getAllDomains, getToolsByDomain } from './tool-inventory.js';

/**
 * Coverage report generator.
 * Creates JSON report with validation status, domain breakdowns, failure patterns.
 */

export interface CoverageReport {
  // Summary statistics
  total_tools: number;
  validated_tools: number;
  failed_tools: number;
  uncovered_tools: number;
  validation_rate: number;

  // Tool breakdowns
  tools_by_status: {
    success: string[];
    failed: string[];
    not_tested: string[];
  };

  // Domain coverage
  coverage_by_domain: Record<string, {
    total: number;
    validated: number;
    failed: number;
    not_tested: number;
    validation_rate: number;
  }>;

  // Scenario execution summary
  scenarios_executed: {
    total: number;
    successful: number;
    failed: number;
    scenarios: Array<{
      id: string;
      status: 'success' | 'failure';
      tools_validated: number;
    }>;
  };

  // Failure analysis
  failure_patterns: number;
  most_common_failures: Array<{
    pattern_id: string;
    root_cause: string;
    occurrence_count: number;
  }>;

  // Metadata
  generated_at: string;
  run_id: string;
}

/**
 * Generate coverage report from validation database.
 */
export function generateCoverageReport(): CoverageReport {
  const database = loadValidationDatabase();
  const summary = getValidationSummary();
  const failurePatterns = loadFailurePatterns();

  // Tools by status
  const success = database.tools.filter(t => t.status === 'success');
  const failed = database.tools.filter(t => t.status === 'failed');
  const notTested = database.tools.filter(t => t.status === 'not_tested');

  // Domain coverage
  const domains = getAllDomains();
  const coverageByDomain: CoverageReport['coverage_by_domain'] = {};

  for (const domain of domains) {
    const domainTools = getToolsByDomain(domain);
    const validated = domainTools.filter(t => {
      const record = database.tools.find(r => r.tool_name === t.tool_name);
      return record?.status === 'success';
    });
    const domainFailed = domainTools.filter(t => {
      const record = database.tools.find(r => r.tool_name === t.tool_name);
      return record?.status === 'failed';
    });
    const domainNotTested = domainTools.filter(t => {
      const record = database.tools.find(r => r.tool_name === t.tool_name);
      return record?.status === 'not_tested';
    });

    coverageByDomain[domain] = {
      total: domainTools.length,
      validated: validated.length,
      failed: domainFailed.length,
      not_tested: domainNotTested.length,
      validation_rate: domainTools.length > 0 ? (validated.length / domainTools.length) * 100 : 0,
    };
  }

  // Scenario summary (extract from validation records)
  const scenarioIds = new Set<string>();
  database.tools.forEach(t => {
    t.tested_in_scenarios.forEach(s => scenarioIds.add(s));
  });

  const scenarios = Array.from(scenarioIds).map(id => {
    const toolsInScenario = database.tools.filter(t => t.tested_in_scenarios.includes(id));
    const validatedInScenario = toolsInScenario.filter(t => t.status === 'success');
    const failedInScenario = toolsInScenario.filter(t => t.status === 'failed');

    return {
      id,
      status: (failedInScenario.length > 0 ? 'failure' : 'success') as 'success' | 'failure',
      tools_validated: validatedInScenario.length,
    };
  });

  // Failure pattern summary
  const topPatterns = failurePatterns.patterns
    .slice(0, 5)
    .map(p => ({
      pattern_id: p.pattern_id,
      root_cause: p.root_cause,
      occurrence_count: p.occurrence_count,
    }));

  const report: CoverageReport = {
    total_tools: summary.total,
    validated_tools: summary.success,
    failed_tools: summary.failed,
    uncovered_tools: summary.not_tested,
    validation_rate: summary.validation_rate,

    tools_by_status: {
      success: success.map(t => t.tool_name),
      failed: failed.map(t => t.tool_name),
      not_tested: notTested.map(t => t.tool_name),
    },

    coverage_by_domain: coverageByDomain,

    scenarios_executed: {
      total: scenarios.length,
      successful: scenarios.filter(s => s.status === 'success').length,
      failed: scenarios.filter(s => s.status === 'failure').length,
      scenarios,
    },

    failure_patterns: failurePatterns.patterns.length,
    most_common_failures: topPatterns,

    generated_at: new Date().toISOString(),
    run_id: `run-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`,
  };

  return report;
}

/**
 * Save coverage report to JSON file.
 */
export function saveCoverageReportJSON(report: CoverageReport): void {
  const outputPath = path.join(process.cwd(), 'evals', 'reports', 'coverage-full.json');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Coverage report (JSON) saved: ${outputPath}`);
}

/**
 * CLI entrypoint for JSON report generation.
 * Usage: tsx evals/scripts/generate-coverage-report.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateCoverageReport();
  saveCoverageReportJSON(report);

  console.log('\nCoverage Summary:');
  console.log(`  Total tools: ${report.total_tools}`);
  console.log(`  Validated: ${report.validated_tools} (${report.validation_rate.toFixed(1)}%)`);
  console.log(`  Failed: ${report.failed_tools}`);
  console.log(`  Uncovered: ${report.uncovered_tools}`);
  console.log(`  Scenarios executed: ${report.scenarios_executed.total}`);
  console.log(`  Failure patterns: ${report.failure_patterns}`);
}
