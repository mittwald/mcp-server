import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { loadScenario } from './scenario-loader.js';
import {
  validateOutcome,
  extractResourcesFromToolCalls,
} from './scenario-validator.js';
import { getTestTarget, DEFAULT_TARGET, type TestTarget } from '../config/test-targets.js';
import { checkPrerequisites, exitWithPrerequisiteErrors } from './check-prerequisites.js';
import { fetchToolCallLogs, extractToolNames } from './log-fetcher.js';
import { validateScenarioOutcome } from './outcome-validator.js';
import { updateValidationRecords } from './coverage-tracker.js';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ScenarioExecutionResult } from '../../src/types/scenario-execution.js';

/**
 * Scenario runner that executes prompts via Claude Code CLI.
 * Tracks tool calls from MCP structured logs (WP01).
 *
 * Multi-target support: Tests can run against local, Fly.io, or mittwald.de
 * by specifying --target flag.
 */

interface ScenarioRunnerOptions {
  scenarioId: string;
  scenarioDir?: string;
  keepResources?: boolean; // Skip cleanup for debugging
  outputPath?: string; // Override default result path
  timeout?: number; // Timeout per prompt (ms, default: 120000)
  target?: string; // Test target: 'local' | 'flyio' | 'mittwald' (default: 'local')
}

/**
 * Execute a scenario end-to-end.
 * @returns ScenarioExecutionResult
 */
