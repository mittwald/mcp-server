/**
 * Summary Report Generator (T044-T048, T053)
 *
 * Generates corpus-wide summary with statistics, pattern rankings,
 * problematic tools, and domain health scores.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  Session,
  Incident,
  CorpusIndex,
  DependencyExport,
  IncidentType,
  Summary,
  CorpusStats,
  PatternRanking,
  ProblematicTool,
  DomainHealth,
  TestDomain,
} from '../types.js';
import type { DomainReport } from './types.js';
import { getDomainsInOrder } from '../../inventory/grouping.js';
import { parseToolName } from '../../inventory/discovery.js';

// =============================================================================
// Corpus Statistics (T045)
// =============================================================================

/**
 * Aggregate corpus-wide statistics.
 */
export function aggregateStats(corpus: CorpusIndex): CorpusStats {
  const sessions = Object.values(corpus.sessions);
  const totalSessions = sessions.length;
  const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);

  return {
    totalSessions,
    totalEvents,
    totalTokens,
    avgTokensPerSession: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
    avgEventsPerSession: totalSessions > 0 ? Math.round((totalEvents / totalSessions) * 10) / 10 : 0,
    analysisDate: new Date().toISOString().split('T')[0],
  };
}

// =============================================================================
// Pattern Ranking (T046)
// =============================================================================

/**
 * Rank confusion patterns by total impact.
 */
export function rankPatterns(
  incidents: Incident[],
  corpus: CorpusIndex
): PatternRanking[] {
  const sessions = Object.values(corpus.sessions);

  // Group incidents by type
  const byType = new Map<IncidentType, Incident[]>();
  for (const inc of incidents) {
    if (!byType.has(inc.type)) {
      byType.set(inc.type, []);
    }
    byType.get(inc.type)!.push(inc);
  }

  const rankings: PatternRanking[] = [];

  for (const [type, typeIncidents] of byType) {
    const count = typeIncidents.length;
    const totalTokenWaste = typeIncidents.reduce((sum, i) => sum + i.tokenWaste, 0);
    const avgSeverityScore = typeIncidents.reduce((sum, i) => sum + i.severityScore, 0) / count;

    // Find most affected domain
    const domainCounts = new Map<TestDomain, number>();
    for (const inc of typeIncidents) {
      const session = corpus.sessions[inc.sessionId];
      if (session?.domain) {
        domainCounts.set(session.domain, (domainCounts.get(session.domain) || 0) + 1);
      }
    }
    let mostAffectedDomain: TestDomain = 'project-foundation';
    let maxCount = 0;
    for (const [domain, domainCount] of domainCounts) {
      if (domainCount > maxCount) {
        maxCount = domainCount;
        mostAffectedDomain = domain;
      }
    }

    rankings.push({
      type,
      count,
      totalTokenWaste,
      avgSeverityScore: Math.round(avgSeverityScore * 100) / 100,
      mostAffectedDomain,
    });
  }

  // Sort by total token waste descending
  rankings.sort((a, b) => b.totalTokenWaste - a.totalTokenWaste);

  return rankings;
}

// =============================================================================
// Problematic Tools (T047)
// =============================================================================

/**
 * Identify MCP tools with most incidents.
 * Uses session's targetTool (the MCP tool being tested) not the Claude tool that was misused.
 */
export function findProblematicTools(
  incidents: Incident[],
  corpus: CorpusIndex
): ProblematicTool[] {
  const toolStats = new Map<string, {
    count: number;
    tokenWaste: number;
    patterns: Map<IncidentType, number>;
  }>();

  for (const inc of incidents) {
    // Use the session's targetTool (the MCP tool being tested)
    const session = corpus.sessions[inc.sessionId];
    const mcpTool = session?.targetTool;

    // Skip incidents that don't have an associated MCP tool
    if (!mcpTool) continue;

    const displayName = parseToolName(mcpTool);

    if (!toolStats.has(displayName)) {
      toolStats.set(displayName, {
        count: 0,
        tokenWaste: 0,
        patterns: new Map(),
      });
    }

    const stats = toolStats.get(displayName)!;
    stats.count++;
    stats.tokenWaste += inc.tokenWaste;
    stats.patterns.set(inc.type, (stats.patterns.get(inc.type) || 0) + 1);
  }

  const problematic: ProblematicTool[] = [];

  for (const [tool, stats] of toolStats) {
    // Find primary pattern
    let primaryPattern: IncidentType = 'wrong-tool-selection';
    let maxPatternCount = 0;
    for (const [pattern, patternCount] of stats.patterns) {
      if (patternCount > maxPatternCount) {
        maxPatternCount = patternCount;
        primaryPattern = pattern;
      }
    }

    problematic.push({
      tool,
      incidentCount: stats.count,
      tokenWaste: stats.tokenWaste,
      primaryPattern,
    });
  }

  // Sort by incident count descending, take top 10
  problematic.sort((a, b) => b.incidentCount - a.incidentCount);
  return problematic.slice(0, 10);
}

// =============================================================================
// Domain Health (T048)
// =============================================================================

/**
 * Calculate health score per domain.
 */
