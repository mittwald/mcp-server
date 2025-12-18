#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { validateToolParity, generateReport } from './parallel-validator.js';
import type { ValidationResult } from './types.js';

/**
 * Run validation suite for all library functions
 */
async function runValidationSuite() {
  console.log('Starting validation suite...\n');

  const results: ValidationResult[] = [];

  // Example validation (would be expanded for real tools)
  console.log('[1/1] Validating example tool...');

  // This is a placeholder - in WP04 we'll add real tool validation
  const exampleResult: ValidationResult = {
    toolName: 'example_tool',
    passed: true,
    cliOutput: {
      stdout: '{}',
      stderr: '',
      exitCode: 0,
      durationMs: 100,
    },
    libraryOutput: {
      data: {},
      status: 200,
      durationMs: 50,
    },
    discrepancies: [],
  };

  results.push(exampleResult);

  // Generate report
  const report = generateReport(results);
  console.log(report);

  // Save JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    totalTools: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };

  writeFileSync(
    'validation-report.json',
    JSON.stringify(jsonReport, null, 2),
    'utf-8'
  );

  console.log('\nValidation report saved to: validation-report.json');

  // Exit with appropriate code
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

runValidationSuite().catch((error) => {
  console.error('Validation suite failed:', error);
  process.exit(1);
});
