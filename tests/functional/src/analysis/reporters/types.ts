/**
 * Reporter Types
 *
 * Type definitions for domain reports and summary reports.
 */

import type { Dependency, IncidentType, SeverityLevel, TestDomain } from '../types.js';

/**
 * Overview section of a domain report.
 */
export interface DomainOverview {
  sessionCount: number;
  toolList: string[];
  totalTokens: number;
}

/**
 * Incident summary for a domain.
 */
export interface IncidentSummary {
  totalCount: number;
  byType: Partial<Record<IncidentType, number>>;
  bySeverity: { high: number; medium: number; low: number };
  totalTokenWaste: number;
}

/**
 * Efficiency metrics for a domain.
 */
export interface EfficiencyMetrics {
  avgTokensPerSession: number;
  successRate: number;
  mostProblematicTool: string;
  incidentCount: number;
  avgTimePerSession: number;
}

/**
 * Incident row for report table.
 */
export interface IncidentRow {
  sessionId: string;
  type: IncidentType;
  severity: SeverityLevel;
  tokenWaste: number;
  details: string;
}

/**
 * Dependency row for report table.
 */
export interface DependencyRow {
  from: string;
  to: string;
  confidence: number;
}

/**
 * Complete domain report.
 */
export interface DomainReport {
  domain: TestDomain;
  overview: DomainOverview;
  incidentSummary: IncidentSummary;
  incidentRows: IncidentRow[];
  dependencyRows: DependencyRow[];
  metrics: EfficiencyMetrics;
  recommendations: string[];
}

/**
 * Summary report across all domains.
 */
export interface SummaryReport {
  generatedAt: string;
  totalSessions: number;
  totalIncidents: number;
  totalTokenWaste: number;
  domainHealthScores: Record<TestDomain, number>;
  topPatterns: { type: IncidentType; count: number }[];
  criticalRecommendations: string[];
}

/**
 * Report generation configuration.
 */
export const REPORT_CONFIG = {
  maxIncidentRows: 20,      // Limit incident table rows
  maxDependencyRows: 15,    // Limit dependency table rows
  minConfidenceForReport: 0.3, // Minimum confidence to include dependency
} as const;
