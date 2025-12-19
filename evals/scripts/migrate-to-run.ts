#!/usr/bin/env npx tsx

/**
 * Migrate Flat Results to Run Structure
 *
 * Moves eval results from flat structure (evals/results/{domain}/)
 * to the active run directory (evals/results/runs/{run-id}/{domain}/)
 *
 * Usage:
 *   npx tsx migrate-to-run.ts [--run run-id] [--dry-run] [--force]
 */

import * as fs from 'fs';
import * as path from 'path';
import { getActiveRun } from './run-manager.js';

const EVALS_ROOT = path.join(process.cwd(), 'evals');
const RESULTS_DIR = path.join(EVALS_ROOT, 'results');
const RUNS_DIR = path.join(RESULTS_DIR, 'runs');

const DOMAINS = [
  'access-users',
  'apps',
  'automation',
  'backups',
  'containers',
  'context',
  'databases',
  'domains-mail',
  'identity',
  'misc',
  'organization',
  'project-foundation',
];

interface MigrationStats {
  total_found: number;
  migrated: number;
  skipped: number;
  errors: number;
  by_domain: Record<string, number>;
}

async function migrateResults(runId: string, dryRun: boolean, force: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total_found: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    by_domain: {},
  };

  const runDir = path.join(RUNS_DIR, runId);

  if (!fs.existsSync(runDir)) {
    throw new Error(`Run directory not found: ${runDir}`);
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migrating results to run: ${runId}`);
  console.log(`Target: ${runDir}\n`);

  for (const domain of DOMAINS) {
    const flatDir = path.join(RESULTS_DIR, domain);
    const runDomainDir = path.join(runDir, domain);

    if (!fs.existsSync(flatDir)) {
      continue;
    }

    // Ensure run domain directory exists
    if (!dryRun && !fs.existsSync(runDomainDir)) {
      fs.mkdirSync(runDomainDir, { recursive: true });
    }

    // Find all result JSON files
    const files = fs.readdirSync(flatDir).filter(f => f.endsWith('-result.json'));

    if (files.length === 0) {
      continue;
    }

    console.log(`📁 ${domain}: ${files.length} files`);
    stats.by_domain[domain] = 0;

    for (const file of files) {
      const sourcePath = path.join(flatDir, file);
      const targetPath = path.join(runDomainDir, file);

      stats.total_found++;

      // Check if target already exists
      if (fs.existsSync(targetPath) && !force) {
        console.log(`   ⏭️  ${file} (already exists, use --force to overwrite)`);
        stats.skipped++;
        continue;
      }

      try {
        // Validate JSON before copying
        const content = fs.readFileSync(sourcePath, 'utf-8');
        JSON.parse(content); // Throws if invalid

        if (!dryRun) {
          fs.copyFileSync(sourcePath, targetPath);
        }

        console.log(`   ${dryRun ? '🔍' : '✅'} ${file}`);
        stats.migrated++;
        stats.by_domain[domain]++;
      } catch (e) {
        console.log(`   ❌ ${file} (error: ${e instanceof Error ? e.message : String(e)})`);
        stats.errors++;
      }
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);

  const runIdx = args.indexOf('--run');
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  let runId: string | undefined;

  if (runIdx >= 0) {
    runId = args[runIdx + 1];
  } else {
    const activeRun = getActiveRun();
    if (!activeRun) {
      console.error('Error: No active run set and no --run specified');
      console.error('Usage: migrate-to-run.ts [--run run-id] [--dry-run] [--force]');
      process.exit(1);
    }
    runId = activeRun.run_id;
  }

  const stats = await migrateResults(runId, dryRun, force);

  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files found: ${stats.total_found}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('');
  console.log('By domain:');
  for (const [domain, count] of Object.entries(stats.by_domain)) {
    console.log(`  ${domain}: ${count}`);
  }
  console.log('');

  if (dryRun) {
    console.log('🔍 This was a dry run. No files were actually migrated.');
    console.log('Remove --dry-run to perform the migration.');
  } else {
    console.log('✅ Migration complete!');
    console.log(`Results are now in: evals/results/runs/${runId}/`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
