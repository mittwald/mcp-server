/**
 * Reporters Module Index
 *
 * Central exports for domain reports and summary generation.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  Session,
  Incident,
  CorpusIndex,
  DependencyExport,
  TestDomain,
} from '../types.js';
import type { DomainReport } from './types.js';
import { generateDomainReport, renderDomainReportMarkdown } from './domain-report.js';
import { getDomainsInOrder } from '../../inventory/grouping.js';

// =============================================================================
// Report Generation (T034-T043)
// =============================================================================

/**
 * All test domains for report generation.
 */
export const ALL_DOMAINS: TestDomain[] = [
  'identity',
  'organization',
  'project-foundation',
  'apps',
  'containers',
  'databases',
  'domains-mail',
  'access-users',
  'automation',
  'backups',
];

/**
 * Generate and write a single domain report.
 *
 * @param corpus Corpus index
 * @param incidents All incidents
 * @param deps Dependency export
 * @param domain Target domain
 * @param outputDir Output directory for reports
 * @returns Generated report
 */
export function generateAndWriteDomainReport(
  corpus: CorpusIndex,
  incidents: Incident[],
  deps: DependencyExport,
  domain: TestDomain,
  outputDir: string
): DomainReport {
  // Generate report
  const report = generateDomainReport(corpus, incidents, deps, domain);

  // Render to markdown
  const markdown = renderDomainReportMarkdown(report);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write file
  const filename = `${domain}.md`;
  const outputPath = join(outputDir, filename);
  writeFileSync(outputPath, markdown, 'utf-8');

  return report;
}

/**
 * Generate all domain reports.
 *
 * @param corpus Corpus index
 * @param incidents All incidents
 * @param deps Dependency export
 * @param outputDir Output directory for reports
 * @returns Map of domain to report
 */
export function generateAllDomainReports(
  corpus: CorpusIndex,
  incidents: Incident[],
  deps: DependencyExport,
  outputDir: string
): Map<TestDomain, DomainReport> {
  const reports = new Map<TestDomain, DomainReport>();

  for (const domain of ALL_DOMAINS) {
    const report = generateAndWriteDomainReport(
      corpus,
      incidents,
      deps,
      domain,
      outputDir
    );
    reports.set(domain, report);
  }

  return reports;
}

// =============================================================================
// Exports
// =============================================================================

export type { DomainReport, IncidentSummary, EfficiencyMetrics } from './types.js';
export {
  generateDomainReport,
  renderDomainReportMarkdown,
  filterSessionsByDomain,
  getToolsInDomain,
  aggregateIncidents,
  filterDependencies,
  calculateMetrics,
  generateRecommendations as generateDomainRecommendations,
} from './domain-report.js';

// Summary report exports
export {
  generateSummary,
  renderSummaryMarkdown,
  aggregateStats,
  rankPatterns,
  findProblematicTools,
  calculateDomainHealth,
  exportSummary,
  exportSummaryJson,
} from './summary-report.js';

// Recommendations exports
export {
  extractToolChains,
  findPatterns,
  rankByEfficiency,
  generateRecommendations,
  extractAndGenerateRecommendations,
  exportRecommendationsJson,
  exportRecommendationsMarkdown,
} from './recommendations.js';

// Manifest exports
export {
  generateManifest,
  exportManifest,
} from './manifest.js';
