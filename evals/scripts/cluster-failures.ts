import fs from 'fs';
import path from 'path';
import { loadValidationDatabase } from './coverage-tracker.js';
import {
  extractSignature,
  generatePatternId,
  generateRootCause,
  generateRecommendedFix,
  hashSignature,
} from './failure-analyzer.js';
import type { ErrorSignature } from './failure-analyzer.js';

/**
 * Failure clustering algorithm.
 * Groups failed tool validation records by error signature.
 */

export interface FailurePattern {
  pattern_id: string;
  root_cause: string;
  error_signature: ErrorSignature;
  affected_scenarios: string[];
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  recommended_fix?: string;
}

export interface FailurePatternDatabase {
  version: string;
  generated_at: string;
  patterns: FailurePattern[];
}

/**
 * Cluster all failed tools by error signature.
 * @returns Array of failure patterns
 */
export function clusterFailures(): FailurePattern[] {
  const database = loadValidationDatabase();
  const failedTools = database.tools.filter(t => t.status === 'failed');

  console.log(`Clustering ${failedTools.length} failed tools...`);

  const patterns = new Map<string, FailurePattern>();

  for (const tool of failedTools) {
    if (!tool.failure_details) continue;

    const signature = extractSignature(
      tool.failure_details.error_message,
      tool.tool_name,
      undefined // HTTP status not available in tool validation records (TODO: extract from logs)
    );

    const signatureHash = hashSignature(signature);

    if (patterns.has(signatureHash)) {
      // Add to existing pattern
      const pattern = patterns.get(signatureHash)!;
      if (!pattern.affected_scenarios.includes(tool.failure_details.failed_in_scenario)) {
        pattern.affected_scenarios.push(tool.failure_details.failed_in_scenario);
      }
      pattern.occurrence_count++;
      pattern.last_seen = tool.failure_details.failed_at;
    } else {
      // Create new pattern
      patterns.set(signatureHash, {
        pattern_id: generatePatternId(signature),
        root_cause: generateRootCause(signature),
        error_signature: signature,
        affected_scenarios: [tool.failure_details.failed_in_scenario],
        occurrence_count: 1,
        first_seen: tool.failure_details.failed_at,
        last_seen: tool.failure_details.failed_at,
        recommended_fix: generateRecommendedFix(signature.error_type),
      });
    }
  }

  const patternArray = Array.from(patterns.values());

  // Sort by occurrence count (most common first)
  patternArray.sort((a, b) => b.occurrence_count - a.occurrence_count);

  console.log(`Found ${patternArray.length} unique failure patterns`);

  return patternArray;
}

/**
 * Save failure patterns to JSON file.
 */
export function saveFailurePatterns(patterns: FailurePattern[]): void {
  const database: FailurePatternDatabase = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    patterns,
  };

  const outputPath = path.join(process.cwd(), 'evals', 'coverage', 'failure-patterns.json');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf-8');
  console.log(`Saved failure patterns: ${outputPath}`);
}

/**
 * Load failure patterns from JSON file.
 */
export function loadFailurePatterns(): FailurePatternDatabase {
  const patternsPath = path.join(process.cwd(), 'evals', 'coverage', 'failure-patterns.json');

  if (!fs.existsSync(patternsPath)) {
    return {
      version: '1.0',
      generated_at: new Date().toISOString(),
      patterns: [],
    };
  }

  return JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/cluster-failures.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const patterns = clusterFailures();
  saveFailurePatterns(patterns);

  console.log('\nFailure patterns summary:');
  console.log(`Total patterns: ${patterns.length}`);

  if (patterns.length > 0) {
    console.log('\nTop 5 patterns by occurrence:');
    patterns.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.root_cause} (${p.occurrence_count} occurrences)`);
    });
  }
}
