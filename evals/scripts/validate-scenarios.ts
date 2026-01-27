import { validateAllScenarios } from './scenario-loader.js';

/**
 * CLI tool to validate all scenario files.
 * Usage: tsx evals/scripts/validate-scenarios.ts [directory]
 */

const scenarioDir = process.argv[2] || 'evals/scenarios/case-studies';

console.log(`Validating scenarios in: ${scenarioDir}\n`);

const results = validateAllScenarios(scenarioDir);

const valid = results.filter((r) => r.valid);
const invalid = results.filter((r) => !r.valid);

valid.forEach((r) => console.log(`✓ ${r.id}`));
invalid.forEach((r) => console.log(`✗ ${r.id}: ${r.error}`));

console.log(
  `\nTotal: ${results.length} | Valid: ${valid.length} | Invalid: ${invalid.length}`
);

process.exit(invalid.length > 0 ? 1 : 0);
