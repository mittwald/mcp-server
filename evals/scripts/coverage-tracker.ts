import fs from 'fs';
import path from 'path';
import { loadToolInventory, normalizeToolName } from './tool-inventory.js';
import type {
  ToolValidationRecord,
  ToolValidationDatabase,
} from '../../src/types/tool-validation.js';
import type { ScenarioExecutionResult } from '../../src/types/scenario-execution.js';

/**
 * Coverage tracker for tool validation records.
 * Updates tool-validation.json based on scenario execution results.
 */

const VALIDATION_FILE = 'evals/coverage/tool-validation.json';

/**
 * Initialize tool validation database with all 115 tools.
 * Creates file if it doesn't exist.
 */
export function initializeValidationDatabase(): void {
  const validationPath = path.join(process.cwd(), VALIDATION_FILE);

  if (fs.existsSync(validationPath)) {
    console.log('Validation database already exists');
    return;
  }

  const tools = loadToolInventory();

  const database: ToolValidationDatabase = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    tools: tools.map((tool) => ({
      tool_name: tool.tool_name,
      tool_domain: tool.tool_domain,
      status: 'not_tested',
      tested_in_scenarios: [],
      total_calls: 0,
    })),
  };

  const dir = path.dirname(validationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    validationPath,
    JSON.stringify(database, null, 2),
    'utf-8'
  );
  console.log(
    `Initialized validation database: ${VALIDATION_FILE} (${tools.length} tools)`
  );
}

/**
 * Load tool validation database.
 */
export function loadValidationDatabase(): ToolValidationDatabase {
  const validationPath = path.join(process.cwd(), VALIDATION_FILE);

  if (!fs.existsSync(validationPath)) {
    initializeValidationDatabase();
    return loadValidationDatabase(); // Recursive call after initialization
  }

  return JSON.parse(fs.readFileSync(validationPath, 'utf-8'));
}

/**
 * Save tool validation database (atomic write).
 */
function saveValidationDatabase(database: ToolValidationDatabase): void {
  const validationPath = path.join(process.cwd(), VALIDATION_FILE);

  // Atomic write: write to temp file, then rename
  const tempPath = `${validationPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(database, null, 2), 'utf-8');
  fs.renameSync(tempPath, validationPath);
}

/**
 * Update validation records based on scenario execution result.
 * @param result - Scenario execution result
 */
export function updateValidationRecords(
  result: ScenarioExecutionResult
): void {
  const database = loadValidationDatabase();

  // Track which tools were called (with normalization)
  const toolsCalled = new Set(result.tools_called.map(normalizeToolName));

  for (const toolName of toolsCalled) {
    const record = database.tools.find(
      (t) => normalizeToolName(t.tool_name) === toolName
    );

    if (!record) {
      console.warn(`Tool not in inventory: ${toolName}`);
      continue;
    }

    // Update metadata
    if (!record.tested_in_scenarios.includes(result.scenario_id)) {
      record.tested_in_scenarios.push(result.scenario_id);
    }
    record.total_calls++;

    // Update validation status
    if (result.status === 'success') {
      // Mark as validated (only if not already failed)
      if (record.status !== 'failed') {
        record.status = 'success';
        record.validated_by_scenario = result.scenario_id;
        record.validated_at = result.executed_at;
        record.last_success_run = result.run_id;
      }
    } else if (result.status === 'failure') {
      // Mark as failed (only if not already successful)
      if (record.status !== 'success') {
        record.status = 'failed';
        record.failure_details = {
          error_message:
            result.failure_details?.error_message || 'Unknown error',
          error_code: result.failure_details?.error_code,
          failed_in_scenario: result.scenario_id,
          failed_at: result.executed_at,
        };
      }
    }
  }

  database.generated_at = new Date().toISOString();
  saveValidationDatabase(database);

  console.log(
    `Updated validation records: ${toolsCalled.size} tools from scenario ${result.scenario_id}`
  );
}

/**
 * Get validation status summary.
 */
export function getValidationSummary(): {
  total: number;
  not_tested: number;
  success: number;
  failed: number;
  validation_rate: number;
} {
  const database = loadValidationDatabase();

  const notTested = database.tools.filter(
    (t) => t.status === 'not_tested'
  ).length;
  const success = database.tools.filter((t) => t.status === 'success').length;
  const failed = database.tools.filter((t) => t.status === 'failed').length;

  return {
    total: database.tools.length,
    not_tested: notTested,
    success,
    failed,
    validation_rate: (success / database.tools.length) * 100,
  };
}

/**
 * CLI tool to update validation records from scenario result file.
 * Usage: tsx evals/scripts/coverage-tracker.ts <result-file.json>
 *        tsx evals/scripts/coverage-tracker.ts --init
 *        tsx evals/scripts/coverage-tracker.ts --summary
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === '--init') {
    initializeValidationDatabase();
    process.exit(0);
  }

  if (command === '--summary') {
    const summary = getValidationSummary();
    console.log('\nValidation summary:');
    console.log(`  Total: ${summary.total}`);
    console.log(`  Success: ${summary.success}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(`  Not tested: ${summary.not_tested}`);
    console.log(`  Validation rate: ${summary.validation_rate.toFixed(1)}%`);
    process.exit(0);
  }

  const resultFile = command;

  if (!resultFile) {
    console.error(
      'Usage: tsx evals/scripts/coverage-tracker.ts <result-file.json>'
    );
    console.error('       tsx evals/scripts/coverage-tracker.ts --init');
    console.error('       tsx evals/scripts/coverage-tracker.ts --summary');
    process.exit(1);
  }

  const resultPath = path.join(process.cwd(), resultFile);
  if (!fs.existsSync(resultPath)) {
    console.error(`Result file not found: ${resultPath}`);
    process.exit(1);
  }

  const result: ScenarioExecutionResult = JSON.parse(
    fs.readFileSync(resultPath, 'utf-8')
  );
  updateValidationRecords(result);

  const summary = getValidationSummary();
  console.log('\nValidation summary:');
  console.log(`  Total: ${summary.total}`);
  console.log(`  Success: ${summary.success}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Not tested: ${summary.not_tested}`);
  console.log(`  Validation rate: ${summary.validation_rate.toFixed(1)}%`);
}
