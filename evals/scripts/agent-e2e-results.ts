#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

type AgentName = 'claude' | 'codex' | 'opencode';
type AgentToolStatus = 'success' | 'failure' | 'not_run';

interface ToolEntry {
  toolName: string;
  byAgent?: Record<string, AgentToolStatus>;
}

interface RunSummary {
  runId: string;
  generatedAt: string;
  options?: {
    agents?: string[];
  };
  counts?: {
    totalCaseRuns?: number;
    passedCaseRuns?: number;
    failedCaseRuns?: number;
    totalTools?: number;
    coveredTools?: number;
    toolCoveragePercent?: number;
  };
  gate?: {
    passed?: boolean;
  };
  perTool?: ToolEntry[];
}

interface ParsedArgs {
  resultsDir: string;
  agent: AgentName;
  json: boolean;
  maxToolList: number;
}

interface RunRow {
  runId: string;
  generatedAt: string;
  totalTools: number;
  coveredTools: number;
  toolCoveragePercent: number;
  totalCaseRuns: number;
  passedCaseRuns: number;
  failedCaseRuns: number;
  gatePassed: boolean;
}

interface AggregateReport {
  agent: AgentName;
  resultsDir: string;
  runs: {
    total: number;
    withCases: number;
    withoutCases: number;
  };
  latestRun?: RunRow;
  latestRunWithCases?: RunRow;
  bestRunByCoverage?: RunRow;
  largestRunWithCases?: RunRow;
  cumulative: {
    universeListedTools: number;
    attemptedTools: number;
    successfulTools: number;
    attemptedButNeverSuccessful: number;
    neverAttemptedFromUniverse: number;
    successCoverageAcrossUniversePercent: number;
  };
  attemptedButNeverSuccessfulTools: string[];
  runsTable: RunRow[];
}

