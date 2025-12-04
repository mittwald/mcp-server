/**
 * Domain Report Generator (T028-T033)
 *
 * Generates comprehensive Markdown reports for each functional domain.
 */

import type {
  Session,
  Incident,
  Dependency,
  CorpusIndex,
  DependencyExport,
  IncidentType,
  TestDomain,
} from '../types.js';
import type {
  DomainReport,
  DomainOverview,
  IncidentSummary,
  EfficiencyMetrics,
  IncidentRow,
  DependencyRow,
} from './types.js';
import { REPORT_CONFIG } from './types.js';
import { mapToolToDomain } from '../../inventory/grouping.js';
import { parseToolName } from '../../inventory/discovery.js';

// =============================================================================
// Domain Filtering (T029)
// =============================================================================

/**
 * Get all sessions from corpus as an array.
 */
function getSessionsArray(corpus: CorpusIndex): Session[] {
  return Object.values(corpus.sessions);
}

/**
 * Filter sessions by domain.
 *
 * @param corpus The corpus index
 * @param domain Target domain
 * @returns Sessions where targetTool belongs to the domain
 */
export function filterSessionsByDomain(
  corpus: CorpusIndex,
  domain: TestDomain
): Session[] {
  const sessions = getSessionsArray(corpus);
  return sessions.filter(session => {
    if (!session.targetTool) return false;
    const toolDomain = mapToolToDomain(session.targetTool);
    return toolDomain === domain;
  });
}

/**
 * Get tools belonging to a domain.
 *
 * @param corpus The corpus index
 * @param domain Target domain
 * @returns List of tool names in the domain
 */
export function getToolsInDomain(
  corpus: CorpusIndex,
  domain: TestDomain
): string[] {
  const tools = new Set<string>();
  const sessions = getSessionsArray(corpus);
  for (const session of sessions) {
    if (session.targetTool) {
      const toolDomain = mapToolToDomain(session.targetTool);
      if (toolDomain === domain) {
        tools.add(parseToolName(session.targetTool));
      }
    }
  }
  return Array.from(tools).sort();
}

// =============================================================================
// Incident Aggregation (T030)
// =============================================================================

/**
 * Aggregate incidents for a specific domain.
 *
 * @param incidents All incidents
 * @param sessionIds Session IDs in this domain
 * @returns Incident summary and rows
 */
export function aggregateIncidents(
  incidents: Incident[],
  sessionIds: Set<string>
): { summary: IncidentSummary; rows: IncidentRow[] } {
  // Filter incidents to domain sessions
  const domainIncidents = incidents.filter(inc => sessionIds.has(inc.sessionId));

  // Calculate summary
  const byType: Partial<Record<IncidentType, number>> = {};
  const bySeverity = { high: 0, medium: 0, low: 0 };
  let totalTokenWaste = 0;

  for (const inc of domainIncidents) {
    byType[inc.type] = (byType[inc.type] || 0) + 1;
    bySeverity[inc.severity]++;
    totalTokenWaste += inc.tokenWaste;
  }

  const summary: IncidentSummary = {
    totalCount: domainIncidents.length,
    byType,
    bySeverity,
    totalTokenWaste,
  };

  // Sort by severity (high first) then by token waste
  const sortedIncidents = domainIncidents.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const aSev = severityOrder[a.severity];
    const bSev = severityOrder[b.severity];
    if (aSev !== bSev) return aSev - bSev;
    return b.tokenWaste - a.tokenWaste;
  });

  // Limit rows
  const rows: IncidentRow[] = sortedIncidents
    .slice(0, REPORT_CONFIG.maxIncidentRows)
    .map(inc => ({
      sessionId: inc.sessionId.substring(0, 8),
      type: inc.type,
      severity: inc.severity,
      tokenWaste: inc.tokenWaste,
      details: inc.context?.description || 'No details',
    }));

  return { summary, rows };
}

// =============================================================================
// Dependency Filtering (T031)
// =============================================================================

/**
 * Filter dependencies to show domain-relevant edges.
 *
 * @param deps All dependencies
 * @param domainTools Tools in this domain (MCP format)
 * @returns Filtered dependency rows
 */
export function filterDependencies(
  deps: Dependency[],
  domainTools: string[]
): DependencyRow[] {
  const toolSet = new Set(domainTools);

  // Include edges where either from or to is in domain
  const domainDeps = deps.filter(d =>
    (toolSet.has(d.from) || toolSet.has(d.to)) &&
    d.confidence >= REPORT_CONFIG.minConfidenceForReport
  );

  // Sort by confidence descending
  domainDeps.sort((a, b) => b.confidence - a.confidence);

  // Limit and convert to rows
  return domainDeps.slice(0, REPORT_CONFIG.maxDependencyRows).map(d => ({
    from: parseToolName(d.from),
    to: parseToolName(d.to),
    confidence: Math.round(d.confidence * 100),
  }));
}

