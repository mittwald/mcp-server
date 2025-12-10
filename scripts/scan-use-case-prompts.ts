#!/usr/bin/env node

/**
 * WP03 T017: Automated Tool Name Pattern Scan
 *
 * Purpose: Verify all 31 use case prompts contain zero:
 * - mcp__mittwald__ tool name patterns
 * - Prescriptive language ("Use the", "Call the", "Invoke")
 *
 * Status: ✅ Complete
 * Date: 2025-12-09
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Configuration
const USE_CASE_BASE_DIR = join(process.cwd(), 'tests/functional/use-case-library');

// Get all JSON files from subdirectories
function getAllUseCaseFiles(baseDir: string): string[] {
  const files: string[] = [];
  const domains = readdirSync(baseDir).filter(f => {
    const stat = statSync(join(baseDir, f));
    return stat.isDirectory();
  });

  for (const domain of domains) {
    const domainDir = join(baseDir, domain);
    const domainFiles = readdirSync(domainDir)
      .filter(f => f.endsWith('.json'))
      .map(f => join(domainDir, f));
    files.push(...domainFiles);
  }

  return files.sort();
}

// Patterns to scan for
const PROHIBITED_PATTERNS = [
  // Tool names
  /mcp__mittwald__/gi,

  // Prescriptive language
  /\buse the (tools|mcp|mittwald)\b/gi,
  /\buse the (api|endpoint)\b/gi,
  /\bcall the\b/gi,
  /\binvoke\b/gi,
  /\bfirst,?\s+(use|call|invoke)\b/gi,
  /\bthen,?\s+(use|call|invoke)\b/gi,
];

const PATTERN_NAMES = [
  'Tool name (mcp__mittwald__*)',
  'Prescriptive: "use the tools/mcp"',
  'Prescriptive: "use the api/endpoint"',
  'Prescriptive: "call the"',
  'Prescriptive: "invoke"',
  'Prescriptive: "first, use/call"',
  'Prescriptive: "then, use/call"',
];

interface ScanResult {
  file: string;
  violations: string[];
  passed: boolean;
}

/**
 * Scan a single use case file for prohibited patterns
 */
function scanFile(filePath: string): ScanResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const prompt = data.prompt || '';

    const violations: string[] = [];

    // Check each pattern
    for (let i = 0; i < PROHIBITED_PATTERNS.length; i++) {
      const pattern = PROHIBITED_PATTERNS[i];
      const matches = prompt.match(pattern);

      if (matches && matches.length > 0) {
        violations.push(`${PATTERN_NAMES[i]}: ${matches.join(', ')}`);
      }
    }

    return {
      file: filePath.split('/').pop() || filePath,
      violations,
      passed: violations.length === 0,
    };
  } catch (error) {
    return {
      file: filePath.split('/').pop() || filePath,
      violations: [`Error parsing: ${error}`],
      passed: false,
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('WP03 T017: Automated Tool Name Pattern Scan');
  console.log('Purpose: Verify all 31 use case prompts are outcome-focused (zero tool names)');
  console.log('Date: 2025-12-09');
  console.log('='.repeat(80));
  console.log();

  // Get all use case files from all domains
  const files = getAllUseCaseFiles(USE_CASE_BASE_DIR);

  console.log(`Scanning ${files.length} use case files...`);
  console.log();

  const results: ScanResult[] = [];

  for (const filePath of files) {
    const result = scanFile(filePath);
    results.push(result);
  }

  // Report results
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  // Detailed results
  console.log('Detailed Results:');
  console.log('-'.repeat(80));

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.file}`);

    if (result.violations.length > 0) {
      for (const violation of result.violations) {
        console.log(`  └─ ${violation}`);
      }
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Total Files Scanned: ${files.length}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log();

  if (failedCount === 0) {
    console.log('🎉 SUCCESS: All 31 use case prompts passed automated scan!');
    console.log('   Zero tool name references found.');
    console.log('   All prompts are outcome-focused.');
  } else {
    console.log(`⚠️  WARNING: ${failedCount} file(s) contain prohibited patterns.`);
    console.log('   Please review and fix the violations above.');
  }

  console.log();
  console.log('='.repeat(80));

  // Return exit code based on results
  process.exit(failedCount === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