export function calculateDomainHealth(
  corpus: CorpusIndex,
  incidents: Incident[]
): DomainHealth[] {
  const domains = getDomainsInOrder();
  const sessions = Object.values(corpus.sessions);

  // Count incidents per domain
  const domainIncidents = new Map<TestDomain, number>();
  for (const inc of incidents) {
    const session = corpus.sessions[inc.sessionId];
    if (session?.domain) {
      domainIncidents.set(session.domain, (domainIncidents.get(session.domain) || 0) + 1);
    }
  }

  const health: DomainHealth[] = [];

  for (const domain of domains) {
    const sessionsCount = (corpus.byDomain[domain] || []).length;
    const incidentCount = domainIncidents.get(domain) || 0;

    // Health score: 1 - (incidents / sessions), capped at 0-1
    let healthScore = sessionsCount > 0
      ? Math.max(0, Math.min(1, 1 - (incidentCount / sessionsCount)))
      : 1; // No sessions = healthy (no data)

    // Determine status
    let status: 'healthy' | 'warning' | 'critical';
    if (healthScore > 0.8) {
      status = 'healthy';
    } else if (healthScore > 0.5) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    health.push({
      domain,
      sessionsCount,
      incidentCount,
      healthScore: Math.round(healthScore * 100) / 100,
      status,
    });
  }

  // Sort by health score ascending (worst first)
  health.sort((a, b) => a.healthScore - b.healthScore);

  return health;
}

// =============================================================================
// Summary Generation (T044)
// =============================================================================

/**
 * Generate complete summary report.
 */
export function generateSummary(
  corpus: CorpusIndex,
  incidents: Incident[],
  deps: DependencyExport,
  domainReports: Map<TestDomain, DomainReport>
): Summary {
  const corpusStats = aggregateStats(corpus);
  const patternRanking = rankPatterns(incidents, corpus);
  const problematicTools = findProblematicTools(incidents, corpus);
  const domainHealth = calculateDomainHealth(corpus, incidents);

  return {
    corpusStats,
    patternRanking,
    problematicTools,
    domainHealth,
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Markdown Rendering (T053)
// =============================================================================

/**
 * Render summary report as Markdown.
 */
export function renderSummaryMarkdown(summary: Summary): string {
  const lines: string[] = [];

  // Header
  lines.push('# Session Log Analysis Summary');
  lines.push('');
  lines.push(`**Generated**: ${summary.corpusStats.analysisDate}`);
  lines.push('**Corpus**: 595 sessions from 005-mcp-functional-test');
  lines.push('');

  // Corpus Statistics
  lines.push('## Corpus Statistics');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total sessions | ${summary.corpusStats.totalSessions.toLocaleString()} |`);
  lines.push(`| Total events | ${summary.corpusStats.totalEvents.toLocaleString()} |`);
  lines.push(`| Total tokens | ${summary.corpusStats.totalTokens.toLocaleString()} |`);
  lines.push(`| Average tokens/session | ${summary.corpusStats.avgTokensPerSession.toLocaleString()} |`);
  lines.push(`| Average events/session | ${summary.corpusStats.avgEventsPerSession} |`);
  lines.push('');

  // Confusion Patterns
  lines.push('## Confusion Patterns Detected');
  lines.push('');
  lines.push('| Pattern | Count | Token Waste | Most Affected Domain |');
  lines.push('|---------|-------|-------------|---------------------|');
  for (const pattern of summary.patternRanking) {
    lines.push(`| ${pattern.type} | ${pattern.count} | ${pattern.totalTokenWaste.toLocaleString()} | ${pattern.mostAffectedDomain} |`);
  }
  lines.push('');

  // Problematic Tools
  lines.push('## Top 10 Problematic Tools');
  lines.push('');
  lines.push('| Rank | Tool | Incidents | Token Waste | Primary Pattern |');
  lines.push('|------|------|-----------|-------------|-----------------|');
  for (let i = 0; i < summary.problematicTools.length; i++) {
    const tool = summary.problematicTools[i];
    lines.push(`| ${i + 1} | ${tool.tool} | ${tool.incidentCount} | ${tool.tokenWaste.toLocaleString()} | ${tool.primaryPattern} |`);
  }
  lines.push('');

  // Domain Health
  lines.push('## Domain Health');
  lines.push('');
  lines.push('| Domain | Sessions | Incidents | Health Score | Status |');
  lines.push('|--------|----------|-----------|--------------|--------|');
  for (const domain of summary.domainHealth) {
    const statusEmoji = domain.status === 'healthy' ? '✓' : domain.status === 'warning' ? '⚠' : '✗';
    lines.push(`| ${domain.domain} | ${domain.sessionsCount} | ${domain.incidentCount} | ${(domain.healthScore * 100).toFixed(0)}% | ${statusEmoji} ${domain.status} |`);
  }
  lines.push('');

  // Generated Artifacts
  lines.push('## Generated Artifacts');
  lines.push('');
  lines.push('See `manifest.json` for complete list of generated files.');
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Analysis generated on ${summary.generatedAt}*`);

  return lines.join('\n');
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Export summary to Markdown file.
 */
export function exportSummary(summary: Summary, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const markdown = renderSummaryMarkdown(summary);
  writeFileSync(outputPath, markdown, 'utf-8');
}

/**
 * Export summary to JSON file.
 */
export function exportSummaryJson(summary: Summary, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');
}
