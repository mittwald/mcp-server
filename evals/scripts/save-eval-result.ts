#!/usr/bin/env npx tsx

/**
 * Save Eval Result to Active Run
 *
 * Helper script for agents to save eval results to the currently active run.
 * Can be used during WP execution to save individual eval results.
 *
 * Usage:
 *   npx tsx save-eval-result.ts --tool <tool-name> --domain <domain> --result <json-file>
 *   npx tsx save-eval-result.ts --tool app-list --domain apps --result result.json
 *   npx tsx save-eval-result.ts --tool app-list --domain apps --json '{"success": true, ...}'
 */

import * as fs from 'fs';
import * as path from 'path';
import { getActiveRun } from './run-manager.js';

const EVALS_ROOT = path.join(process.cwd(), 'evals');
const RUNS_DIR = path.join(EVALS_ROOT, 'results', 'runs');

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: any[];
  resources_created: any[];
  tool_response_summary?: string;
  execution_notes?: string;
}

function parseArgs(): {
  toolName: string;
  domain: string;
  result?: string;
  json?: string;
  runId?: string;
} {
  const args = process.argv.slice(2);
  const parsed: any = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    parsed[key] = value;
  }

  if (!parsed.tool || !parsed.domain) {
    console.error('Error: --tool and --domain are required');
    console.error('Usage: save-eval-result.ts --tool <name> --domain <domain> --result <file>');
    process.exit(1);
  }

  if (!parsed.result && !parsed.json) {
    console.error('Error: either --result or --json is required');
    process.exit(1);
  }

  return {
    toolName: parsed.tool,
    domain: parsed.domain,
    result: parsed.result,
    json: parsed.json,
    runId: parsed.run,
  };
}

function loadResult(resultPath?: string, jsonStr?: string): SelfAssessment {
  let data: any;

  if (jsonStr) {
    data = JSON.parse(jsonStr);
  } else if (resultPath) {
    if (!fs.existsSync(resultPath)) {
      throw new Error(`Result file not found: ${resultPath}`);
    }
    data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
  } else {
    throw new Error('No result data provided');
  }

  // Validate required fields
  if (!data.success === undefined || !data.tool_executed) {
    throw new Error('Invalid self-assessment: missing required fields (success, tool_executed)');
  }

  return data as SelfAssessment;
}

async function main() {
  const { toolName, domain, result, json, runId: specifiedRunId } = parseArgs();

  // Determine which run to use
  let runId = specifiedRunId;
  if (!runId) {
    const activeRun = getActiveRun();
    if (!activeRun) {
      console.error('Error: No active run set and no --run specified');
      console.error('Set active run with: npx tsx run-manager.ts set-active <run-id>');
      process.exit(1);
    }
    runId = activeRun.run_id;
  }

  // Load and validate result
  const assessment = loadResult(result, json);

  // Ensure domain directory exists
  const domainDir = path.join(RUNS_DIR, runId, domain);
  if (!fs.existsSync(domainDir)) {
    fs.mkdirSync(domainDir, { recursive: true });
  }

  // Save result file
  const resultFileName = `${toolName}-result.json`;
  const resultPath = path.join(domainDir, resultFileName);

  fs.writeFileSync(resultPath, JSON.stringify(assessment, null, 2));

  console.log(`\n✅ Saved eval result:`);
  console.log(`   Run: ${runId}`);
  console.log(`   Tool: ${assessment.tool_executed}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Success: ${assessment.success}`);
  console.log(`   File: ${resultPath}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
