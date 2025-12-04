/**
 * Capability Mismatch Detector (T015)
 *
 * Detects tool failures due to model limitations (FR-025).
 * Signal: Error message contains "does not support" or "not support tool types".
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

// Patterns indicating capability mismatch
const CAPABILITY_ERROR_PATTERNS = [
  /does not support/i,
  /not support.*tool.*types/i,
  /invalid_request_error.*tool/i,
  /model.*not.*support/i,
  /unsupported.*tool/i,
];

/**
 * Detect capability mismatch incidents.
 *
 * @param session Session to analyze
 * @returns Array of capability-mismatch incidents
 */
export function detectCapabilityMismatch(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['capability-mismatch'];

  for (let i = 0; i < session.events.length; i++) {
    const event = session.events[i];

    if (event.toolResult) {
      const content = event.toolResult.content;

      // Check for capability mismatch patterns
      const matchedPattern = CAPABILITY_ERROR_PATTERNS.find(pattern =>
        pattern.test(content)
      );

      if (matchedPattern) {
        // Find the preceding tool call
        const toolCallEvent = session.events.slice(0, i).reverse().find(e => e.toolCall);
        const toolAttempted = toolCallEvent?.toolCall?.name || 'unknown';

        // Calculate token waste
        let tokenWaste = 0;
        if (toolCallEvent?.tokenUsage) {
          tokenWaste = toolCallEvent.tokenUsage.inputTokens + toolCallEvent.tokenUsage.outputTokens;
        }

        // Extract model info from error if available
        const modelMatch = content.match(/'([^']+)'/);
        const modelConstraint = modelMatch ? modelMatch[1] : 'unknown model';

        const severityScore = tokenWaste * config.multiplier;

        const incident: Incident = {
          id: generateIncidentId(),
          type: 'capability-mismatch',
          severity: calculateSeverityLevel(severityScore),
          severityScore,
          sessionId: session.id,
          toolAttempted,
          tokenWaste,
          timeWasteMs: event.toolResult.durationMs || 0,
          context: {
            eventRange: [toolCallEvent ? session.events.indexOf(toolCallEvent) : i, i],
            errorMessages: [content.slice(0, 200)],
            description: `Model ${modelConstraint} does not support ${toolAttempted}`,
          },
        };

        incidents.push(incident);
      }
    }
  }

  return incidents;
}
