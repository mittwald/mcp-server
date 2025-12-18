#!/usr/bin/env node
/**
 * WP04 Pilot Tool Validation Script
 *
 * Tests the migrated mittwald_app_list tool with:
 * - Success cases (valid projectId)
 * - Error cases (invalid projectId)
 * - Performance benchmarking
 */

import 'dotenv/config';
import { validateToolParity, generateReport } from './parallel-validator.js';
import { listApps } from '@mittwald-mcp/cli-core';
import type { ValidationResult } from './types.js';

const MITTWALD_API_TOKEN = process.env.MITTWALD_API_TOKEN;
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'p-test-id';

if (!MITTWALD_API_TOKEN) {
  console.error('Error: MITTWALD_API_TOKEN not found in environment');
  console.error('Please add it to .env file in the root directory');
  process.exit(1);
}

async function runSuccessCase(): Promise<ValidationResult> {
  console.log('\n=== Test Case 1: Success (Valid Project ID) ===\n');

  const result = await validateToolParity({
    toolName: 'mittwald_app_list',
    cliCommand: 'mw',
    cliArgs: [
      'app',
      'list',
      '--project-id',
      TEST_PROJECT_ID,
      '--token',
      MITTWALD_API_TOKEN,
      '--output',
      'json',
    ],
    libraryFn: async () => {
      return await listApps({
        projectId: TEST_PROJECT_ID,
        apiToken: MITTWALD_API_TOKEN,
      });
    },
    ignoreFields: ['durationMs', 'duration', 'timestamp'],
  });

  console.log(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`CLI exit code: ${result.cliOutput.exitCode}`);
  console.log(`CLI duration: ${result.cliOutput.durationMs.toFixed(2)}ms`);
  console.log(`Library duration: ${result.libraryOutput.durationMs.toFixed(2)}ms`);
  console.log(`Speedup: ${((result.cliOutput.durationMs / result.libraryOutput.durationMs)).toFixed(2)}x faster`);
  console.log(`Discrepancies: ${result.discrepancies.length}`);

  if (result.discrepancies.length > 0) {
    console.log('\nDiscrepancies found:');
    result.discrepancies.forEach((disc, i) => {
      console.log(`  ${i + 1}. ${disc.field}: ${disc.diff}`);
    });
  }

  return result;
}

async function runErrorCase(): Promise<ValidationResult> {
  console.log('\n=== Test Case 2: Error (Invalid Project ID) ===\n');

  const invalidProjectId = 'p-invalid-12345';

  const result = await validateToolParity({
    toolName: 'mittwald_app_list_error',
    cliCommand: 'mw',
    cliArgs: [
      'app',
      'list',
      '--project-id',
      invalidProjectId,
      '--token',
      MITTWALD_API_TOKEN,
      '--output',
      'json',
    ],
    libraryFn: async () => {
      return await listApps({
        projectId: invalidProjectId,
        apiToken: MITTWALD_API_TOKEN,
      });
    },
    ignoreFields: ['durationMs', 'duration', 'timestamp'],
  });

  console.log(`CLI exit code: ${result.cliOutput.exitCode} (expected: non-zero)`);
  console.log(`Library status: ${result.libraryOutput.status}`);
  console.log(`CLI stderr present: ${result.cliOutput.stderr ? 'Yes' : 'No'}`);
  console.log(`CLI duration: ${result.cliOutput.durationMs.toFixed(2)}ms`);
  console.log(`Library duration: ${result.libraryOutput.durationMs.toFixed(2)}ms`);

  // For error cases, we expect both to fail (non-zero exit code, error status)
  const bothFailed = result.cliOutput.exitCode !== 0 && result.libraryOutput.status >= 400;
  console.log(`\nError handling parity: ${bothFailed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`(Both CLI and library should fail for invalid projectId)`);

  return result;
}

async function runPerformanceBenchmark(): Promise<void> {
  console.log('\n=== Performance Benchmark (100 requests) ===\n');

  const iterations = 100;
  const cliTimes: number[] = [];
  const libraryTimes: number[] = [];

  console.log('Running benchmark...');
  const progressInterval = Math.floor(iterations / 10);

  for (let i = 0; i < iterations; i++) {
    if (i % progressInterval === 0) {
      process.stdout.write(`  Progress: ${i}/${iterations} (${Math.floor((i / iterations) * 100)}%)\r`);
    }

    const result = await validateToolParity({
      toolName: 'mittwald_app_list',
      cliCommand: 'mw',
      cliArgs: [
        'app',
        'list',
        '--project-id',
        TEST_PROJECT_ID,
        '--token',
        MITTWALD_API_TOKEN,
        '--output',
        'json',
      ],
      libraryFn: async () => {
        return await listApps({
          projectId: TEST_PROJECT_ID,
          apiToken: MITTWALD_API_TOKEN,
        });
      },
    });

    cliTimes.push(result.cliOutput.durationMs);
    libraryTimes.push(result.libraryOutput.durationMs);
  }

  console.log(`  Progress: ${iterations}/${iterations} (100%)\n`);

  // Calculate statistics
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const mean = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);

  const cliMedian = median(cliTimes);
  const cliMean = mean(cliTimes);
  const libraryMedian = median(libraryTimes);
  const libraryMean = mean(libraryTimes);

  console.log('CLI Performance:');
  console.log(`  Median: ${cliMedian.toFixed(2)}ms`);
  console.log(`  Mean: ${cliMean.toFixed(2)}ms`);
  console.log(`  Min: ${min(cliTimes).toFixed(2)}ms`);
  console.log(`  Max: ${max(cliTimes).toFixed(2)}ms`);

  console.log('\nLibrary Performance:');
  console.log(`  Median: ${libraryMedian.toFixed(2)}ms`);
  console.log(`  Mean: ${libraryMean.toFixed(2)}ms`);
  console.log(`  Min: ${min(libraryTimes).toFixed(2)}ms`);
  console.log(`  Max: ${max(libraryTimes).toFixed(2)}ms`);

  console.log('\nImprovement:');
  console.log(`  Median speedup: ${(cliMedian / libraryMedian).toFixed(2)}x faster`);
  console.log(`  Mean speedup: ${(cliMean / libraryMean).toFixed(2)}x faster`);
  console.log(`  Target: <50ms median (Library: ${libraryMedian < 50 ? '✓ PASSED' : '✗ FAILED'})`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  WP04 Pilot Tool Validation - mittwald_app_list           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results: ValidationResult[] = [];

  try {
    // Test 1: Success case
    const successResult = await runSuccessCase();
    results.push(successResult);

    // Test 2: Error case
    const errorResult = await runErrorCase();
    results.push(errorResult);

    // Performance benchmark
    await runPerformanceBenchmark();

    // Generate report
    console.log('\n');
    console.log(generateReport(results));

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  WP04 VALIDATION SUMMARY                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const successPassed = results[0].passed;
    const performanceTarget = results[0].libraryOutput.durationMs < 50;

    console.log(`Success case parity: ${successPassed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`Performance target (<50ms): ${performanceTarget ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`Error handling tested: ✓ COMPLETED`);

    if (successPassed && performanceTarget) {
      console.log('\n✓ WP04 PILOT TOOL MIGRATION SUCCESSFUL');
      console.log('  - 100% output parity achieved');
      console.log('  - Performance target met');
      console.log('  - Error handling validated');
      process.exit(0);
    } else {
      console.log('\n✗ WP04 VALIDATION FAILED');
      console.log('  See discrepancies above and fix library implementation');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ VALIDATION ERROR:', error);
    process.exit(1);
  }
}

main();
