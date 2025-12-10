#!/usr/bin/env npx tsx
/**
 * Session Log Analysis CLI (T057-T064)
 *
 * Command-line interface for running the complete analysis pipeline.
 *
 * Usage:
 *   npm run analyze
 *   npm run analyze -- --verbose
 *   npx tsx src/analysis/cli.ts --input ./session-logs --output ./output
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  parseDirectory,
  indexCorpus,
  detectAllPatterns,
  exportIncidents,
  mapDependencies,
  exportDependencies,
  exportCorpusIndex,
  generateAllDomainReports,
  generateSummary,
  exportSummary,
  extractAndGenerateRecommendations,
  exportRecommendationsJson,
  exportRecommendationsMarkdown,
  exportManifest,
} from './index.js';
import type { TestDomain } from '../types/index.js';

// =============================================================================
// CLI Options
// =============================================================================

interface CliOptions {
  inputDir: string;
  outputDir: string;
  domain?: TestDomain;
  verbose: boolean;
  help: boolean;
}

const DEFAULT_INPUT = './session-logs/005-mcp-functional-test';
const DEFAULT_OUTPUT = './analysis-output';

// =============================================================================
// Argument Parsing (T058)
// =============================================================================

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputDir: DEFAULT_INPUT,
    outputDir: DEFAULT_OUTPUT,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--input' || arg === '-i') {
      options.inputDir = args[++i] || DEFAULT_INPUT;
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i] || DEFAULT_OUTPUT;
    } else if (arg === '--domain' || arg === '-d') {
      options.domain = args[++i] as TestDomain;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Session Log Analysis CLI

USAGE:
  npm run analyze [options]
  npx tsx src/analysis/cli.ts [options]

OPTIONS:
  --input, -i <dir>     Input directory containing JSONL session logs
                        Default: ${DEFAULT_INPUT}

  --output, -o <dir>    Output directory for analysis artifacts
                        Default: ${DEFAULT_OUTPUT}

  --domain, -d <name>   Analyze only the specified domain
                        Options: identity, organization, project-foundation,
                                 apps, containers, databases, domains-mail,
                                 access-users, automation, backups

  --verbose, -v         Enable detailed progress logging

  --help, -h            Show this help message

EXAMPLES:
  npm run analyze
  npm run analyze -- --verbose
  npm run analyze -- --domain apps --verbose
  npx tsx src/analysis/cli.ts --input ./my-logs --output ./my-output

OUTPUT FILES:
  corpus-index.json      Indexed session data
  incidents.json         Detected confusion patterns
  dependencies.json      Tool dependency graph (JSON)
  dependencies.dot       Tool dependency graph (DOT/Graphviz)
  summary.md             Corpus-wide analysis summary
  recommendations.json   Tool chain recommendations (JSON)
  recommendations.md     Tool chain recommendations (Markdown)
  manifest.json          List of all generated artifacts
  reports/*.md           Per-domain analysis reports (10 files)
`);
}

// =============================================================================
// Logging (T060)
// =============================================================================

let startTime = Date.now();
let verboseMode = false;

function log(message: string): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[${elapsed}s] ${message}`);
}

function logVerbose(message: string): void {
  if (verboseMode) {
    log(message);
  }
}

// =============================================================================
// Main Pipeline (T059)
// =============================================================================

async function runAnalysis(options: CliOptions): Promise<void> {
  startTime = Date.now();
  verboseMode = options.verbose;

  // Resolve paths
  const inputDir = resolve(process.cwd(), options.inputDir);
  const outputDir = resolve(process.cwd(), options.outputDir);
  const reportsDir = join(outputDir, 'reports');

  console.log('Session Log Analysis v1.0.0');
  console.log('');

  // Validate input directory (T061)
  if (!existsSync(inputDir)) {
    console.error(`Error: Input directory not found: ${inputDir}`);
    console.error('Hint: Use --input to specify session log directory');
    process.exit(2);
  }

  // Create output directories (T063)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  log('Starting analysis...');
  logVerbose(`Input: ${inputDir}`);
  logVerbose(`Output: ${outputDir}`);

  // 1. Parse all session logs
  log('Parsing session logs...');
  const { sessions, stats: parseStats } = await parseDirectory(inputDir);

  if (parseStats.errors.length > 0) {
    const errorRate = parseStats.errors.length / (parseStats.errors.length + sessions.length);
    if (errorRate > 0.1) {
      console.error(`Error: Failed to parse ${parseStats.errors.length} of ${parseStats.errors.length + sessions.length} files (${(errorRate * 100).toFixed(1)}%)`);
      console.error('Hint: Check session log format. See errors above.');
      process.exit(3);
    }
  }

  log(`Parsing complete (${sessions.length} sessions, ${parseStats.parsedLines} parsed, ${parseStats.errorLines} errors)`);

  // 2. Index the corpus
  logVerbose('Building corpus index...');
  const corpus = indexCorpus(sessions, inputDir);
  exportCorpusIndex(corpus, join(outputDir, 'corpus-index.json'));
  logVerbose(`Indexed ${corpus.stats.totalSessions} sessions`);

  // 3. Detect confusion patterns
  log('Detecting confusion patterns...');
  const incidentReport = detectAllPatterns(sessions);
  exportIncidents(incidentReport, join(outputDir, 'incidents.json'));
  log(`Detection complete (${incidentReport.incidents.length} incidents)`);

  // 4. Map dependencies
  log('Mapping tool dependencies...');
  const deps = mapDependencies(sessions);
  exportDependencies(deps, join(outputDir, 'dependencies.json'), join(outputDir, 'dependencies.dot'));
  log(`Mapping complete (${deps.dependencies.length} dependencies)`);

  // 5. Generate domain reports
  log('Generating domain reports...');
  const domainReports = generateAllDomainReports(corpus, incidentReport.incidents, deps, reportsDir);
  log(`Reports complete (${domainReports.size} domains)`);

  // 6. Generate summary and recommendations
  log('Creating summary and recommendations...');
  const summary = generateSummary(corpus, incidentReport.incidents, deps, domainReports);
  exportSummary(summary, join(outputDir, 'summary.md'));

  const { chains, recommendations } = extractAndGenerateRecommendations(corpus);
  exportRecommendationsJson(recommendations, chains, join(outputDir, 'recommendations.json'));
  exportRecommendationsMarkdown(recommendations, join(outputDir, 'recommendations.md'));
  log(`Summary complete (${recommendations.length} recommendations)`);

  // 7. Generate manifest
  logVerbose('Generating manifest...');
  exportManifest(outputDir, join(outputDir, 'manifest.json'));

  // Final summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  log('Export complete');
  console.log('');
  console.log(`Analysis complete in ${totalTime}s`);
  console.log(`Output: ${outputDir}/`);
  console.log('');

  // Summary stats
  console.log('Summary:');
  console.log(`  Sessions: ${corpus.stats.totalSessions}`);
  console.log(`  Incidents: ${incidentReport.incidents.length}`);
  console.log(`  Dependencies: ${deps.dependencies.length}`);
  console.log(`  Domain Reports: ${domainReports.size}`);
  console.log(`  Recommendations: ${recommendations.length}`);
}

// =============================================================================
// Entry Point (T061)
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  try {
    await runAnalysis(options);
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('Error: Analysis failed');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (verboseMode && error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    }
    process.exit(4);
  }
}

main();
