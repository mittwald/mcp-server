import { getCurrentAbortSignal, getCurrentRequestId, getCurrentServer, getCurrentSessionId } from './execution-context.js';
import { logger } from './logger.js';

/** Users read an order overview before answering; the SDK default of 60s is too short. */
export const CONFIRMATION_TIMEOUT_MS = 10 * 60 * 1000;

export type ConfirmationResult =
  | { outcome: 'confirmed' }
  | { outcome: 'rejected'; reason: string }
  | { outcome: 'unsupported' };

/**
 * Asks the user (not the agent) to confirm an action via MCP form elicitation.
 *
 * Returns `unsupported` if the client cannot elicit; callers must then rely on
 * the agent having obtained approval. Anything other than an explicit
 * confirmation (decline, cancel, timeout, transport errors) is `rejected`.
 */
export async function requestUserConfirmation(message: string, confirmLabel: string): Promise<ConfirmationResult> {
  const server = getCurrentServer();
  if (!server?.getClientCapabilities()?.elicitation) {
    return { outcome: 'unsupported' };
  }

  try {
    const result = await server.elicitInput(
      {
        mode: 'form',
        message,
        requestedSchema: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', title: confirmLabel },
          },
          required: ['confirm'],
        },
      },
      {
        // Without relatedRequestId the request goes to the standalone SSE
        // stream, which clients don't necessarily keep open.
        relatedRequestId: getCurrentRequestId(),
        timeout: CONFIRMATION_TIMEOUT_MS,
        signal: getCurrentAbortSignal(),
      }
    );

    if (result.action === 'accept' && result.content?.confirm === true) {
      return { outcome: 'confirmed' };
    }
    if (result.action === 'accept') {
      return { outcome: 'rejected', reason: 'The user did not confirm.' };
    }
    return { outcome: 'rejected', reason: `The user chose to ${result.action}.` };
  } catch (error) {
    logger.warn('User confirmation via elicitation failed', { sessionId: getCurrentSessionId(), error });
    return {
      outcome: 'rejected',
      reason: `No confirmation received: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