export async function runScenario(
  options: ScenarioRunnerOptions
): Promise<ScenarioExecutionResult> {
  const {
    scenarioId,
    scenarioDir = 'evals/scenarios/case-studies',
    keepResources = false,
    outputPath,
    timeout = 120000,
    target: targetName,
  } = options;

  // Get test target (default: local)
  const target: TestTarget = targetName
    ? getTestTarget(targetName)
    : DEFAULT_TARGET;

  console.log(`\n🎯 Test Target: ${target.displayName}`);

  // Run pre-flight checks for this target
  const prerequisitesResult = await checkPrerequisites(target);
  if (!prerequisitesResult.passed) {
    exitWithPrerequisiteErrors(target, prerequisitesResult);
  }

  // Load scenario definition
  const scenario = loadScenario(scenarioId, scenarioDir);

  console.log(`\nRunning scenario: ${scenario.name} (${scenarioId})`);
  console.log(`Prompts: ${scenario.prompts.length}`);

  const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`;
  const sessionId = `session-${runId}`;
  const startTime = Date.now();

  const result: ScenarioExecutionResult = {
    scenario_id: scenarioId,
    run_id: runId,
    executed_at: new Date().toISOString(),
    target: target.name,
    status: 'success',
    tools_called: [],
    execution_time_ms: 0,
    resources_created: [],
    cleanup_performed: false,
  };

  let fullLogOutput = '';

  try {
    // Execute prompts sequentially
    for (let i = 0; i < scenario.prompts.length; i++) {
      const prompt = scenario.prompts[i];
      console.log(`\nPrompt ${i + 1}/${scenario.prompts.length}:`);
      console.log(`  "${prompt}"`);

      const { toolsCalled, logOutput } = await executePrompt(prompt, timeout);
      result.tools_called.push(...toolsCalled);
      fullLogOutput += logOutput + '\n';

      console.log(`  Tools called: ${toolsCalled.join(', ')}`);
    }

    // Fetch tool call logs from the appropriate source (target-specific)
    console.log(`\n📊 Fetching tool call logs from ${target.logSource}...`);
    const logs = await fetchToolCallLogs(target, sessionId, fullLogOutput);
    const toolNamesFromLogs = extractToolNames(logs);

    if (toolNamesFromLogs.length > 0) {
      console.log(`  Tools from logs: ${toolNamesFromLogs.join(', ')}`);
      // Use logs as authoritative source if available
      result.tools_called = toolNamesFromLogs;
    }

    // Extract resources created (parse from MCP logs or tool call results)
    result.resources_created = extractResourcesFromToolCalls(
      result.tools_called,
      fullLogOutput
    );

    // Validate outcome using appropriate method for target
    if (target.logSource === 'outcome-validation') {
      // For mittwald.de: Use outcome validator with `mw` CLI
      console.log(`\n🔍 Validating outcome using mw CLI...`);
      const outcomeResult = await validateScenarioOutcome(scenario, target);
      result.outcome_validation = {
        all_passed: outcomeResult.allPassed,
        checks: outcomeResult.checks,
        errors: outcomeResult.errors,
        expected_tools: outcomeResult.expectedTools,
      };

      if (!outcomeResult.allPassed) {
        result.status = 'failure';
        result.failure_details = {
          failed_tool: 'outcome_validation',
          error_message: `Outcome validation failed: ${outcomeResult.errors.join(', ')}`,
          context: { validation_checks: outcomeResult.checks },
        };
      }

      // For mittwald.de, use expected_tools if outcome passed
      if (outcomeResult.allPassed && outcomeResult.expectedTools) {
        result.tools_called = outcomeResult.expectedTools;
      }
    } else {
      // For local/Fly.io: Use traditional validation
      const validation = validateOutcome(scenario, result);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
        result.status = 'failure';
        result.failure_details = {
          failed_tool: 'validation',
          error_message: `Validation failed: ${validation.errors.join(', ')}`,
          context: { validation_errors: validation.errors },
        };
      }
    }

    // Perform cleanup
    if (!keepResources && scenario.cleanup && result.status === 'success') {
      console.log('\nPerforming cleanup...');
      try {
        for (const cleanupPrompt of scenario.cleanup) {
          await executePrompt(cleanupPrompt, timeout);
        }
        result.cleanup_performed = true;
      } catch (cleanupError) {
        result.cleanup_errors = [
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
        ];
        console.error('Cleanup failed:', result.cleanup_errors);
      }
    } else if (keepResources) {
      console.log('\nSkipping cleanup (--keep-resources flag)');
    }

    if (result.status !== 'failure') {
      result.status = 'success';
    }
  } catch (error) {
    result.status = 'failure';
    result.failure_details = {
      failed_tool: 'unknown', // Extract from error context
      error_message: error instanceof Error ? error.message : String(error),
      context: {},
    };
    console.error('Scenario execution failed:', error);
  }

  result.execution_time_ms = Date.now() - startTime;

  // Save result
  const resultPath =
    outputPath ||
    getDefaultResultPath(runId, scenarioId, result.status);
  saveResult(result, resultPath);
  result.log_file_path = resultPath;

  // Update tool validation records
  updateValidationRecords(result);

  console.log(`\nScenario ${result.status}: ${scenarioId}`);
  console.log(`Execution time: ${result.execution_time_ms}ms`);
  console.log(`Tools called: ${result.tools_called.length}`);
  console.log(`Result saved: ${resultPath}`);

  return result;
}

/**
 * Execute a single prompt via Claude Code CLI.
 * @returns Object with tool names called and log output
 */
async function executePrompt(
  prompt: string,
  timeout: number
): Promise<{ toolsCalled: string[]; logOutput: string }> {
  return new Promise((resolve, reject) => {
    const toolsCalled: string[] = [];

    // Spawn Claude Code CLI as subprocess
    const child = spawn('claude', ['--message', prompt], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Parse tool calls from stdout (MCP logs)
        const toolsFromLogs = parseToolCallsFromOutput(stdout);
        resolve({ toolsCalled: toolsFromLogs, logOutput: stdout });
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
    });

    // Timeout handler
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        reject(new Error(`Prompt execution timeout (${timeout}ms)`));
      }
    }, timeout);
  });
}

/**
 * Parse tool calls from Claude CLI output (MCP structured logs).
 * Looks for JSON log entries with event: 'tool_call_success' or 'tool_call_error'.
 */
function parseToolCallsFromOutput(output: string): string[] {
  const tools: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      if (
        json.event === 'tool_call_success' ||
        json.event === 'tool_call_error'
      ) {
        if (json.toolName) {
          tools.push(json.toolName);
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return tools;
}

/**
 * Save scenario execution result to JSON file.
 */
function saveResult(
  result: ScenarioExecutionResult,
  filePath: string
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
}

/**
 * Get default result file path.
 */
function getDefaultResultPath(
  runId: string,
  scenarioId: string,
  status: string
): string {
  return path.join(
    process.cwd(),
    'evals',
    'results',
    'scenarios',
    runId,
    `${scenarioId}-${status}.json`
  );
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/scenario-runner.ts <scenario-id> [--keep-resources] [--target=local|flyio|mittwald]
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const scenarioId = process.argv[2];
  const keepResources = process.argv.includes('--keep-resources');

  // Parse --target flag
  const targetFlag = process.argv.find(arg => arg.startsWith('--target='));
  const target = targetFlag ? targetFlag.split('=')[1] : undefined;

  if (!scenarioId) {
    console.error(
      'Usage: tsx evals/scripts/scenario-runner.ts <scenario-id> [--keep-resources] [--target=local|flyio|mittwald]'
    );
    process.exit(1);
  }

  runScenario({ scenarioId, keepResources, target })
    .then((result) => {
      process.exit(result.status === 'success' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
