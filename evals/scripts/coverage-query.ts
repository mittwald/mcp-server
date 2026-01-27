import {
  loadValidationDatabase,
  getValidationSummary,
} from './coverage-tracker.js';
import type { ToolValidationRecord } from '../../src/types/tool-validation.js';

/**
 * Coverage query CLI for validation status.
 * Query which tools are validated, failed, or not tested.
 */

type QueryMode = 'summary' | 'tool' | 'domain' | 'status' | 'scenario';

interface QueryOptions {
  mode: QueryMode;
  tool?: string;
  domain?: string;
  status?: 'not_tested' | 'success' | 'failed';
  scenario?: string;
}

/**
 * Query validation status.
 */
function query(options: QueryOptions): void {
  const database = loadValidationDatabase();

  switch (options.mode) {
    case 'summary':
      showSummary();
      break;

    case 'tool':
      if (!options.tool) {
        console.error('Error: --tool <name> required');
        process.exit(1);
      }
      showToolDetails(options.tool, database.tools);
      break;

    case 'domain':
      if (!options.domain) {
        console.error('Error: --domain <name> required');
        process.exit(1);
      }
      showDomainDetails(options.domain, database.tools);
      break;

    case 'status':
      if (!options.status) {
        console.error(
          'Error: --status <not_tested|success|failed> required'
        );
        process.exit(1);
      }
      showToolsByStatus(options.status, database.tools);
      break;

    case 'scenario':
      if (!options.scenario) {
        console.error('Error: --scenario <id> required');
        process.exit(1);
      }
      showScenarioTools(options.scenario, database.tools);
      break;
  }
}

/**
 * Show validation summary.
 */
function showSummary(): void {
  const summary = getValidationSummary();

  console.log('=== Validation Summary ===\n');
  console.log(`Total tools: ${summary.total}`);
  console.log(
    `Validated (success): ${summary.success} (${summary.validation_rate.toFixed(1)}%)`
  );
  console.log(`Failed: ${summary.failed}`);
  console.log(`Not tested: ${summary.not_tested}`);

  console.log('\nValidation progress:');
  const progressBar =
    '█'.repeat(Math.floor(summary.validation_rate / 2)) +
    '░'.repeat(50 - Math.floor(summary.validation_rate / 2));
  console.log(`[${progressBar}] ${summary.validation_rate.toFixed(1)}%`);
}

/**
 * Show details for a specific tool.
 */
function showToolDetails(
  toolName: string,
  tools: ToolValidationRecord[]
): void {
  const record = tools.find(
    (t) => t.tool_name === toolName || t.tool_name.endsWith(toolName)
  );

  if (!record) {
    console.error(`Tool not found: ${toolName}`);
    process.exit(1);
  }

  console.log(`=== Tool: ${record.tool_name} ===\n`);
  console.log(`Domain: ${record.tool_domain}`);
  console.log(`Status: ${record.status}`);
  console.log(`Total calls: ${record.total_calls}`);
  console.log(`Tested in scenarios: ${record.tested_in_scenarios.length}`);

  if (record.status === 'success') {
    console.log(`\nValidated by: ${record.validated_by_scenario}`);
    console.log(`Validated at: ${record.validated_at}`);
    console.log(`Last success run: ${record.last_success_run}`);
  } else if (record.status === 'failed') {
    console.log(`\nFailed in: ${record.failure_details?.failed_in_scenario}`);
    console.log(`Failed at: ${record.failure_details?.failed_at}`);
    console.log(`Error: ${record.failure_details?.error_message}`);
    if (record.failure_details?.error_code) {
      console.log(`Error code: ${record.failure_details.error_code}`);
    }
  }

  if (record.tested_in_scenarios.length > 0) {
    console.log(`\nScenarios that called this tool:`);
    record.tested_in_scenarios.forEach((s) => console.log(`  - ${s}`));
  }
}

/**
 * Show validation status for a domain.
 */
function showDomainDetails(
  domain: string,
  tools: ToolValidationRecord[]
): void {
  const domainTools = tools.filter((t) => t.tool_domain === domain);

  if (domainTools.length === 0) {
    console.error(`Domain not found: ${domain}`);
    process.exit(1);
  }

  const success = domainTools.filter((t) => t.status === 'success').length;
  const failed = domainTools.filter((t) => t.status === 'failed').length;
  const notTested = domainTools.filter(
    (t) => t.status === 'not_tested'
  ).length;

  console.log(`=== Domain: ${domain} ===\n`);
  console.log(`Total tools: ${domainTools.length}`);
  console.log(
    `Validated: ${success} (${((success / domainTools.length) * 100).toFixed(1)}%)`
  );
  console.log(`Failed: ${failed}`);
  console.log(`Not tested: ${notTested}`);

  console.log('\nTools:');
  domainTools.forEach((t) => {
    const statusIcon =
      t.status === 'success' ? '✓' : t.status === 'failed' ? '✗' : '○';
    console.log(`  ${statusIcon} ${t.tool_name}`);
  });
}

/**
 * Show tools by validation status.
 */
function showToolsByStatus(
  status: 'not_tested' | 'success' | 'failed',
  tools: ToolValidationRecord[]
): void {
  const filtered = tools.filter((t) => t.status === status);

  console.log(`=== Tools with status: ${status} ===\n`);
  console.log(`Total: ${filtered.length}\n`);

  filtered.forEach((t) => {
    console.log(`${t.tool_name} (${t.tool_domain})`);
  });
}

/**
 * Show tools validated by a scenario.
 */
function showScenarioTools(
  scenarioId: string,
  tools: ToolValidationRecord[]
): void {
  const filtered = tools.filter((t) =>
    t.tested_in_scenarios.includes(scenarioId)
  );

  console.log(`=== Tools called in scenario: ${scenarioId} ===\n`);
  console.log(`Total: ${filtered.length}\n`);

  filtered.forEach((t) => {
    const statusIcon =
      t.status === 'success' ? '✓' : t.status === 'failed' ? '✗' : '○';
    console.log(`  ${statusIcon} ${t.tool_name} (${t.tool_domain})`);
  });
}

/**
 * CLI entrypoint.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  const options: QueryOptions = {
    mode: 'summary',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--summary':
        options.mode = 'summary';
        break;
      case '--tool':
        options.mode = 'tool';
        options.tool = args[++i];
        break;
      case '--domain':
        options.mode = 'domain';
        options.domain = args[++i];
        break;
      case '--status':
        options.mode = 'status';
        options.status = args[++i] as any;
        break;
      case '--scenario':
        options.mode = 'scenario';
        options.scenario = args[++i];
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        console.error('\nUsage:');
        console.error('  tsx evals/scripts/coverage-query.ts [--summary]');
        console.error('  tsx evals/scripts/coverage-query.ts --tool <name>');
        console.error(
          '  tsx evals/scripts/coverage-query.ts --domain <name>'
        );
        console.error(
          '  tsx evals/scripts/coverage-query.ts --status <not_tested|success|failed>'
        );
        console.error(
          '  tsx evals/scripts/coverage-query.ts --scenario <id>'
        );
        process.exit(1);
    }
  }

  query(options);
}
