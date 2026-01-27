import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ScenarioExecutionResult } from '../../src/types/scenario-execution.js';

/**
 * Outcome validator for scenario success criteria.
 * Validates scenario execution results against expected outcomes.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate scenario execution result against success criteria.
 * @param scenario - Scenario definition with success criteria
 * @param result - Execution result to validate
 * @returns Validation result with errors (if any)
 */
export function validateOutcome(
  scenario: ScenarioDefinition,
  result: ScenarioExecutionResult
): ValidationResult {
  const errors: string[] = [];

  // Check execution status
  if (result.status === 'failure') {
    errors.push(
      `Scenario execution failed: ${result.failure_details?.error_message || 'Unknown error'}`
    );
    return { valid: false, errors };
  }

  // Validate resources_created
  if (scenario.success_criteria.resources_created) {
    const resourceErrors = validateResourceCounts(
      scenario.success_criteria.resources_created as Record<string, number>,
      result.resources_created
    );
    errors.push(...resourceErrors);
  }

  // Validate resources_configured (TODO: implement state checking)
  if (scenario.success_criteria.resources_configured) {
    // Placeholder: would need to query actual resource states via MCP tools
    console.warn('resources_configured validation not yet implemented');
  }

  // Validate expected_tools (optional)
  if (scenario.expected_tools) {
    const toolErrors = validateExpectedTools(
      scenario.expected_tools,
      result.tools_called
    );
    errors.push(...toolErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate resource counts match expectations.
 */
function validateResourceCounts(
  expected: Record<string, number>,
  actual: Array<{ type: string; id: string; name?: string }>
): string[] {
  const errors: string[] = [];

  for (const [resourceType, expectedCount] of Object.entries(expected)) {
    const actualCount = actual.filter((r) => r.type === resourceType).length;

    if (actualCount !== expectedCount) {
      errors.push(
        `Resource count mismatch for '${resourceType}': expected ${expectedCount}, got ${actualCount}`
      );
    }
  }

  return errors;
}

/**
 * Validate expected tools were called (optional check).
 */
function validateExpectedTools(
  expectedTools: string[],
  calledTools: string[]
): string[] {
  const errors: string[] = [];

  for (const expectedTool of expectedTools) {
    if (!calledTools.includes(expectedTool)) {
      errors.push(`Expected tool '${expectedTool}' was not called`);
    }
  }

  return errors;
}

/**
 * Extract resource identifiers from tool call results.
 * Parses MCP log entries for resource creation events.
 *
 * TODO: This needs to parse actual MCP logs from scenario execution.
 * Currently returns empty array (placeholder).
 */
export function extractResourcesFromToolCalls(
  toolsCalled: string[],
  logOutput: string
): Array<{ type: string; id: string; name?: string }> {
  const resources: Array<{ type: string; id: string; name?: string }> = [];

  // Parse log output for resource creation patterns
  const lines = logOutput.split('\n');

  for (const line of lines) {
    try {
      const json = JSON.parse(line);

      // Look for tool_call_success events with resource IDs
      if (json.event === 'tool_call_success' && json.output?.resultPreview) {
        const preview = json.output.resultPreview;

        // Extract project IDs (e.g., "p-abc123")
        const projectMatch = preview.match(/"id"\s*:\s*"(p-[a-z0-9]+)"/);
        if (projectMatch) {
          resources.push({
            type: 'project',
            id: projectMatch[1],
            name: extractResourceName(preview, 'project'),
          });
        }

        // Extract app IDs (e.g., "app-xyz789")
        const appMatch = preview.match(/"id"\s*:\s*"(a-[a-z0-9]+)"/);
        if (appMatch) {
          resources.push({
            type: 'app',
            id: appMatch[1],
            name: extractResourceName(preview, 'app'),
          });
        }

        // Extract database IDs (e.g., "db-def456")
        const dbMatch = preview.match(/"id"\s*:\s*"(d-[a-z0-9]+)"/);
        if (dbMatch) {
          resources.push({
            type: 'database',
            id: dbMatch[1],
            name: extractResourceName(preview, 'database'),
          });
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return resources;
}

/**
 * Extract resource name from JSON preview string.
 */
function extractResourceName(
  preview: string,
  resourceType: string
): string | undefined {
  const nameMatch = preview.match(/"(?:description|name)"\s*:\s*"([^"]+)"/);
  return nameMatch ? nameMatch[1] : undefined;
}
