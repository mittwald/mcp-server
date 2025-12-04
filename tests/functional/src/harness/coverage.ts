/**
 * Coverage CLI - Display Test Coverage Statistics
 *
 * Command-line interface for querying manifest coverage.
 */

import { createManifestManager } from './manifest.js';

/**
 * Display coverage report
 */
async function displayCoverage(jsonOutput: boolean): Promise<number> {
  const manager = createManifestManager();

  if (!manager.exists()) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No manifest file found. Run tests first.' }));
    } else {
      console.log('No manifest file found. Run tests first.');
    }
    return 1;
  }

  // TODO: Load known tools from discovery (WP06)
  // For now, calculate coverage based on tested tools only
  const coverage = await manager.getCoverage();

  if (jsonOutput) {
    console.log(JSON.stringify(coverage, null, 2));
  } else {
    console.log('');
    console.log('MCP Functional Test Coverage Report');
    console.log('====================================');
    console.log('');
    console.log(`Total Tools:    ${coverage.totalTools}`);
    console.log(`Tested:         ${coverage.testedTools} (${coverage.coverage.toFixed(1)}%)`);
    console.log(`Passed:         ${coverage.passedTools}`);
    console.log(`Failed:         ${coverage.failedTools}`);
    console.log(`Untested:       ${coverage.untestedTools.length}`);
    console.log('');

    if (coverage.untestedTools.length > 0) {
      console.log('Untested tools:');
      for (const tool of coverage.untestedTools.slice(0, 20)) {
        console.log(`  - ${tool}`);
      }
      if (coverage.untestedTools.length > 20) {
        console.log(`  ... and ${coverage.untestedTools.length - 20} more`);
      }
    }
  }

  return coverage.testedTools > 0 ? 0 : 1;
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  const exitCode = await displayCoverage(jsonOutput);
  process.exit(exitCode);
}

// Run if executed directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { displayCoverage };