// =============================================================================
// Metrics Calculation (T032)
// =============================================================================

/**
 * Calculate efficiency metrics for a domain.
 *
 * @param sessions Sessions in this domain
 * @param incidents Incidents for these sessions
 * @returns Efficiency metrics
 */
export function calculateMetrics(
  sessions: Session[],
  incidents: Incident[]
): EfficiencyMetrics {
  if (sessions.length === 0) {
    return {
      avgTokensPerSession: 0,
      successRate: 0,
      mostProblematicTool: 'N/A',
      incidentCount: 0,
      avgTimePerSession: 0,
    };
  }

  // Total tokens
  const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);
  const avgTokensPerSession = Math.round(totalTokens / sessions.length);

  // Count high-severity incidents per session
  const sessionsWithHighSeverity = new Set(
    incidents
      .filter(i => i.severity === 'high')
      .map(i => i.sessionId)
  );
  const successfulSessions = sessions.filter(s => !sessionsWithHighSeverity.has(s.id));
  const successRate = Math.round((successfulSessions.length / sessions.length) * 100);

  // Most problematic tool - use toolAttempted (what LLM tried) or toolNeeded (what it should have used)
  const incidentsByTool: Record<string, number> = {};
  for (const inc of incidents) {
    const tool = inc.toolAttempted || inc.toolNeeded || 'unknown';
    // Parse to short name if it's an MCP tool
    const toolName = tool.startsWith('mcp__') ? parseToolName(tool) : tool;
    incidentsByTool[toolName] = (incidentsByTool[toolName] || 0) + 1;
  }
  let mostProblematicTool = 'N/A';
  let maxIncidents = 0;
  for (const [tool, count] of Object.entries(incidentsByTool)) {
    if (count > maxIncidents) {
      maxIncidents = count;
      mostProblematicTool = tool;
    }
  }

  // Average session duration
  const totalDuration = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  const avgTimePerSession = Math.round(totalDuration / sessions.length);

  return {
    avgTokensPerSession,
    successRate,
    mostProblematicTool,
    incidentCount: incidents.length,
    avgTimePerSession,
  };
}

// =============================================================================
// Recommendation Generation (T033)
// =============================================================================

/**
 * Generate actionable recommendations based on findings.
 *
 * @param report Partial domain report
 * @returns Array of recommendation strings
 */
export function generateRecommendations(
  incidentSummary: IncidentSummary,
  domain: TestDomain,
  mostProblematicTool: string
): string[] {
  const recommendations: string[] = [];

  // Rule: High wrong-tool-selection count
  const wrongToolCount = incidentSummary.byType['wrong-tool-selection'] || 0;
  if (wrongToolCount >= 5) {
    recommendations.push(
      `Improve tool descriptions for ${domain} domain tools to reduce wrong tool selection (${wrongToolCount} incidents)`
    );
  }

  // Rule: High retry-loop count
  const retryLoopCount = incidentSummary.byType['retry-loop'] || 0;
  if (retryLoopCount >= 3) {
    recommendations.push(
      `Add error recovery guidance for ${domain} tools to reduce retry loops (${retryLoopCount} incidents)`
    );
  }

  // Rule: Exploration waste
  const explorationCount = incidentSummary.byType['exploration-waste'] || 0;
  if (explorationCount >= 3) {
    recommendations.push(
      `Provide direct tool references in documentation for ${domain} to reduce exploration waste (${explorationCount} incidents)`
    );
  }

  // Rule: Capability mismatch
  const mismatchCount = incidentSummary.byType['capability-mismatch'] || 0;
  if (mismatchCount > 0) {
    recommendations.push(
      `Document model requirements for ${domain} tools with capability mismatches (${mismatchCount} incidents)`
    );
  }

  // Rule: High token waste
  if (incidentSummary.totalTokenWaste > 50000) {
    recommendations.push(
      `Investigate high token waste in ${domain} domain (${incidentSummary.totalTokenWaste.toLocaleString()} tokens)`
    );
  }

  // Rule: High-severity incidents
  if (incidentSummary.bySeverity.high > 0) {
    recommendations.push(
      `Address ${incidentSummary.bySeverity.high} high-severity incidents in ${domain} domain`
    );
  }

  // Rule: Problematic tool
  if (mostProblematicTool !== 'N/A' && incidentSummary.totalCount > 5) {
    recommendations.push(
      `Focus attention on ${mostProblematicTool} - most frequent incident source`
    );
  }

  // If no specific issues, provide general positive note
  if (recommendations.length === 0) {
    recommendations.push(
      `${domain} domain is performing well with minimal confusion patterns detected`
    );
  }

  return recommendations;
}

