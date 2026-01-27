import fs from 'fs';
import path from 'path';
import { loadValidationDatabase } from './coverage-tracker.js';
import { runScenario } from './scenario-runner.js';

/**
 * Retry-failures script.
 * Re-runs only scenarios that resulted in failed tools.
 */

/**
 * Get list of failed scenarios from validation records.
 */
function getFailedScenarios(): string[] {
  const database = loadValidationDatabase();
  const failedTools = database.tools.filter(t => t.status === 'failed');

  const failedScenarios = new Set<string>();

  for (const tool of failedTools) {
    if (tool.failure_details) {
      failedScenarios.add(tool.failure_details.failed_in_scenario);
    }
  }

  return Array.from(failedScenarios);
}

/**
 * Retry all failed scenarios.
 */
async function retryFailures(): Promise<void> {
  const failedScenarios = getFailedScenarios();

  if (failedScenarios.length === 0) {
    console.log('No failed scenarios to retry. All scenarios succeeded!');
    return;
  }

  console.log(`Retrying ${failedScenarios.length} failed scenarios:\n`);
  failedScenarios.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log('');

  let successCount = 0;
  let stillFailingCount = 0;

  for (let i = 0; i < failedScenarios.length; i++) {
    const scenarioId = failedScenarios[i];

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Retry ${i + 1}/${failedScenarios.length}: ${scenarioId}`);
    console.log('='.repeat(80));

    try {
      const result = await runScenario({
        scenarioId,
        scenarioDir: 'evals/scenarios/case-studies',
        keepResources: false,
      });

      if (result.status === 'success') {
        successCount++;
        console.log(`✓ SUCCESS: ${scenarioId} (now passing)`);
      } else {
        stillFailingCount++;
        console.log(`✗ STILL FAILING: ${scenarioId}`);
        console.log(`  Error: ${result.failure_details?.error_message}`);
      }
    } catch (error) {
      stillFailingCount++;
      console.error(`✗ FATAL ERROR: ${scenarioId}`);
      console.error(error);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('RETRY SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total retried: ${failedScenarios.length}`);
  console.log(`Now passing: ${successCount}`);
  console.log(`Still failing: ${stillFailingCount}`);

  if (stillFailingCount > 0) {
    console.log('\nStill failing scenarios require investigation:');
    console.log('  1. Check failure patterns: npm run failures:report');
    console.log('  2. Review MCP server logs: flyctl logs -a mittwald-mcp-fly2');
    console.log('  3. Run individual scenario with --keep-resources for debugging');
  }
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/retry-failures.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  retryFailures()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
