/**
 * Detector Orchestrator (T010, T017, T018)
 *
 * Runs all detectors and aggregates results.
 * Implements severity scoring algorithm (T017).
 * Exports incidents.json (T018).
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Session, Incident, IncidentReport, IncidentType, SeverityLevel } from '../types.js';
import { detectWrongToolSelection } from './wrong-tool.js';
import { detectRetryLoop } from './retry-loop.js';
import { detectUnnecessaryDelegation } from './unnecessary-delegation.js';
import { detectStuckIndicator } from './stuck-indicator.js';
import { detectCapabilityMismatch } from './capability-mismatch.js';
import { detectExplorationWaste } from './exploration-waste.js';
import { resetIncidentCounter, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

// =============================================================================
// Detector Registry
// =============================================================================

const DETECTORS: Array<{
  name: IncidentType;
  detect: (session: Session) => Incident[];
}> = [
  { name: 'wrong-tool-selection', detect: detectWrongToolSelection },
  { name: 'retry-loop', detect: detectRetryLoop },
  { name: 'unnecessary-delegation', detect: detectUnnecessaryDelegation },
  { name: 'stuck-indicator', detect: detectStuckIndicator },
  { name: 'capability-mismatch', detect: detectCapabilityMismatch },
  { name: 'exploration-waste', detect: detectExplorationWaste },
];

// =============================================================================
// Main Detection Functions
// =============================================================================

/**
 * Run all detectors on a single session.
 *
 * @param session Session to analyze
 * @returns Array of detected incidents
 */
export function detectPatterns(session: Session): Incident[] {
  const incidents: Incident[] = [];

  for (const detector of DETECTORS) {
    const config = DETECTOR_CONFIGS[detector.name];
    if (config.enabled) {
      try {
        const detected = detector.detect(session);
        incidents.push(...detected);
      } catch (err) {
        console.warn(`[detector] ${detector.name} failed on session ${session.id}:`, err);
      }
    }
  }

  return incidents;
}

/**
 * Run all detectors on multiple sessions and aggregate results.
 *
 * @param sessions Array of sessions to analyze
 * @returns Complete incident report
 */
export function detectAllPatterns(sessions: Session[]): IncidentReport {
  // Reset incident counter for consistent IDs
  resetIncidentCounter();

  const allIncidents: Incident[] = [];

  for (const session of sessions) {
    const incidents = detectPatterns(session);
    allIncidents.push(...incidents);
  }

  // Build aggregates
  const byType: Record<IncidentType, number> = {
    'wrong-tool-selection': 0,
    'retry-loop': 0,
    'unnecessary-delegation': 0,
    'stuck-indicator': 0,
    'capability-mismatch': 0,
    'exploration-waste': 0,
  };

  const bySeverity: Record<SeverityLevel, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  let totalTokenWaste = 0;

  for (const incident of allIncidents) {
    byType[incident.type]++;
    bySeverity[incident.severity]++;
    totalTokenWaste += incident.tokenWaste;
  }

  return {
    incidents: allIncidents,
    byType,
    bySeverity,
    totalTokenWaste,
  };
}

// =============================================================================
// Severity Scoring (T017)
// =============================================================================

/**
 * Recalculate severity for an incident.
 * Formula: severityScore = tokenWaste × timeWasteMultiplier × typeMultiplier
 *
 * @param incident Incident to score
 * @returns Updated incident with recalculated severity
 */
export function calculateSeverity(incident: Incident): Incident {
  const config = DETECTOR_CONFIGS[incident.type];

  // Time waste multiplier: more time = slightly higher severity
  const timeWasteMultiplier = 1 + (incident.timeWasteMs / 60000) * 0.1;

  const severityScore = incident.tokenWaste * timeWasteMultiplier * config.multiplier;
  const severity = calculateSeverityLevel(severityScore);

  return {
    ...incident,
    severityScore,
    severity,
  };
}

// =============================================================================
// Export Functions (T018)
// =============================================================================

/**
 * Export incident report to JSON file.
 *
 * @param report Incident report to export
 * @param outputPath Path to write incidents.json
 */
export function exportIncidents(report: IncidentReport, outputPath: string): void {
  // Ensure output directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Convert to JSON-serializable format
  const json = {
    incidents: report.incidents.map(incident => ({
      ...incident,
      // Ensure context is properly serialized
      context: {
        eventRange: incident.context.eventRange,
        errorMessages: incident.context.errorMessages,
        description: incident.context.description,
      },
    })),
    byType: report.byType,
    bySeverity: report.bySeverity,
    totalTokenWaste: report.totalTokenWaste,
    generatedAt: new Date().toISOString(),
  };

  // Write with 2-space indentation
  writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
}

// =============================================================================
// Re-exports
// =============================================================================

export { detectWrongToolSelection } from './wrong-tool.js';
export { detectRetryLoop } from './retry-loop.js';
export { detectUnnecessaryDelegation } from './unnecessary-delegation.js';
export { detectStuckIndicator } from './stuck-indicator.js';
export { detectCapabilityMismatch } from './capability-mismatch.js';
export { detectExplorationWaste } from './exploration-waste.js';
export { resetIncidentCounter } from './types.js';