// =============================================================================
// Report Generation (T028)
// =============================================================================

/**
 * Generate a domain report.
 *
 * @param corpus Corpus index
 * @param incidents All incidents
 * @param deps Dependency export
 * @param domain Target domain
 * @returns Complete domain report
 */
export function generateDomainReport(
  corpus: CorpusIndex,
  incidents: Incident[],
  deps: DependencyExport,
  domain: TestDomain
): DomainReport {
  // Filter sessions and get tools
  const sessions = filterSessionsByDomain(corpus, domain);
  const toolList = getToolsInDomain(corpus, domain);

  // Get session IDs for incident filtering
  const sessionIds = new Set(sessions.map(s => s.id));

  // Get tool names in MCP format for dependency filtering
  const mcpToolNames = sessions
    .filter(s => s.targetTool)
    .map(s => s.targetTool as string);
  const uniqueMcpTools = [...new Set(mcpToolNames)];

  // Aggregate incidents
  const { summary: incidentSummary, rows: incidentRows } = aggregateIncidents(
    incidents,
    sessionIds
  );

  // Filter dependencies
  const dependencyRows = filterDependencies(deps.dependencies, uniqueMcpTools);

  // Calculate metrics
  const domainIncidents = incidents.filter(i => sessionIds.has(i.sessionId));
  const metrics = calculateMetrics(sessions, domainIncidents);

  // Generate overview
  const overview: DomainOverview = {
    sessionCount: sessions.length,
    toolList,
    totalTokens: sessions.reduce((sum, s) => sum + s.totalTokens, 0),
  };

  // Generate recommendations
  const recommendations = generateRecommendations(
    incidentSummary,
    domain,
    metrics.mostProblematicTool
  );

  return {
    domain,
    overview,
    incidentSummary,
    incidentRows,
    dependencyRows,
    metrics,
    recommendations,
  };
}

// =============================================================================
// Markdown Rendering
// =============================================================================

/**
 * Render a domain report to Markdown.
 *
 * @param report Domain report
 * @returns Markdown string
 */
export function renderDomainReportMarkdown(report: DomainReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${formatDomainName(report.domain)} Domain Analysis`);
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push('');
  lines.push(`- **Sessions analyzed**: ${report.overview.sessionCount}`);
  lines.push(`- **Tools tested**: ${report.overview.toolList.length > 0 ? report.overview.toolList.join(', ') : 'None'}`);
  lines.push(`- **Total token usage**: ${report.overview.totalTokens.toLocaleString()}`);
  lines.push('');

  // Incidents
  lines.push('## Confusion Incidents');
  lines.push('');

  if (report.incidentRows.length > 0) {
    lines.push('| Session | Pattern | Severity | Token Waste | Details |');
    lines.push('|---------|---------|----------|-------------|---------|');
    for (const row of report.incidentRows) {
      lines.push(`| ${row.sessionId} | ${row.type} | ${row.severity} | ${row.tokenWaste.toLocaleString()} | ${escapeMarkdown(row.details)} |`);
    }
    lines.push('');
    lines.push(`**Summary**: ${report.incidentSummary.totalCount} incidents, ${report.incidentSummary.totalTokenWaste.toLocaleString()} tokens wasted`);
  } else {
    lines.push('No confusion incidents detected in this domain.');
  }
  lines.push('');

  // Dependencies
  lines.push('## Tool Dependencies');
  lines.push('');
  lines.push(`Dependencies involving ${formatDomainName(report.domain)} tools:`);
  lines.push('');

  if (report.dependencyRows.length > 0) {
    lines.push('| Prerequisite | Required For | Confidence |');
    lines.push('|--------------|--------------|------------|');
    for (const row of report.dependencyRows) {
      lines.push(`| ${row.from} | ${row.to} | ${row.confidence}% |`);
    }
  } else {
    lines.push('No dependencies detected for this domain.');
  }
  lines.push('');

  // Metrics
  lines.push('## Efficiency Metrics');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Average tokens per session | ${report.metrics.avgTokensPerSession.toLocaleString()} |`);
  lines.push(`| Success rate | ${report.metrics.successRate}% |`);
  lines.push(`| Most problematic tool | ${report.metrics.mostProblematicTool} |`);
  lines.push(`| Incident count | ${report.metrics.incidentCount} |`);
  lines.push(`| Average session duration | ${formatDuration(report.metrics.avgTimePerSession)} |`);
  lines.push('');

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`- ${rec}`);
  }
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format domain name for display.
 */
function formatDomainName(domain: TestDomain): string {
  return domain
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format duration in ms to human readable.
 */
function formatDuration(ms: number): string {
  if (ms === 0) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Escape markdown special characters.
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .substring(0, 100); // Limit length
}
