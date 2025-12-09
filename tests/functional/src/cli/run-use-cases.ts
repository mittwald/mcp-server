#!/usr/bin/env node
/**
 * CLI for running use case tests
 *
 * Usage:
 *   npm run use-cases                           # Run all use cases
 *   npm run use-cases -- --domain apps          # Run only apps domain
 *   npm run use-cases -- --single apps-001...   # Run single use case
 *   npm run use-cases -- --coverage-gaps        # Run use cases targeting uncovered tools
 *   npm run use-cases -- --dry-run              # List without executing
 *
 * WP12: CLI Interface
 */

import { parseArgs } from 'node:util';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { UseCase, UseCaseDomain, UseCaseExecution, CoverageReport } from '../use-cases/types.js';
import { UseCaseExecutor, type PhaseEvent } from '../use-cases/executor.js';
import { loadUseCases, loadSingleUseCase } from '../use-cases/loader.js';
import { CoverageTracker } from '../use-cases/coverage-tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LIBRARY_ROOT = path.join(__dirname, '../../use-case-library');
const DEFAULT_OUTPUT_ROOT = path.join(__dirname, '../../analysis-output');
const DEFAULT_MCP_CONFIG = path.join(__dirname, '../../config/mcp-server.json');

/**
 * Valid domains for --domain filter
 */
const VALID_DOMAINS: UseCaseDomain[] = [
  'identity',
  'organization',
  'project-foundation',
  'apps',
  'containers',
  'databases',
  'domains-mail',
  'access-users',
  'automation',
  'backups',
];

/**
 * CLI options
 */
interface CliOptions {
  domain?: string;
  coverageGaps: boolean;
  single?: string;
  dryRun: boolean;
  json: boolean;
  help: boolean;
}

/**
 * Execution result for summary
 */
interface ExecutionResult {
  useCaseId: string;
  status: 'passed' | 'failed' | 'timeout' | 'cleanup-failed';
  duration?: number;
  error?: string;
  toolsCovered: string[];
}

/**
 * Run summary
 */
interface RunSummary {
  startTime: Date;
  endTime: Date;
  total: number;
  passed: number;
  failed: number;
  timeout: number;
  cleanupFailed: number;
  results: ExecutionResult[];
  coverageBefore?: number;
  coverageAfter?: number;
  newToolsCovered?: string[];
}

/**
 * Parse command-line arguments
 */
function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      domain: { type: 'string', short: 'd' },
      'coverage-gaps': { type: 'boolean', short: 'g', default: false },
      single: { type: 'string', short: 's' },
      'dry-run': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  return {
    domain: values.domain as string | undefined,
    coverageGaps: values['coverage-gaps'] as boolean,
    single: values.single as string | undefined,
    dryRun: values['dry-run'] as boolean,
    json: values.json as boolean,
    help: values.help as boolean,
  };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Usage: run-use-cases [options]

Options:
  -d, --domain <domain>    Filter by domain (e.g., apps, databases)
  -g, --coverage-gaps      Run use cases targeting uncovered tools
  -s, --single <id>        Run single use case by ID
      --dry-run            List use cases without executing
      --json               Output results as JSON
  -h, --help               Show this help message

Examples:
  npm run use-cases                           # Run all use cases
  npm run use-cases -- --domain apps          # Run only apps domain
  npm run use-cases -- --single apps-001...   # Run single use case
  npm run use-cases -- --coverage-gaps        # Target uncovered tools
  npm run use-cases -- --dry-run              # Preview without running

Valid domains:
  ${VALID_DOMAINS.join(', ')}
