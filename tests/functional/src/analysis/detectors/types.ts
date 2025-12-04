/**
 * Detector Types
 *
 * Type definitions for confusion pattern detection.
 */

import type { Session, Incident, IncidentType, SeverityLevel } from '../types.js';

/**
 * Detector function signature.
 * Each detector takes a session and returns found incidents.
 */
export type DetectorFn = (session: Session) => Incident[];

/**
 * Detector configuration.
 */
export interface DetectorConfig {
  name: IncidentType;
  enabled: boolean;
  multiplier: number;  // Severity multiplier for this pattern type
}

/**
 * Default detector configurations.
 */
export const DETECTOR_CONFIGS: Record<IncidentType, DetectorConfig> = {
  'wrong-tool-selection': {
    name: 'wrong-tool-selection',
    enabled: true,
    multiplier: 2.0,  // High multiplier - indicates fundamental confusion
  },
  'retry-loop': {
    name: 'retry-loop',
    enabled: true,
    multiplier: 1.5,
  },
  'unnecessary-delegation': {
    name: 'unnecessary-delegation',
    enabled: true,
    multiplier: 1.0,
  },
  'stuck-indicator': {
    name: 'stuck-indicator',
    enabled: true,
    multiplier: 0.1,  // Lower multiplier - may be legitimate thinking
  },
  'capability-mismatch': {
    name: 'capability-mismatch',
    enabled: true,
    multiplier: 1.0,
  },
  'exploration-waste': {
    name: 'exploration-waste',
    enabled: true,
    multiplier: 1.0,
  },
};

/**
 * Severity thresholds for scoring.
 */
export const SEVERITY_THRESHOLDS = {
  high: 1000,
  medium: 100,
} as const;

/**
 * Calculate severity level from score.
 */
export function calculateSeverityLevel(score: number): SeverityLevel {
  if (score > SEVERITY_THRESHOLDS.high) {
    return 'high';
  }
  if (score > SEVERITY_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate unique incident ID.
 */
let incidentCounter = 0;
export function generateIncidentId(): string {
  incidentCounter++;
  return `inc-${incidentCounter.toString().padStart(4, '0')}`;
}

/**
 * Reset incident counter (for testing).
 */
export function resetIncidentCounter(): void {
  incidentCounter = 0;
}
