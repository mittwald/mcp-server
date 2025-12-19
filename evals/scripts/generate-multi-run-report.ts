#!/usr/bin/env npx tsx

/**
 * Multi-Run Coverage Reporter
 *
 * Extension of generate-coverage-report.ts for multi-run architecture.
 * Generates coverage reports for a specific run or the active run.
 *
 * Usage:
 *   npx tsx generate-multi-run-report.ts [run-id]
 *   npx tsx generate-multi-run-report.ts             # Uses active run
 *   npx tsx generate-multi-run-report.ts run-20251219-001
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateCoverageReport, loadAssessments, loadInventory } from './generate-coverage-report.js';
import { getActiveRun, updateRunStatus } from './run-manager.js';

const EVALS_ROOT = path.join(process.cwd(), 'evals');
const RUNS_DIR = path.join(EVALS_ROOT, 'results', 'runs');
const INVENTORY_PATH = path.join(EVALS_ROOT, 'inventory', 'tools-current.json');

async function main() {
  const args = process.argv.slice(2);
  let runId = args[0];

  // If no run ID provided, use active run
  if (!runId) {
    const activeRun = getActiveRun();
    if (!activeRun) {
      console.error('No run ID provided and no active run set.');
      console.error('Usage: generate-multi-run-report.ts [run-id]');
      console.error('   or: npx tsx run-manager.ts set-active <run-id>');
      process.exit(1);
    }
    runId = activeRun.run_id;
    console.log(`Using active run: ${runId}`);
  }

  const runDir = path.join(RUNS_DIR, runId);
  const metadataPath = path.join(runDir, 'metadata.json');

  if (!fs.existsSync(runDir)) {
    console.error(`Run directory not found: ${runDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(metadataPath)) {
    console.error(`Run metadata not found: ${metadataPath}`);
    process.exit(1);
  }

  console.log(`\nGenerating coverage report for run: ${runId}`);
  console.log(`Run directory: ${runDir}`);

  // Generate report using the run directory
  const report = await generateCoverageReport(
    runDir,          // assessmentsDir (contains domain subdirs)
    INVENTORY_PATH,  // inventoryPath
    runDir           // outputDir (save report in run directory)
  );

  // Update run metadata with summary
  updateRunStatus(runId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    total_evals_executed: report.summary.total_executed,
    summary: {
      total_success: report.summary.total_success,
      total_failure: report.summary.total_failure,
      success_rate: report.summary.overall_success_rate,
    },
    domains_executed: report.by_domain.filter(d => d.executed > 0).map(d => d.domain),
  });

  console.log(`\n✅ Report generated for run: ${runId}`);
  console.log(`   Coverage report: ${path.join(runDir, 'coverage-report.json')}`);
  console.log(`   Baseline report: ${path.join(runDir, 'baseline-report.md')}`);
  console.log(`   Success rate: ${report.summary.overall_success_rate.toFixed(1)}%`);
  console.log(`   Executed: ${report.summary.total_executed}/${report.summary.total_tools}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