`);
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Print progress update for a use case
 */
function printProgress(
  index: number,
  total: number,
  useCase: UseCase,
  phase: string,
  status?: 'passed' | 'failed' | 'timeout' | 'cleanup-failed',
  duration?: number,
  error?: string
): void {
  const prefix = `[${index}/${total}]`;

  if (phase === 'start') {
    console.log(`\n${prefix} ${useCase.id}`);
    console.log(`       \u21b3 Timeout: ${useCase.timeout}min`);
  } else if (phase === 'execute') {
    console.log(`       \u21b3 Executing...`);
  } else if (phase === 'verify') {
    console.log(`       \u21b3 Verifying...`);
  } else if (phase === 'cleanup') {
    console.log(`       \u21b3 Cleaning up...`);
  } else if (phase === 'complete') {
    if (status === 'passed') {
      console.log(`       \u2713 Passed${duration ? ` (${formatDuration(duration)})` : ''}`);
    } else if (status === 'timeout') {
      console.log(`       \u2717 Timeout after ${useCase.timeout} minutes`);
    } else if (status === 'cleanup-failed') {
      console.log(`       \u26a0 Cleanup failed${error ? `: ${error}` : ''}`);
    } else if (status === 'failed') {
      console.log(`       \u2717 Failed${error ? `: ${error}` : ''}`);
    }
  }
}

/**
 * Print final summary
 */
function printSummary(summary: RunSummary): void {
  const totalDuration = summary.endTime.getTime() - summary.startTime.getTime();

  console.log(`
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
                    EXECUTION SUMMARY
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Results:
  \u2713 Passed:  ${summary.passed}
  \u2717 Failed:  ${summary.failed}
  \u23f1 Timeout: ${summary.timeout}
  \u26a0 Cleanup: ${summary.cleanupFailed}
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  Total:     ${summary.total}

