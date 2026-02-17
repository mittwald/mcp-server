#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

interface Summary {
  runId: string;
  generatedAt: string;
  outputDir: string;
  options: {
    agents: string[];
    coverageMode: 'all-agents' | 'any-agent';
    requireCoverage: number;
  };
  counts: {
    totalTools: number;
    coveredTools: number;
    toolCoveragePercent: number;
    totalCaseRuns: number;
    passedCaseRuns: number;
    failedCaseRuns: number;
    matrixCoveragePercent: number;
  };
  perAgent: Record<
    string,
    {
      total: number;
      passed: number;
      failed: number;
      coveragePercent: number;
    }
  >;
  gate: {
    passed: boolean;
    reasons: string[];
    requiredCoverage: number;
    mode: 'all-agents' | 'any-agent';
  };
}

function toAbsolute(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function parseArgs(argv: string[]): {
  outputDir: string;
  runId?: string;
} {
  const parsed = {
    outputDir: toAbsolute('evals/results/agent-e2e'),
    runId: undefined as string | undefined,
  };

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    const [rawKey, rawValue] = arg.slice(2).split('=', 2);
    const key = rawKey.trim();
    const value = rawValue?.trim();

    switch (key) {
      case 'output-dir':
        if (!value) throw new Error('--output-dir requires a value');
        parsed.outputDir = toAbsolute(value);
        break;
      case 'run-id':
        if (!value) throw new Error('--run-id requires a value');
        parsed.runId = value;
        break;
      default:
        throw new Error(`Unknown flag: --${key}`);
    }
  }

  return parsed;
}

function latestRunId(outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory not found: ${outputDir}`);
  }

  const entries = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('agent-e2e-'))
    .map((entry) => entry.name)
    .sort();

  if (entries.length === 0) {
    throw new Error(`No runs found in ${outputDir}`);
  }

  return entries[entries.length - 1];
}

function loadSummary(outputDir: string, runId?: string): Summary {
  const resolvedRunId = runId ?? latestRunId(outputDir);
  const summaryPath = path.join(outputDir, resolvedRunId, 'summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Summary file not found: ${summaryPath}`);
  }
  return JSON.parse(fs.readFileSync(summaryPath, 'utf-8')) as Summary;
}

function printReport(summary: Summary): void {
  console.log(`\nAgent E2E Run: ${summary.runId}`);
  console.log(`Generated: ${summary.generatedAt}`);
  console.log(`Agents: ${summary.options.agents.join(', ')}`);
  console.log(`Coverage mode: ${summary.options.coverageMode}`);
  console.log(`Required coverage: ${summary.options.requireCoverage}%`);
  console.log(`Gate: ${summary.gate.passed ? 'PASS' : 'FAIL'}`);

  console.log('\nCoverage:');
  console.log(
    `  Tool coverage: ${summary.counts.toolCoveragePercent}% (${summary.counts.coveredTools}/${summary.counts.totalTools})`
  );
  console.log(
    `  Matrix coverage: ${summary.counts.matrixCoveragePercent}% (${summary.counts.passedCaseRuns}/${summary.counts.totalCaseRuns})`
  );

  console.log('\nPer-agent:');
  for (const [agent, stats] of Object.entries(summary.perAgent)) {
    console.log(
      `  ${agent}: ${stats.coveragePercent}% (${stats.passed}/${stats.total}, failed ${stats.failed})`
    );
  }

  if (!summary.gate.passed && summary.gate.reasons.length > 0) {
    console.log('\nGate reasons:');
    for (const reason of summary.gate.reasons) {
      console.log(`  - ${reason}`);
    }
  }

  console.log(`\nSummary path: ${path.join(summary.outputDir, 'summary.json')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const summary = loadSummary(args.outputDir, args.runId);
    printReport(summary);
    process.exit(summary.gate.passed ? 0 : 1);
  } catch (error) {
    console.error(
      `Failed to load agent E2E report: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}
