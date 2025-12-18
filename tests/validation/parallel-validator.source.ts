import { spawn } from 'child_process';
import { ValidationResult, ValidationOptions } from './types.js';

/**
 * Execute CLI command and capture output
 */
async function executeCli(command: string, args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      const durationMs = performance.now() - startTime;
      resolve({
        stdout,
        stderr,
        exitCode: exitCode || 0,
        durationMs,
      });
    });
  });
}

/**
 * Deep compare two objects and find discrepancies
 */
function deepCompare(
  obj1: unknown,
  obj2: unknown,
  path = '',
  ignoreFields: string[] = []
): Array<{ field: string; cliValue: unknown; libraryValue: unknown; diff: string }> {
  const discrepancies: Array<{
    field: string;
    cliValue: unknown;
    libraryValue: unknown;
    diff: string;
  }> = [];

  // Skip ignored fields
  if (ignoreFields.includes(path)) {
    return discrepancies;
  }

  // Handle null/undefined
  if (obj1 === null && obj2 === null) return discrepancies;
  if (obj1 === undefined && obj2 === undefined) return discrepancies;
  if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
    discrepancies.push({
      field: path,
      cliValue: obj1,
      libraryValue: obj2,
      diff: `CLI: ${obj1}, Library: ${obj2}`,
    });
    return discrepancies;
  }

  // Handle primitives
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    if (obj1 !== obj2) {
      discrepancies.push({
        field: path,
        cliValue: obj1,
        libraryValue: obj2,
        diff: `CLI: ${obj1}, Library: ${obj2}`,
      });
    }
    return discrepancies;
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      discrepancies.push({
        field: `${path}.length`,
        cliValue: obj1.length,
        libraryValue: obj2.length,
        diff: `CLI array length: ${obj1.length}, Library array length: ${obj2.length}`,
      });
    }

    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemDiscrepancies = deepCompare(
        obj1[i],
        obj2[i],
        `${path}[${i}]`,
        ignoreFields
      );
      discrepancies.push(...itemDiscrepancies);
    }
    return discrepancies;
  }

  // Handle objects
  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);
  const allKeys = Array.from(new Set([...keys1, ...keys2]));

  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const itemDiscrepancies = deepCompare(
      (obj1 as any)[key],
      (obj2 as any)[key],
      newPath,
      ignoreFields
    );
    discrepancies.push(...itemDiscrepancies);
  }

  return discrepancies;
}

/**
 * Validate tool parity between CLI and library implementations
 */
export async function validateToolParity(
  options: ValidationOptions
): Promise<ValidationResult> {
  // Execute CLI
  const cliResult = await executeCli(options.cliCommand, options.cliArgs);

  // Execute library function
  let libraryResult: { data: unknown; status: number; durationMs: number };
  try {
    const result = await options.libraryFn();
    libraryResult = result as any;
  } catch (error) {
    libraryResult = {
      data: null,
      status: 500,
      durationMs: 0,
    };
  }

  // Parse CLI stdout as JSON
  let cliData: unknown;
  try {
    cliData = JSON.parse(cliResult.stdout);
  } catch {
    cliData = cliResult.stdout;
  }

  // Compare outputs
  const ignoreFields = ['durationMs', 'duration', 'timestamp', ...(options.ignoreFields || [])];
  const discrepancies = deepCompare(cliData, libraryResult.data, '', ignoreFields);

  return {
    toolName: options.toolName,
    passed: discrepancies.length === 0 && cliResult.exitCode === 0,
    cliOutput: cliResult,
    libraryOutput: libraryResult,
    discrepancies,
  };
}

/**
 * Generate human-readable validation report
 */
export function generateReport(results: ValidationResult[]): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  lines.push(`Total: ${results.length} tools`);
  lines.push(`Passed: ${passed} (${Math.round((passed / results.length) * 100)}%)`);
  lines.push(`Failed: ${failed} (${Math.round((failed / results.length) * 100)}%)`);
  lines.push('');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    lines.push(`${status} - ${result.toolName}`);

    if (!result.passed) {
      lines.push(`  CLI exit code: ${result.cliOutput.exitCode}`);
      lines.push(`  Discrepancies: ${result.discrepancies.length}`);

      for (const disc of result.discrepancies.slice(0, 5)) {
        lines.push(`    - ${disc.field}: ${disc.diff}`);
      }

      if (result.discrepancies.length > 5) {
        lines.push(`    ... and ${result.discrepancies.length - 5} more`);
      }
      lines.push('');
    }
  }

  lines.push('='.repeat(80));
  return lines.join('\n');
}