Duration: ${formatDuration(totalDuration)}
`);

  // Coverage impact
  if (summary.coverageBefore !== undefined && summary.coverageAfter !== undefined) {
    const delta = summary.coverageAfter - summary.coverageBefore;
    console.log(`Coverage Impact:`);
    console.log(`  Before: ${summary.coverageBefore.toFixed(1)}%`);
    console.log(`  After:  ${summary.coverageAfter.toFixed(1)}%`);
    console.log(`  Delta:  ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`);
    if (summary.newToolsCovered && summary.newToolsCovered.length > 0) {
      console.log(`  New tools: ${summary.newToolsCovered.slice(0, 5).join(', ')}${summary.newToolsCovered.length > 5 ? '...' : ''}`);
    }
    console.log('');
  }

  // Failed use cases
  const failed = summary.results.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    console.log(`Failed Use Cases:`);
    for (const result of failed) {
      console.log(`  - ${result.useCaseId}: ${result.error || 'Unknown error'}`);
    }
    console.log('');
  }

  // Timeout use cases
  const timeouts = summary.results.filter((r) => r.status === 'timeout');
  if (timeouts.length > 0) {
    console.log(`Timeout Use Cases:`);
    for (const result of timeouts) {
      console.log(`  - ${result.useCaseId}`);
    }
    console.log('');
  }

  console.log(`Session Logs: tests/functional/session-logs/007-real-world-use/`);
  console.log(`Evidence: tests/functional/evidence/`);
}

/**
 * Load coverage report for gap analysis
 */
async function loadCoverageReport(): Promise<CoverageReport | null> {
  try {
    const reportPath = path.join(DEFAULT_OUTPUT_ROOT, 'latest-coverage.json');
    const content = await readFile(reportPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Filter use cases by coverage gaps
 */
async function filterByCoverageGaps(useCases: UseCase[]): Promise<UseCase[]> {
  const report = await loadCoverageReport();
  if (!report) {
    console.warn('Warning: No coverage report found. Run coverage tracking first.');
    return useCases;
  }

  const uncoveredTools = new Set(report.uncoveredTools);
  if (uncoveredTools.size === 0) {
    console.log('All tools covered! Nothing to run.');
    return [];
  }

  // Filter to use cases that target uncovered tools
  return useCases.filter((uc) => uc.expectedTools.some((tool) => uncoveredTools.has(tool)));
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseCliArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Validate domain option
  if (options.domain && !VALID_DOMAINS.includes(options.domain as UseCaseDomain)) {
    console.error(`Invalid domain: ${options.domain}`);
    console.error(`Valid domains: ${VALID_DOMAINS.join(', ')}`);
    process.exit(1);
  }

  // Load use cases
  let useCases: UseCase[] = [];

  if (options.single) {
    // Load single use case
    try {
      const useCase = await loadSingleUseCase(options.single, DEFAULT_LIBRARY_ROOT);
      useCases = [useCase];
    } catch (error) {
      console.error(`Failed to load use case: ${options.single}`);
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  } else {
    // Load all use cases
    const loadResult = await loadUseCases({ libraryPath: DEFAULT_LIBRARY_ROOT });
    useCases = loadResult.useCases;

    // Apply domain filter
    if (options.domain) {
      useCases = useCases.filter((uc) => uc.domain === options.domain);
    }

    // Apply coverage gaps filter
    if (options.coverageGaps) {
      useCases = await filterByCoverageGaps(useCases);
    }
  }

  if (useCases.length === 0) {
    console.log('No use cases to run.');
    process.exit(0);
  }

  // Dry run - just list use cases
  if (options.dryRun) {
    console.log(`Would run ${useCases.length} use cases:\n`);
    for (const uc of useCases) {
      console.log(`  ${uc.id}`);
      console.log(`    Domain: ${uc.domain}`);
      console.log(`    Expected tools: ${uc.expectedTools.join(', ')}`);
      console.log(`    Timeout: ${uc.timeout}min`);
      console.log('');
    }
    process.exit(0);
  }

  // Initialize executor with MCP config for Mittwald tools
  const executor = new UseCaseExecutor({
    mcpConfig: DEFAULT_MCP_CONFIG,
  });

  // Track results
  const results: ExecutionResult[] = [];
  const summary: RunSummary = {
    startTime: new Date(),
    endTime: new Date(),
    total: useCases.length,
    passed: 0,
    failed: 0,
    timeout: 0,
    cleanupFailed: 0,
    results: [],
  };

  // Track coverage
  const coverageTracker = new CoverageTracker();
  await coverageTracker.loadInventory();
  const beforeState = coverageTracker.getState();

  console.log(`Running ${useCases.length} use cases...\n`);

  // Execute each use case
  for (let i = 0; i < useCases.length; i++) {
    const useCase = useCases[i];
    const index = i + 1;

    printProgress(index, useCases.length, useCase, 'start');

    // Listen to phase events
    const phaseHandler = (event: PhaseEvent) => {
      if (event.phase !== 'init' && event.phase !== 'complete') {
        printProgress(index, useCases.length, useCase, event.phase);
      }
    };

    executor.on('phase', phaseHandler);

    try {
      const execution = await executor.execute(useCase);

      // Update coverage tracker
      if (execution.sessionLogPath) {
        await coverageTracker.parseSessionLog(execution.sessionLogPath, useCase.id);
      }

      // Determine result status
      let status: 'passed' | 'failed' | 'timeout' | 'cleanup-failed';
      if (execution.status === 'success') {
        status = 'passed';
        summary.passed++;
      } else if (execution.status === 'timeout') {
        status = 'timeout';
        summary.timeout++;
      } else if (execution.status === 'cleanup-failed') {
        status = 'cleanup-failed';
        summary.cleanupFailed++;
      } else {
        status = 'failed';
        summary.failed++;
      }

      const duration = execution.endTime
        ? execution.endTime.getTime() - execution.startTime.getTime()
        : undefined;

      printProgress(index, useCases.length, useCase, 'complete', status, duration, execution.errorMessage);

      results.push({
        useCaseId: useCase.id,
        status,
        duration,
        error: execution.errorMessage,
        toolsCovered: execution.toolsInvoked,
      });
    } catch (error) {
      summary.failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);

      printProgress(index, useCases.length, useCase, 'complete', 'failed', undefined, errorMessage);

      results.push({
        useCaseId: useCase.id,
        status: 'failed',
        error: errorMessage,
        toolsCovered: [],
      });
    } finally {
      executor.off('phase', phaseHandler);
    }
  }

  // Finalize summary
  summary.endTime = new Date();
  summary.results = results;

  // Calculate coverage impact
  const afterReport = coverageTracker.generateReport();
  summary.coverageAfter = afterReport.coveragePercent;

  // Print summary
  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printSummary(summary);
  }

  // Save summary to file
  await mkdir(DEFAULT_OUTPUT_ROOT, { recursive: true });
  const summaryPath = path.join(DEFAULT_OUTPUT_ROOT, '007-run-summary.json');
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Report saved to: ${summaryPath}`);

  // Exit with appropriate code
  process.exit(summary.failed + summary.timeout > 0 ? 1 : 0);
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