function toAbsolute(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function parseIntArg(value: string, key: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${key}: ${value}`);
  }
  return parsed;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    resultsDir: toAbsolute('evals/results/agent-e2e'),
    agent: 'claude',
    json: false,
    maxToolList: 25,
  };

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    const [rawKey, rawValue] = arg.slice(2).split('=', 2);
    const key = rawKey.trim();
    const value = rawValue?.trim();

    switch (key) {
      case 'results-dir':
        if (!value) throw new Error('--results-dir requires a value');
        args.resultsDir = toAbsolute(value);
        break;
      case 'agent':
        if (!value) throw new Error('--agent requires a value');
        if (value !== 'claude' && value !== 'codex' && value !== 'opencode') {
          throw new Error("Invalid --agent value. Use one of: claude, codex, opencode");
        }
        args.agent = value;
        break;
      case 'json':
        args.json = true;
        break;
      case 'max-tool-list':
        if (!value) throw new Error('--max-tool-list requires a value');
        args.maxToolList = parseIntArg(value, '--max-tool-list');
        break;
      default:
        throw new Error(`Unknown flag: --${key}`);
    }
  }

  return args;
}

function safeReadJson(filePath: string): RunSummary | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RunSummary;
    if (typeof parsed.runId !== 'string') {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function getRunRows(
  resultsDir: string,
  agent: AgentName
): { rows: RunRow[]; summaries: RunSummary[] } {
  if (!fs.existsSync(resultsDir)) {
    throw new Error(`Results directory not found: ${resultsDir}`);
  }

  const runDirs = fs
    .readdirSync(resultsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('agent-e2e-'))
    .map((entry) => entry.name)
    .sort();

  const rows: RunRow[] = [];
  const summaries: RunSummary[] = [];

  for (const runId of runDirs) {
    const summaryPath = path.join(resultsDir, runId, 'summary.json');
    if (!fs.existsSync(summaryPath)) continue;

    const summary = safeReadJson(summaryPath);
    if (!summary) continue;

    const agents = summary.options?.agents ?? [];
    if (!agents.includes(agent)) continue;

    summaries.push(summary);

    rows.push({
      runId: summary.runId,
      generatedAt: summary.generatedAt,
      totalTools: summary.counts?.totalTools ?? 0,
      coveredTools: summary.counts?.coveredTools ?? 0,
      toolCoveragePercent: summary.counts?.toolCoveragePercent ?? 0,
      totalCaseRuns: summary.counts?.totalCaseRuns ?? 0,
      passedCaseRuns: summary.counts?.passedCaseRuns ?? 0,
      failedCaseRuns: summary.counts?.failedCaseRuns ?? 0,
      gatePassed: Boolean(summary.gate?.passed),
    });
  }

  rows.sort((a, b) => a.runId.localeCompare(b.runId));
  return { rows, summaries };
}

function buildAggregate(
  resultsDir: string,
  agent: AgentName,
  rows: RunRow[],
  summaries: RunSummary[]
): AggregateReport {
  const withCases = rows.filter((row) => row.totalCaseRuns > 0);

  const latestRun = rows.at(-1);
  const latestRunWithCases = withCases.at(-1);
  const bestRunByCoverage = withCases
    .slice()
    .sort((a, b) => {
      if (b.toolCoveragePercent !== a.toolCoveragePercent) {
        return b.toolCoveragePercent - a.toolCoveragePercent;
      }
      if (b.totalTools !== a.totalTools) {
        return b.totalTools - a.totalTools;
      }
      return b.runId.localeCompare(a.runId);
    })
    .at(0);
  const largestRunWithCases = withCases
    .slice()
    .sort((a, b) => {
      if (b.totalTools !== a.totalTools) {
        return b.totalTools - a.totalTools;
      }
      if (b.toolCoveragePercent !== a.toolCoveragePercent) {
        return b.toolCoveragePercent - a.toolCoveragePercent;
      }
      return b.runId.localeCompare(a.runId);
    })
    .at(0);

  const universeListedTools = new Set<string>();
  const attemptedTools = new Set<string>();
  const successfulTools = new Set<string>();

  for (const summary of summaries) {
    for (const tool of summary.perTool ?? []) {
      universeListedTools.add(tool.toolName);
    }
  }

  for (const summary of summaries) {
    const totalCaseRuns = summary.counts?.totalCaseRuns ?? 0;
    if (totalCaseRuns <= 0) continue;

    for (const tool of summary.perTool ?? []) {
      const status = tool.byAgent?.[agent];
      if (status === 'success') {
        attemptedTools.add(tool.toolName);
        successfulTools.add(tool.toolName);
      } else if (status === 'failure') {
        attemptedTools.add(tool.toolName);
      }
    }
  }

  const attemptedButNeverSuccessfulTools = Array.from(attemptedTools).filter(
    (toolName) => !successfulTools.has(toolName)
  );
  attemptedButNeverSuccessfulTools.sort();

  const successCoverageAcrossUniversePercent =
    universeListedTools.size === 0
      ? 0
      : Number(
          ((successfulTools.size / universeListedTools.size) * 100).toFixed(2)
        );

  return {
    agent,
    resultsDir,
    runs: {
      total: rows.length,
      withCases: withCases.length,
      withoutCases: rows.length - withCases.length,
    },
    latestRun,
    latestRunWithCases,
    bestRunByCoverage,
    largestRunWithCases,
    cumulative: {
      universeListedTools: universeListedTools.size,
      attemptedTools: attemptedTools.size,
      successfulTools: successfulTools.size,
      attemptedButNeverSuccessful: attemptedButNeverSuccessfulTools.length,
      neverAttemptedFromUniverse: Math.max(
        universeListedTools.size - attemptedTools.size,
        0
      ),
      successCoverageAcrossUniversePercent,
    },
    attemptedButNeverSuccessfulTools,
    runsTable: rows,
  };
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function printHuman(report: AggregateReport, maxToolList: number): void {
  console.log(`\nAgent E2E Results (${report.agent})`);
  console.log(`Results dir: ${report.resultsDir}`);
  console.log(
    `Runs: ${report.runs.total} total (${report.runs.withCases} with cases, ${report.runs.withoutCases} preflight/empty)`
  );

  if (report.latestRun) {
    console.log(
      `Latest run: ${report.latestRun.runId} | tools ${report.latestRun.coveredTools}/${report.latestRun.totalTools} (${formatPercent(report.latestRun.toolCoveragePercent)}) | cases ${report.latestRun.passedCaseRuns}/${report.latestRun.totalCaseRuns} | gate ${report.latestRun.gatePassed ? 'PASS' : 'FAIL'}`
    );
  }

  if (report.latestRunWithCases) {
    console.log(
      `Latest run with cases: ${report.latestRunWithCases.runId} | tools ${report.latestRunWithCases.coveredTools}/${report.latestRunWithCases.totalTools} (${formatPercent(report.latestRunWithCases.toolCoveragePercent)})`
    );
  }

  if (report.bestRunByCoverage) {
    console.log(
      `Best run with cases: ${report.bestRunByCoverage.runId} | tools ${report.bestRunByCoverage.coveredTools}/${report.bestRunByCoverage.totalTools} (${formatPercent(report.bestRunByCoverage.toolCoveragePercent)})`
    );
  }
  if (report.largestRunWithCases) {
    console.log(
      `Largest run with cases: ${report.largestRunWithCases.runId} | tools ${report.largestRunWithCases.coveredTools}/${report.largestRunWithCases.totalTools} (${formatPercent(report.largestRunWithCases.toolCoveragePercent)})`
    );
  }

  console.log('\nCumulative across all runs with case executions:');
  console.log(
    `  Successful tools: ${report.cumulative.successfulTools}/${report.cumulative.universeListedTools} (${formatPercent(report.cumulative.successCoverageAcrossUniversePercent)})`
  );
  console.log(`  Attempted tools: ${report.cumulative.attemptedTools}`);
  console.log(
    `  Attempted but never successful: ${report.cumulative.attemptedButNeverSuccessful}`
  );
  console.log(
    `  Never attempted (from listed universe): ${report.cumulative.neverAttemptedFromUniverse}`
  );

  if (report.attemptedButNeverSuccessfulTools.length > 0) {
    const shown = report.attemptedButNeverSuccessfulTools.slice(0, maxToolList);
    console.log('\nAttempted but never successful tools:');
    for (const toolName of shown) {
      console.log(`  - ${toolName}`);
    }
    if (report.attemptedButNeverSuccessfulTools.length > shown.length) {
      console.log(
        `  ... and ${report.attemptedButNeverSuccessfulTools.length - shown.length} more (increase --max-tool-list to show all)`
      );
    }
  }

  console.log('\nRun table (chronological):');
  for (const row of report.runsTable) {
    console.log(
      `  ${row.runId} | tools ${row.coveredTools}/${row.totalTools} (${formatPercent(row.toolCoveragePercent)}) | cases ${row.passedCaseRuns}/${row.totalCaseRuns} | failed ${row.failedCaseRuns} | gate ${row.gatePassed ? 'PASS' : 'FAIL'}`
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const { rows, summaries } = getRunRows(args.resultsDir, args.agent);
    const report = buildAggregate(args.resultsDir, args.agent, rows, summaries);

    if (args.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      printHuman(report, args.maxToolList);
    }
  } catch (error) {
    console.error(
      `Failed to aggregate agent E2E results: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}
