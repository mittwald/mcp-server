/**
 * Wrong Tool Selection Detector (T011)
 *
 * Detects when LLM used wrong tool type (FR-021).
 * Signal: SlashCommand or Bash used with MCP-like input containing 'mcp__'.
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

const MCP_PATTERN = /mcp__\w+/;
const SLASH_MCP_PATTERN = /\/mcp__\w+/;

/**
 * Detect wrong tool selection incidents.
 *
 * @param session Session to analyze
 * @returns Array of wrong-tool-selection incidents
 */
export function detectWrongToolSelection(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['wrong-tool-selection'];

  for (let i = 0; i < session.events.length; i++) {
    const event = session.events[i];

    // Look for SlashCommand or Bash tool calls
    if (event.toolCall?.name === 'SlashCommand' || event.toolCall?.name === 'Bash') {
      const input = event.toolCall.input;
      const inputStr = JSON.stringify(input);

      // Check if input looks like MCP tool call
      if (MCP_PATTERN.test(inputStr) || SLASH_MCP_PATTERN.test(inputStr)) {
        // Extract the attempted MCP tool name
        const mcpMatch = inputStr.match(/mcp__\w+__\w+/);
        const toolNeeded = mcpMatch ? mcpMatch[0] : 'unknown MCP tool';

        // Find the corresponding tool result
        const resultEvent = session.events.slice(i + 1).find(e =>
          e.toolResult?.callId === event.toolCall?.id
        );

        // Calculate token waste (from this event and any subsequent retries)
        let tokenWaste = 0;
        let timeWasteMs = 0;

        if (event.tokenUsage) {
          tokenWaste += event.tokenUsage.inputTokens + event.tokenUsage.outputTokens;
        }

        if (resultEvent) {
          timeWasteMs = resultEvent.timestamp.getTime() - event.timestamp.getTime();
        }

        // Apply multiplier
        const severityScore = tokenWaste * config.multiplier;

        const incident: Incident = {
          id: generateIncidentId(),
          type: 'wrong-tool-selection',
          severity: calculateSeverityLevel(severityScore),
          severityScore,
          sessionId: session.id,
          toolAttempted: event.toolCall.name,
          toolNeeded,
          tokenWaste,
          timeWasteMs,
          context: {
            eventRange: [i, resultEvent ? session.events.indexOf(resultEvent) : i],
            errorMessages: resultEvent?.toolResult?.isError
              ? [resultEvent.toolResult.content.slice(0, 200)]
              : [],
            description: `Used ${event.toolCall.name} instead of calling ${toolNeeded} directly`,
          },
        };

        incidents.push(incident);
      }
    }
  }

  return incidents;
}
