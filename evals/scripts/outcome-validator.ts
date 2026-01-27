/**
 * Outcome validator for mittwald.de target testing.
 *
 * Since mittwald.de has no log access, we validate scenarios by checking
 * actual Mittwald resource state using the local `mw` CLI tool.
 *
 * CRITICAL: Validation scripts use `mw` CLI directly. LLMs in test scenarios
 * are FORBIDDEN from using `mw` tool - this would subvert tests by bypassing
 * MCP tools.
 */

import { execSync } from 'child_process';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { TestTarget } from '../config/test-targets.js';

/**
 * Outcome validation result.
 */
export interface OutcomeValidationResult {
  /** Whether all validation checks passed */
  allPassed: boolean;

  /** Individual check results */
  checks: Record<string, boolean>;

  /** Errors encountered during validation */
  errors: string[];

  /** Expected tools (from scenario definition) */
  expectedTools?: string[];
}

/**
 * Validate scenario outcome by checking actual Mittwald resource state.
 *
 * Uses local `mw` CLI to query resources (projects, apps, databases).
 * Compares actual state against scenario's success_criteria.
 *
 * @param scenario - Scenario definition
 * @param target - Test target (must be mittwald.de for outcome validation)
 * @returns Outcome validation result
 */
export async function validateScenarioOutcome(
  scenario: ScenarioDefinition,
  target: TestTarget
): Promise<OutcomeValidationResult> {
  if (target.logSource !== 'outcome-validation') {
    throw new Error(
      `Outcome validation only supported for mittwald.de target (got: ${target.name})`
    );
  }

  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  console.log(`\n🔍 Validating scenario outcome for: ${scenario.name}`);

  // Validate resources_created counts
  if (scenario.success_criteria.resources_created) {
    const { resources_created } = scenario.success_criteria;

    // Validate projects
    if (resources_created.projects !== undefined) {
      try {
        const result = validateProjectCount(resources_created.projects);
        checks.projects_created = result.passed;
        if (!result.passed) {
          errors.push(result.error || 'Project count validation failed');
        }
      } catch (error) {
        checks.projects_created = false;
        errors.push(
          `Project validation error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Validate apps
    if (resources_created.apps !== undefined) {
      try {
        const result = validateAppCount(resources_created.apps);
        checks.apps_created = result.passed;
        if (!result.passed) {
          errors.push(result.error || 'App count validation failed');
        }
      } catch (error) {
        checks.apps_created = false;
        errors.push(
          `App validation error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Validate databases
    if (resources_created.databases !== undefined) {
      try {
        const result = validateDatabaseCount(resources_created.databases);
        checks.databases_created = result.passed;
        if (!result.passed) {
          errors.push(result.error || 'Database count validation failed');
        }
      } catch (error) {
        checks.databases_created = false;
        errors.push(
          `Database validation error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Future: Add validation for other resource types
    // (domains, containers, backups, etc.)
  }

  const allPassed = Object.values(checks).every((v) => v) && errors.length === 0;

  if (allPassed) {
    console.log(`✅ Outcome validation passed`);
  } else {
    console.error(`❌ Outcome validation failed:`);
    errors.forEach((err) => console.error(`  - ${err}`));
  }

  return {
    allPassed,
    checks,
    errors,
    expectedTools: scenario.expected_tools,
  };
}

interface ValidationResult {
  passed: boolean;
  error?: string;
  actual?: number;
  expected?: number;
}

/**
 * Validate project count using `mw project list`.
 */
function validateProjectCount(expectedCount: number): ValidationResult {
  try {
    const output = execSync('mw project list --output json', {
      encoding: 'utf-8',
      timeout: 10000,
    });

    const projects = JSON.parse(output);
    const actualCount = Array.isArray(projects) ? projects.length : 0;

    if (actualCount >= expectedCount) {
      console.log(`  ✅ Projects: ${actualCount} (expected >= ${expectedCount})`);
      return { passed: true, actual: actualCount, expected: expectedCount };
    } else {
      return {
        passed: false,
        error: `Expected >= ${expectedCount} projects, found ${actualCount}`,
        actual: actualCount,
        expected: expectedCount,
      };
    }
  } catch (error) {
    return {
      passed: false,
      error: `Failed to list projects: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate app count using `mw app list`.
 */
function validateAppCount(expectedCount: number): ValidationResult {
  try {
    const output = execSync('mw app list --output json', {
      encoding: 'utf-8',
      timeout: 10000,
    });

    const apps = JSON.parse(output);
    const actualCount = Array.isArray(apps) ? apps.length : 0;

    if (actualCount >= expectedCount) {
      console.log(`  ✅ Apps: ${actualCount} (expected >= ${expectedCount})`);
      return { passed: true, actual: actualCount, expected: expectedCount };
    } else {
      return {
        passed: false,
        error: `Expected >= ${expectedCount} apps, found ${actualCount}`,
        actual: actualCount,
        expected: expectedCount,
      };
    }
  } catch (error) {
    return {
      passed: false,
      error: `Failed to list apps: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate database count using `mw database mysql list`.
 */
function validateDatabaseCount(expectedCount: number): ValidationResult {
  try {
    const output = execSync('mw database mysql list --output json', {
      encoding: 'utf-8',
      timeout: 10000,
    });

    const databases = JSON.parse(output);
    const actualCount = Array.isArray(databases) ? databases.length : 0;

    if (actualCount >= expectedCount) {
      console.log(`  ✅ Databases: ${actualCount} (expected >= ${expectedCount})`);
      return { passed: true, actual: actualCount, expected: expectedCount };
    } else {
      return {
        passed: false,
        error: `Expected >= ${expectedCount} databases, found ${actualCount}`,
        actual: actualCount,
        expected: expectedCount,
      };
    }
  } catch (error) {
    return {
      passed: false,
      error: `Failed to list databases: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
