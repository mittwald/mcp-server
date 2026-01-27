import fs from 'fs';
import path from 'path';
import { loadFailurePatterns } from './cluster-failures.js';
import type { FailurePattern } from './cluster-failures.js';

/**
 * Failure pattern report generator.
 * Creates Markdown report with actionable failure diagnostics.
 */

/**
 * Generate Markdown failure report.
 */
export function generateFailureReport(): string {
  const database = loadFailurePatterns();

  if (database.patterns.length === 0) {
    return '# Failure Patterns Report\n\nNo failures detected. All tools validated successfully!\n';
  }

  let markdown = '# Failure Patterns Report\n\n';
  markdown += `**Generated**: ${new Date(database.generated_at).toLocaleString()}\n\n`;
  markdown += `**Total Patterns**: ${database.patterns.length}\n\n`;

  markdown += '---\n\n';

  // Summary table
  markdown += '## Summary\n\n';
  markdown += '| Pattern ID | Root Cause | Occurrences | Scenarios Affected |\n';
  markdown += '|------------|------------|-------------|--------------------|\n';

  for (const pattern of database.patterns) {
    markdown += `| \`${pattern.pattern_id}\` | ${pattern.root_cause} | ${pattern.occurrence_count} | ${pattern.affected_scenarios.length} |\n`;
  }

  markdown += '\n---\n\n';

  // Detailed patterns
  markdown += '## Detailed Patterns\n\n';

  for (let i = 0; i < database.patterns.length; i++) {
    const pattern = database.patterns[i];

    markdown += `### Pattern ${i + 1}: \`${pattern.pattern_id}\` (${pattern.occurrence_count} occurrences)\n\n`;
    markdown += `**Root Cause**: ${pattern.root_cause}\n\n`;

    // Error signature details
    markdown += '**Error Signature**:\n';
    markdown += `- Type: \`${pattern.error_signature.error_type}\`\n`;
    markdown += `- Tool: \`${pattern.error_signature.tool_name}\`\n`;
    if (pattern.error_signature.http_status) {
      markdown += `- HTTP Status: ${pattern.error_signature.http_status}\n`;
    }
    markdown += `- Normalized Message: \`${pattern.error_signature.normalized_message}\`\n\n`;

    // Affected scenarios
    markdown += '**Affected Scenarios**:\n';
    for (const scenario of pattern.affected_scenarios) {
      markdown += `- ${scenario}\n`;
    }
    markdown += '\n';

    // Temporal info
    markdown += `**First Seen**: ${new Date(pattern.first_seen).toLocaleString()}\n\n`;
    markdown += `**Last Seen**: ${new Date(pattern.last_seen).toLocaleString()}\n\n`;

    // Recommended fix
    if (pattern.recommended_fix) {
      markdown += `**Recommended Fix**: ${pattern.recommended_fix}\n\n`;
    }

    markdown += '---\n\n';
  }

  return markdown;
}

/**
 * Save failure report to Markdown file.
 */
export function saveFailureReport(markdown: string): void {
  const outputPath = path.join(process.cwd(), 'evals', 'reports', 'failure-patterns.md');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Saved failure report: ${outputPath}`);
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/generate-failure-report.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const markdown = generateFailureReport();
  saveFailureReport(markdown);

  console.log('\nFailure report generated successfully');
  console.log('View: evals/reports/failure-patterns.md');
}
