/**
 * Exploration Waste Detector (T016)
 *
 * Detects excessive exploration before MCP tool call (FR-026).
 * Signal: >3 of (Glob|Grep|Read|WebSearch) before mcp__mittwald__* tool.
 */

import type { Session, Incident } from '../types.js';
import { generateIncidentId, DETECTOR_CONFIGS, calculateSeverityLevel } from './types.js';

const EXPLORATION_TOOLS = ['Glob', 'Grep', 'Read', 'WebSearch', 'WebFetch'];
const MCP_TOOL_PREFIX = 'mcp__mittwald__';
const MAX_EXPLORATION_BEFORE_MCP = 3;

/**
 * Detect exploration waste incidents.
 *
 * @param session Session to analyze
 * @returns Array of exploration-waste incidents
 */
export function detectExplorationWaste(session: Session): Incident[] {
  const incidents: Incident[] = [];
  const config = DETECTOR_CONFIGS['exploration-waste'];

  let explorationCount = 0;
  let explorationStartIndex = -1;
  let exploratoryTokens = 0;
  let exploratoryTime = 0;

  for (let i = 0; i < session.events.length; i++) {
    const event = session.events[i];

    if (event.toolCall) {
      const toolName = event.toolCall.name;

      if (EXPLORATION_TOOLS.includes(toolName)) {
        // Count exploratory tool
        if (explorationCount === 0) {
          explorationStartIndex = i;
        }
        explorationCount++;

        // Accumulate tokens
        if (event.tokenUsage) {
          exploratoryTokens += event.tokenUsage.inputTokens + event.tokenUsage.outputTokens;
        }

        // Find result to get timing
        const resultEvent = session.events.slice(i + 1).find(e =>
          e.toolResult?.callId === event.toolCall?.id
        );
        if (resultEvent) {
          exploratoryTime += resultEvent.timestamp.getTime() - event.timestamp.getTime();
        }
      } else if (toolName.startsWith(MCP_TOOL_PREFIX)) {
        // MCP tool found - check if we had excessive exploration
        if (explorationCount > MAX_EXPLORATION_BEFORE_MCP) {
          const severityScore = exploratoryTokens * config.multiplier;

          const incident: Incident = {
            id: generateIncidentId(),
            type: 'exploration-waste',
            severity: calculateSeverityLevel(severityScore),
            severityScore,
            sessionId: session.id,
            toolNeeded: toolName,
            tokenWaste: exploratoryTokens,
            timeWasteMs: exploratoryTime,
            context: {
              eventRange: [explorationStartIndex, i],
              errorMessages: [],
              description: `${explorationCount} exploratory tools before calling ${toolName.replace(MCP_TOOL_PREFIX, '')}`,
            },
          };

          incidents.push(incident);
        }

        // Reset for next potential sequence
        explorationCount = 0;
        explorationStartIndex = -1;
        exploratoryTokens = 0;
        exploratoryTime = 0;
      } else {
        // Other tool (like Bash, Task) - reset exploration count
        explorationCount = 0;
        explorationStartIndex = -1;
        exploratoryTokens = 0;
        exploratoryTime = 0;
      }
    }
  }

  return incidents;
}
