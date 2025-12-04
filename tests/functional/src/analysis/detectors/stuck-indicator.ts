/**
 * Stuck Indicator Detector (T014)
 *
 * Detects >60s gaps between tool calls (FR-024).
 * Signal: timestamp[n+1] - timestamp[n] > 60000ms between non-user events.
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

const MIN_GAP_MS = 60000; // 60 seconds

/**
 * Detect stuck indicator incidents.
 *
 * @param session Session to analyze
 * @returns Array of stuck-indicator incidents
 */
export function detectStuckIndicator(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['stuck-indicator'];

  for (let i = 1; i < session.events.length; i++) {
    const prevEvent = session.events[i - 1];
    const currEvent = session.events[i];

    // Skip gaps caused by user input
    if (currEvent.type === 'user' && currEvent.message?.role === 'user') {
      // This might be user thinking/typing, not LLM stuck
      continue;
    }

    const gapMs = currEvent.timestamp.getTime() - prevEvent.timestamp.getTime();

    if (gapMs > MIN_GAP_MS) {
      const gapSeconds = Math.round(gapMs / 1000);

      // Token waste is harder to estimate for stuck indicators
      // Use a rough estimate based on idle time
      const tokenWaste = Math.round(gapSeconds * 0.1); // Low estimate

      const severityScore = gapSeconds * config.multiplier;

      const incident: Incident = {
        id: generateIncidentId(),
        type: 'stuck-indicator',
        severity: calculateSeverityLevel(severityScore),
        severityScore,
        sessionId: session.id,
        tokenWaste,
        timeWasteMs: gapMs,
        context: {
          eventRange: [i - 1, i],
          errorMessages: [],
          description: `${gapSeconds}s gap between events (possible stuck state)`,
        },
      };

      incidents.push(incident);
    }
  }

  return incidents;
}
