/**
 * Retry Loop Detector (T012)
 *
 * Detects 3+ consecutive errors before success (FR-022).
 * Signal: 3+ consecutive tool results with is_error: true.
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

const MIN_CONSECUTIVE_ERRORS = 3;

/**
 * Detect retry loop incidents.
 *
 * @param session Session to analyze
 * @returns Array of retry-loop incidents
 */
export function detectRetryLoop(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['retry-loop'];

  let consecutiveErrors = 0;
  let errorStartIndex = -1;
  let totalTokens = 0;
  let errorMessages: string[] = [];

  for (let i = 0; i < session.events.length; i++) {
    const event = session.events[i];

    if (event.toolResult) {
      if (event.toolResult.isError) {
        if (consecutiveErrors === 0) {
          errorStartIndex = i;
          totalTokens = 0;
          errorMessages = [];
        }
        consecutiveErrors++;
        errorMessages.push(event.toolResult.content.slice(0, 100));

        // Count tokens from surrounding events
        const prevEvent = session.events[i - 1];
        if (prevEvent?.tokenUsage) {
          totalTokens += prevEvent.tokenUsage.inputTokens + prevEvent.tokenUsage.outputTokens;
        }
      } else {
        // Success - check if we had enough consecutive errors
        if (consecutiveErrors >= MIN_CONSECUTIVE_ERRORS) {
          const firstErrorEvent = session.events[errorStartIndex];
          const timeWasteMs = event.timestamp.getTime() - firstErrorEvent.timestamp.getTime();
          const avgTokensPerAttempt = totalTokens / consecutiveErrors;
          const severityScore = consecutiveErrors * avgTokensPerAttempt * config.multiplier;

          const incident: Incident = {
            id: generateIncidentId(),
            type: 'retry-loop',
            severity: calculateSeverityLevel(severityScore),
            severityScore,
            sessionId: session.id,
            toolAttempted: session.events[errorStartIndex - 1]?.toolCall?.name,
            tokenWaste: totalTokens,
            timeWasteMs,
            context: {
              eventRange: [errorStartIndex, i],
              errorMessages: errorMessages.slice(0, 5),
              description: `${consecutiveErrors} consecutive errors before success`,
            },
          };

          incidents.push(incident);
        }

        // Reset counter
        consecutiveErrors = 0;
        errorStartIndex = -1;
      }
    }
  }

  // Handle case where session ends in error loop
  if (consecutiveErrors >= MIN_CONSECUTIVE_ERRORS) {
    const firstErrorEvent = session.events[errorStartIndex];
    const lastEvent = session.events[session.events.length - 1];
    const timeWasteMs = lastEvent.timestamp.getTime() - firstErrorEvent.timestamp.getTime();
    const avgTokensPerAttempt = totalTokens / consecutiveErrors;
    const severityScore = consecutiveErrors * avgTokensPerAttempt * config.multiplier;

    const incident: Incident = {
      id: generateIncidentId(),
      type: 'retry-loop',
      severity: calculateSeverityLevel(severityScore),
      severityScore,
      sessionId: session.id,
      toolAttempted: session.events[errorStartIndex - 1]?.toolCall?.name,
      tokenWaste: totalTokens,
      timeWasteMs,
      context: {
        eventRange: [errorStartIndex, session.events.length - 1],
        errorMessages: errorMessages.slice(0, 5),
        description: `${consecutiveErrors} consecutive errors, session ended without success`,
      },
    };

    incidents.push(incident);
  }

  return incidents;
}
