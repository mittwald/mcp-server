import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ScenarioDefinition } from '../../src/types/scenario.js';

// Load schema from main repo (not in worktree)
const schemaPath = '/Users/robert/Code/mittwald-mcp/kitty-specs/018-documentation-driven-mcp-tool-testing/contracts/scenario-definition.schema.json';
const scenarioSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

/**
 * Scenario loader with JSON Schema validation.
 * Loads scenario definitions from JSON files and validates against schema.
 */

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validateScenario = ajv.compile(scenarioSchema);

/**
 * Load a scenario definition from JSON file.
 * @param scenarioId - Scenario identifier (e.g., "freelancer-onboarding")
 * @param scenarioDir - Directory containing scenario files (default: evals/scenarios/case-studies)
 * @returns Validated ScenarioDefinition
 * @throws Error if file not found or validation fails
 */
export function loadScenario(
  scenarioId: string,
  scenarioDir: string = 'evals/scenarios/case-studies'
): ScenarioDefinition {
  const filePath = path.join(process.cwd(), scenarioDir, `${scenarioId}.json`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario file not found: ${filePath}`);
  }

  // Parse JSON
  let json: unknown;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    json = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(
      `Failed to parse scenario JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate against schema
  if (!validateScenario(json)) {
    const errors = ajv.errorsText(validateScenario.errors);
    throw new Error(`Invalid scenario definition: ${errors}`);
  }

  return json as ScenarioDefinition;
}

/**
 * List all available scenario files in a directory.
 * @param scenarioDir - Directory to search (default: evals/scenarios/case-studies)
 * @returns Array of scenario IDs (filenames without .json extension)
 */
export function listScenarios(
  scenarioDir: string = 'evals/scenarios/case-studies'
): string[] {
  const fullPath = path.join(process.cwd(), scenarioDir);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  return fs
    .readdirSync(fullPath)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));
}

/**
 * Validate all scenario files in a directory.
 * @param scenarioDir - Directory to validate (default: evals/scenarios/case-studies)
 * @returns Array of validation results
 */
export function validateAllScenarios(
  scenarioDir: string = 'evals/scenarios/case-studies'
): Array<{ id: string; valid: boolean; error?: string }> {
  const scenarioIds = listScenarios(scenarioDir);

  return scenarioIds.map((id) => {
    try {
      loadScenario(id, scenarioDir);
      return { id, valid: true };
    } catch (error) {
      return {
        id,
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
