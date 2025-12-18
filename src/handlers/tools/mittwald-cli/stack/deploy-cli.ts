import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { deployStack, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldStackDeployCliArgs {
  stackId?: string;
  quiet?: boolean;
  composeFile?: string;
  envFile?: string;
  recreate?: boolean;
}

export const handleStackDeployCli: MittwaldCliToolHandler<MittwaldStackDeployCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'Stack ID is required. Please provide the stackId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv: string[] = ['stack', 'deploy'];
  if (args.stackId) argv.push('--stack-id', args.stackId);
  if (args.quiet) argv.push('--quiet');
  if (args.composeFile) argv.push('--compose-file', args.composeFile);
  if (args.envFile) argv.push('--env-file', args.envFile);

  try {
    const validation = await validateToolParity({
      toolName: 'mittwald_stack_deploy',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deployStack({
          stackId: args.stackId!,
          recreate: args.recreate ?? true,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_stack_deploy',
        stackId: args.stackId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    const deployData = validation.libraryOutput.data as any;

    return formatToolResponse(
      'success',
      'Stack deployment completed',
      {
        stackId: args.stackId,
        status: 'deployed',
        composeFile: args.composeFile,
        envFile: args.envFile,
        recreate: args.recreate ?? true,
        result: deployData,
      },
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error in stack deploy handler', { error });
    return formatToolResponse('error', `Failed to deploy stack: ${error instanceof Error ? error.message : String(error)}`);
  }
};
