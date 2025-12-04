/**
 * Unnecessary Delegation Detector (T013)
 *
 * Detects Task agent spawned for simple operations (FR-023).
 * Signal: Task tool call with prompt for single tool lookup/call.
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

// Patterns indicating single-tool delegation
const SIMPLE_TASK_PATTERNS = [
  /find.*tool/i,
  /look.*up.*tool/i,
  /investigate.*tool/i,
  /search.*for.*mcp/i,
  /what.*is.*the.*tool/i,
  /how.*to.*use.*tool/i,
  /call.*the.*tool/i,
];

/**
 * Detect unnecessary delegation incidents.
 *
 * @param session Session to analyze
 * @returns Array of unnecessary-delegation incidents
 */
export function detectUnnecessaryDelegation(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['unnecessary-delegation'];

  for (let i = 0; i < session.events.length; i++) {
    const event = session.events[i];

    if (event.toolCall?.name === 'Task') {
      const input = event.toolCall.input;
      const prompt = (input.prompt as string) || '';
      const description = (input.description as string) || '';
      const fullText = `${prompt} ${description}`;

      // Check if this looks like a simple task
      const isSimpleTask = SIMPLE_TASK_PATTERNS.some(pattern => pattern.test(fullText));

      // Also check if prompt mentions a specific single tool
      const mentionsSingleTool = /mcp__\w+__\w+/.test(fullText);

      if (isSimpleTask || mentionsSingleTool) {
        // Find the corresponding tool result to get token usage
        const resultEvent = session.events.slice(i + 1).find(e =>
          e.toolResult?.callId === event.toolCall?.id
        );

        // Extract token usage from task result
        let tokenWaste = 0;
        let timeWasteMs = 0;

        if (resultEvent) {
          timeWasteMs = resultEvent.timestamp.getTime() - event.timestamp.getTime();

          // Try to extract totalTokens from the raw result
          const raw = resultEvent.raw as Record<string, unknown>;
          const toolUseResult = raw.toolUseResult as Record<string, unknown> | undefined;
          if (toolUseResult?.totalTokens) {
            tokenWaste = toolUseResult.totalTokens as number;
          } else {
            // Estimate from duration (rough estimate: ~10 tokens per second)
            tokenWaste = Math.round(timeWasteMs / 100);
          }
        }

        const severityScore = tokenWaste * config.multiplier;

        const incident: Incident = {
          id: generateIncidentId(),
          type: 'unnecessary-delegation',
          severity: calculateSeverityLevel(severityScore),
          severityScore,
          sessionId: session.id,
          toolAttempted: 'Task',
          toolNeeded: mentionsSingleTool
            ? fullText.match(/mcp__\w+__\w+/)?.[0]
            : undefined,
          tokenWaste,
          timeWasteMs,
          context: {
            eventRange: [i, resultEvent ? session.events.indexOf(resultEvent) : i],
            errorMessages: [],
            description: `Spawned Task agent for: "${description.slice(0, 50)}"`,
          },
        };

        incidents.push(incident);
      }
    }
  }

  return incidents;
}
