#!/usr/bin/env npx tsx

/**
 * Multi-Run Evaluation Manager
 *
 * Manages multiple evaluation runs with versioning, comparison, and archival.
 *
 * Features:
 * - Create new eval runs with unique IDs and metadata
 * - List all runs with summary statistics
 * - Set active/default run for evals to use
 * - Compare results between runs
 * - Archive old runs
 *
 * Usage:
 *   npx tsx run-manager.ts create --name "baseline-v1" --description "Initial baseline"
 *   npx tsx run-manager.ts list
 *   npx tsx run-manager.ts set-active run-20251219-001
 *   npx tsx run-manager.ts compare run-20251219-001 run-20251219-002
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

interface RunMetadata {
  run_id: string;
  name: string;
  description: string;
  created_at: string;
  completed_at?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'archived';
  domains_executed: string[];
  total_evals_executed: number;
  summary?: {
    total_success: number;
    total_failure: number;
    success_rate: number;
  };
  tags: string[];
  environment?: {
    mcp_server_url?: string;
    oauth_bridge_url?: string;
    mittwald_api_version?: string;
  };
  notes?: string;
}

interface RunIndex {
  active_run_id?: string;
  runs: RunMetadata[];
  last_updated: string;
}

interface RunComparison {
  run_a: string;
  run_b: string;
  generated_at: string;
  summary: {
    improved: number;
    regressed: number;
    unchanged: number;
    new_in_b: number;
    missing_in_b: number;
  };
  differences: Array<{
    tool: string;
    domain: string;
    run_a_success: boolean;
    run_b_success: boolean;
    change_type: 'improved' | 'regressed' | 'unchanged' | 'new' | 'missing';
    notes?: string;
  }>;
}

// ============================================================================
// Path Constants
// ============================================================================

const EVALS_ROOT = path.join(process.cwd(), 'evals');
const RUNS_DIR = path.join(EVALS_ROOT, 'results', 'runs');
const RUN_INDEX_PATH = path.join(RUNS_DIR, 'index.json');
const ACTIVE_RUN_SYMLINK = path.join(EVALS_ROOT, 'results', 'active');

// ============================================================================
// Run Index Management
// ============================================================================

function ensureRunsDirectory(): void {
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

function loadRunIndex(): RunIndex {
  ensureRunsDirectory();

  if (!fs.existsSync(RUN_INDEX_PATH)) {
    const index: RunIndex = {
      runs: [],
      last_updated: new Date().toISOString(),
    };
    saveRunIndex(index);
    return index;
  }

  return JSON.parse(fs.readFileSync(RUN_INDEX_PATH, 'utf-8'));
}

function saveRunIndex(index: RunIndex): void {
  index.last_updated = new Date().toISOString();
  fs.writeFileSync(RUN_INDEX_PATH, JSON.stringify(index, null, 2));
}

// ============================================================================
// Run Creation
// ============================================================================

function generateRunId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `run-${date}-${time}`;
}

function createRun(name: string, description: string, tags: string[] = []): RunMetadata {
  const index = loadRunIndex();
  const runId = generateRunId();

  const metadata: RunMetadata = {
    run_id: runId,
    name,
    description,
    created_at: new Date().toISOString(),
    status: 'in_progress',
    domains_executed: [],
    total_evals_executed: 0,
    tags,
    environment: {
      mcp_server_url: 'https://mittwald-mcp-fly2.fly.dev/mcp',
      oauth_bridge_url: 'https://mittwald-oauth-server.fly.dev',
    },
  };

  // Create run directory
  const runDir = path.join(RUNS_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  // Create domain subdirectories
  const domains = [
    'access-users', 'apps', 'automation', 'backups', 'containers',
    'context', 'databases', 'domains-mail', 'identity', 'misc',
    'organization', 'project-foundation'
  ];

  for (const domain of domains) {
    fs.mkdirSync(path.join(runDir, domain), { recursive: true });
  }

  // Save metadata
  fs.writeFileSync(
    path.join(runDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Add to index
  index.runs.push(metadata);
  saveRunIndex(index);

  console.log(`\nCreated run: ${runId}`);
  console.log(`Name: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`Directory: ${runDir}`);

  return metadata;
}

// ============================================================================
// Run Status Management
// ============================================================================

function setActiveRun(runId: string): void {
  const index = loadRunIndex();
  const run = index.runs.find(r => r.run_id === runId);

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  index.active_run_id = runId;
  saveRunIndex(index);

  // Update symlink
  const targetDir = path.join(RUNS_DIR, runId);

  if (fs.existsSync(ACTIVE_RUN_SYMLINK)) {
    fs.unlinkSync(ACTIVE_RUN_SYMLINK);
  }

  fs.symlinkSync(targetDir, ACTIVE_RUN_SYMLINK, 'dir');

  console.log(`\nActive run set to: ${runId}`);
  console.log(`Name: ${run.name}`);
  console.log(`Symlink: ${ACTIVE_RUN_SYMLINK} -> ${targetDir}`);
}

function getActiveRun(): RunMetadata | null {
  const index = loadRunIndex();

  if (!index.active_run_id) {
    return null;
  }

  return index.runs.find(r => r.run_id === index.active_run_id) || null;
}

function updateRunStatus(
  runId: string,
  updates: Partial<RunMetadata>
): void {
  const index = loadRunIndex();
  const runIndex = index.runs.findIndex(r => r.run_id === runId);

  if (runIndex === -1) {
    throw new Error(`Run not found: ${runId}`);
  }

  const run = index.runs[runIndex];
  Object.assign(run, updates);

  // Update metadata file
  const metadataPath = path.join(RUNS_DIR, runId, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(run, null, 2));

  saveRunIndex(index);
}

// ============================================================================
// Run Listing and Display
// ============================================================================

function listRuns(filter?: { status?: string; tag?: string }): RunMetadata[] {
  const index = loadRunIndex();
  let runs = [...index.runs];

  if (filter?.status) {
    runs = runs.filter(r => r.status === filter.status);
  }

  if (filter?.tag) {
    runs = runs.filter(r => r.tags.includes(filter.tag));
  }

  return runs.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function displayRuns(): void {
  const index = loadRunIndex();
  const runs = listRuns();

  console.log('\n=== Evaluation Runs ===\n');
  console.log(`Total runs: ${runs.length}`);
  console.log(`Active run: ${index.active_run_id || 'none'}\n`);

  if (runs.length === 0) {
    console.log('No runs found. Create one with: run-manager.ts create');
    return;
  }

  for (const run of runs) {
    const isActive = run.run_id === index.active_run_id;
    const marker = isActive ? '➜ ' : '  ';
    const statusEmoji = {
      in_progress: '🔵',
      completed: '✅',
      failed: '❌',
      archived: '📦',
    }[run.status];

    console.log(`${marker}${statusEmoji} ${run.run_id}`);
    console.log(`   Name: ${run.name}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Created: ${run.created_at}`);

    if (run.summary) {
      const rate = run.summary.success_rate.toFixed(1);
      console.log(`   Results: ${run.summary.total_success}/${run.total_evals_executed} (${rate}%)`);
    } else {
      console.log(`   Results: ${run.total_evals_executed} evals executed`);
    }

    if (run.tags.length > 0) {
      console.log(`   Tags: ${run.tags.join(', ')}`);
    }

    console.log();
  }
}

// ============================================================================
// Run Comparison
// ============================================================================

async function compareRuns(runIdA: string, runIdB: string): Promise<RunComparison> {
  const runA = loadRunIndex().runs.find(r => r.run_id === runIdA);
  const runB = loadRunIndex().runs.find(r => r.run_id === runIdB);

  if (!runA || !runB) {
    throw new Error('One or both runs not found');
  }

  const resultsA = await loadRunResults(runIdA);
  const resultsB = await loadRunResults(runIdB);

  const comparison: RunComparison = {
    run_a: runIdA,
    run_b: runIdB,
    generated_at: new Date().toISOString(),
    summary: {
      improved: 0,
      regressed: 0,
      unchanged: 0,
      new_in_b: 0,
      missing_in_b: 0,
    },
    differences: [],
  };

  // Build tool sets
  const toolsA = new Set(Array.from(resultsA.keys()));
  const toolsB = new Set(Array.from(resultsB.keys()));
  const allTools = new Set([...toolsA, ...toolsB]);

  for (const tool of allTools) {
    const resultA = resultsA.get(tool);
    const resultB = resultsB.get(tool);

    if (!resultA && resultB) {
      comparison.summary.new_in_b++;
      comparison.differences.push({
        tool,
        domain: resultB.domain || 'unknown',
        run_a_success: false,
        run_b_success: resultB.success,
        change_type: 'new',
      });
    } else if (resultA && !resultB) {
      comparison.summary.missing_in_b++;
      comparison.differences.push({
        tool,
        domain: resultA.domain || 'unknown',
        run_a_success: resultA.success,
        run_b_success: false,
        change_type: 'missing',
      });
    } else if (resultA && resultB) {
      const aSuccess = resultA.success;
      const bSuccess = resultB.success;

      let changeType: 'improved' | 'regressed' | 'unchanged';

      if (aSuccess === bSuccess) {
        changeType = 'unchanged';
        comparison.summary.unchanged++;
      } else if (!aSuccess && bSuccess) {
        changeType = 'improved';
        comparison.summary.improved++;
      } else {
        changeType = 'regressed';
        comparison.summary.regressed++;
      }

      comparison.differences.push({
        tool,
        domain: resultB.domain || resultA.domain || 'unknown',
        run_a_success: aSuccess,
        run_b_success: bSuccess,
        change_type: changeType,
      });
    }
  }

  return comparison;
}

async function loadRunResults(runId: string): Promise<Map<string, any>> {
  const runDir = path.join(RUNS_DIR, runId);
  const results = new Map();

  if (!fs.existsSync(runDir)) {
    throw new Error(`Run directory not found: ${runDir}`);
  }

  // Read all domain subdirectories
  const entries = fs.readdirSync(runDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'sessions') {
      const domainDir = path.join(runDir, entry.name);
      const files = fs.readdirSync(domainDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const content = JSON.parse(
            fs.readFileSync(path.join(domainDir, file), 'utf-8')
          );

          if (content.tool_executed) {
            results.set(content.tool_executed, {
              ...content,
              domain: entry.name,
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return results;
}

function displayComparison(comparison: RunComparison): void {
  console.log('\n=== Run Comparison ===\n');
  console.log(`Run A: ${comparison.run_a}`);
  console.log(`Run B: ${comparison.run_b}`);
  console.log(`Generated: ${comparison.generated_at}\n`);

  console.log('Summary:');
  console.log(`  ✅ Improved: ${comparison.summary.improved}`);
  console.log(`  ❌ Regressed: ${comparison.summary.regressed}`);
  console.log(`  ➡️  Unchanged: ${comparison.summary.unchanged}`);
  console.log(`  🆕 New in B: ${comparison.summary.new_in_b}`);
  console.log(`  ⚠️  Missing in B: ${comparison.summary.missing_in_b}\n`);

  // Show regressions first (most important)
  const regressions = comparison.differences.filter(d => d.change_type === 'regressed');
  if (regressions.length > 0) {
    console.log('🚨 Regressions:');
    for (const diff of regressions) {
      console.log(`  - ${diff.tool} (${diff.domain})`);
    }
    console.log();
  }

  // Show improvements
  const improvements = comparison.differences.filter(d => d.change_type === 'improved');
  if (improvements.length > 0) {
    console.log('🎉 Improvements:');
    for (const diff of improvements) {
      console.log(`  - ${diff.tool} (${diff.domain})`);
    }
    console.log();
  }

  // Show new tools
  const newTools = comparison.differences.filter(d => d.change_type === 'new');
  if (newTools.length > 0) {
    console.log('🆕 New Tools:');
    for (const diff of newTools) {
      console.log(`  - ${diff.tool} (${diff.domain})`);
    }
    console.log();
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create': {
      const nameIdx = args.indexOf('--name');
      const descIdx = args.indexOf('--description');
      const tagsIdx = args.indexOf('--tags');
      const setActive = args.includes('--set-active');

      const name = nameIdx >= 0 ? args[nameIdx + 1] : 'Unnamed Run';
      const description = descIdx >= 0 ? args[descIdx + 1] : '';
      const tags = tagsIdx >= 0 ? args[tagsIdx + 1].split(',') : [];

      const metadata = createRun(name, description, tags);

      if (setActive) {
        setActiveRun(metadata.run_id);
      }

      console.log('\nUse this run for evals with:');
      console.log(`  npx tsx run-manager.ts set-active ${metadata.run_id}`);
      break;
    }

    case 'list': {
      displayRuns();
      break;
    }

    case 'set-active': {
      const runId = args[1];
      if (!runId) {
        console.error('Error: run_id required');
        console.error('Usage: run-manager.ts set-active <run_id>');
        process.exit(1);
      }
      setActiveRun(runId);
      break;
    }

    case 'get-active': {
      const run = getActiveRun();
      if (run) {
        console.log(JSON.stringify(run, null, 2));
      } else {
        console.error('No active run set');
        process.exit(1);
      }
      break;
    }

    case 'compare': {
      const runA = args[1];
      const runB = args[2];

      if (!runA || !runB) {
        console.error('Error: two run_ids required');
        console.error('Usage: run-manager.ts compare <run_id_a> <run_id_b>');
        process.exit(1);
      }

      const comparison = await compareRuns(runA, runB);
      displayComparison(comparison);

      // Save comparison report
      const comparisonPath = path.join(
        RUNS_DIR,
        `comparison-${runA}-vs-${runB}.json`
      );
      fs.writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));
      console.log(`\nComparison saved to: ${comparisonPath}`);
      break;
    }

    case 'update-status': {
      const runId = args[1];
      const status = args[2] as RunMetadata['status'];

      if (!runId || !status) {
        console.error('Error: run_id and status required');
        console.error('Usage: run-manager.ts update-status <run_id> <status>');
        process.exit(1);
      }

      updateRunStatus(runId, { status });
      console.log(`Updated ${runId} status to: ${status}`);
      break;
    }

    default: {
      console.log('Multi-Run Evaluation Manager\n');
      console.log('Usage:');
      console.log('  create --name <name> --description <desc> [--tags tag1,tag2] [--set-active]');
      console.log('  list');
      console.log('  set-active <run_id>');
      console.log('  get-active');
      console.log('  compare <run_id_a> <run_id_b>');
      console.log('  update-status <run_id> <status>');
      console.log('\nExamples:');
      console.log('  npx tsx run-manager.ts create --name "baseline-v1" --description "Initial baseline" --set-active');
      console.log('  npx tsx run-manager.ts list');
      console.log('  npx tsx run-manager.ts compare run-20251219-001 run-20251219-002');
      process.exit(command ? 1 : 0);
    }
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

export {
  createRun,
  setActiveRun,
  getActiveRun,
  listRuns,
  updateRunStatus,
  compareRuns,
  loadRunResults,
  type RunMetadata,
  type RunIndex,
  type RunComparison,
};
