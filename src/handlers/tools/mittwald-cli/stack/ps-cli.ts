import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getStackProcesses, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldStackPsCliArgs {
  stackId?: string;
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawService = {
  id?: string;
  name?: string;
  state?: string;
  image?: string;
  ports?: unknown;
  stackId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatServices(services: RawService[]) {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    state: service.state,
    image: service.image,
    ports: service.ports ?? [],
    stackId: service.stackId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }));
}

export const handleStackPsCli: MittwaldCliToolHandler<MittwaldStackPsCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'Stack ID is required. Please provide the stackId parameter.');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required. Please provide the projectId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv: string[] = ['stack', 'ps', '--stack-id', args.stackId, '--output', 'json'];
  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator) argv.push('--csv-separator', args.csvSeparator);

  try {
    const validation = await validateToolParity({
      toolName: 'mittwald_stack_ps',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getStackProcesses({
          stackId: args.stackId!,
          projectId: args.projectId!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_stack_ps',
        stackId: args.stackId,
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    const services = validation.libraryOutput.data as RawService[];

    if (!services || services.length === 0) {
      return formatToolResponse(
        'success',
        'No services found in the stack',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${services.length} service${services.length === 1 ? '' : 's'} in the stack`,
      formatServices(services),
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

    logger.error('[WP05] Unexpected error in stack ps handler', { error });
    return formatToolResponse('error', `Failed to get stack processes: ${error instanceof Error ? error.message : String(error)}`);
  }
};
