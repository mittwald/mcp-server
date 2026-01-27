import fs from 'fs';
import path from 'path';
import { generateCoverageReport } from './generate-coverage-report.js';
import type { CoverageReport } from './generate-coverage-report.js';

/**
 * Markdown report generator.
 * Creates human-readable coverage report from JSON data.
 */

/**
 * Generate Markdown coverage report.
 */
export function generateMarkdownReport(report: CoverageReport): string {
  let markdown = '# MCP Tool Coverage Report\n\n';
  markdown += `**Generated**: ${new Date(report.generated_at).toLocaleString()}\n\n`;
  markdown += `**Run ID**: \`${report.run_id}\`\n\n`;

  markdown += '---\n\n';

  // Summary
  markdown += '## Summary\n\n';
  markdown += `- **Total Tools**: ${report.total_tools}\n`;
  markdown += `- **Validated**: ${report.validated_tools} (${report.validation_rate.toFixed(1)}%)\n`;
  markdown += `- **Failed**: ${report.failed_tools}\n`;
  markdown += `- **Uncovered**: ${report.uncovered_tools}\n\n`;

  // Progress bar
  const progressBar = '█'.repeat(Math.floor(report.validation_rate / 2)) +
                      '░'.repeat(50 - Math.floor(report.validation_rate / 2));
  markdown += `**Validation Progress**:\n\`\`\`\n[${progressBar}] ${report.validation_rate.toFixed(1)}%\n\`\`\`\n\n`;

  markdown += '---\n\n';

  // Scenario execution
  markdown += '## Scenario Execution\n\n';
  markdown += `- **Total Scenarios**: ${report.scenarios_executed.total}\n`;
  markdown += `- **Successful**: ${report.scenarios_executed.successful}\n`;
  markdown += `- **Failed**: ${report.scenarios_executed.failed}\n\n`;

  if (report.scenarios_executed.scenarios.length > 0) {
    markdown += '### Scenario Details\n\n';
    markdown += '| Scenario ID | Status | Tools Validated |\n';
    markdown += '|-------------|--------|----------------|\n';

    for (const scenario of report.scenarios_executed.scenarios) {
      const statusIcon = scenario.status === 'success' ? '✓' : '✗';
      markdown += `| ${scenario.id} | ${statusIcon} ${scenario.status} | ${scenario.tools_validated} |\n`;
    }

    markdown += '\n';
  }

  markdown += '---\n\n';

  // Domain coverage
  markdown += '## Coverage by Domain\n\n';
  markdown += '| Domain | Total | Validated | Failed | Not Tested | Rate |\n';
  markdown += '|--------|-------|-----------|--------|------------|------|\n';

  // Sort domains by validation rate (highest first)
  const domainEntries = Object.entries(report.coverage_by_domain)
    .sort((a, b) => b[1].validation_rate - a[1].validation_rate);

  for (const [domain, coverage] of domainEntries) {
    markdown += `| ${domain} | ${coverage.total} | ${coverage.validated} | ${coverage.failed} | ${coverage.not_tested} | ${coverage.validation_rate.toFixed(1)}% |\n`;
  }

  markdown += '\n---\n\n';

  // Failure patterns
  if (report.failure_patterns > 0) {
    markdown += '## Failure Patterns\n\n';
    markdown += `**Total Patterns**: ${report.failure_patterns}\n\n`;

    if (report.most_common_failures.length > 0) {
      markdown += '### Top 5 Most Common Failures\n\n';

      for (let i = 0; i < report.most_common_failures.length; i++) {
        const pattern = report.most_common_failures[i];
        markdown += `${i + 1}. **${pattern.root_cause}** (\`${pattern.pattern_id}\`)\n`;
        markdown += `   - Occurrences: ${pattern.occurrence_count}\n\n`;
      }

      markdown += 'For detailed failure analysis, see: `evals/reports/failure-patterns.md`\n\n';
    }
  } else {
    markdown += '## Failure Patterns\n\n';
    markdown += 'No failures detected! All scenarios executed successfully.\n\n';
  }

  markdown += '---\n\n';

  // Uncovered tools
  if (report.uncovered_tools > 0) {
    markdown += '## Uncovered Tools\n\n';
    markdown += `**Total**: ${report.uncovered_tools} tools\n\n`;
    markdown += 'These tools need custom scenarios for validation. See gap analysis: `evals/coverage/gap-analysis.json`\n\n';

    // Group uncovered by domain
    const uncoveredByDomain: Record<string, string[]> = {};

    for (const tool of report.tools_by_status.not_tested) {
      const domain = tool.split('_')[1] || 'unknown';
      if (!uncoveredByDomain[domain]) {
        uncoveredByDomain[domain] = [];
      }
      uncoveredByDomain[domain].push(tool);
    }

    markdown += '### Uncovered Tools by Domain\n\n';

    for (const [domain, tools] of Object.entries(uncoveredByDomain)) {
      markdown += `**${domain}** (${tools.length} tools):\n`;
      tools.forEach(t => markdown += `- \`${t}\`\n`);
      markdown += '\n';
    }
  } else {
    markdown += '## Uncovered Tools\n\n';
    markdown += 'All tools have been validated! 100% coverage achieved.\n\n';
  }

  markdown += '---\n\n';

  // Next steps
  markdown += '## Next Steps\n\n';

  if (report.validation_rate < 100) {
    markdown += '1. Review gap analysis: `evals/coverage/gap-analysis.json`\n';
    markdown += '2. Create custom scenarios for uncovered tools\n';
    markdown += '3. Re-run scenarios: `npm run scenarios:run-all`\n';
    markdown += '4. Regenerate coverage report\n\n';
  } else {
    markdown += 'All tools validated! Consider:\n';
    markdown += '1. Review failure patterns for systemic issues\n';
    markdown += '2. Document tool usage patterns from scenarios\n';
    markdown += '3. Monitor ongoing tool coverage with new features\n\n';
  }

  markdown += '---\n\n';
  markdown += '*Report generated by Feature 018: Documentation-Driven MCP Tool Testing*\n';

  return markdown;
}

/**
 * Save Markdown report to file.
 */
export function saveMarkdownReport(markdown: string): void {
  const outputPath = path.join(process.cwd(), 'evals', 'reports', 'coverage-summary.md');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Coverage report (Markdown) saved: ${outputPath}`);
}

/**
 * CLI entrypoint.
 * Usage: tsx evals/scripts/generate-markdown-report.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateCoverageReport();
  const markdown = generateMarkdownReport(report);
  saveMarkdownReport(markdown);

  console.log('\nMarkdown report generated successfully');
  console.log('View: evals/reports/coverage-summary.md');
}
