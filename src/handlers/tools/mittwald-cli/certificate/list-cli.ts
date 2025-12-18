import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { CliToolError } from '../../../../tools/index.js';
import { listCertificates, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCertificateListArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
}


export const handleCertificateListCli: MittwaldCliToolHandler<MittwaldCertificateListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listCertificates({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const certificates = result.data as any[];

    if (!certificates || certificates.length === 0) {
      return formatToolResponse(
        'success',
        'No certificates found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${certificates.length} certificate(s)`,
      certificates,
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();
      let message = error.message;

      if (combined.includes('not found') && combined.includes('project')) {
        message = `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${error.stderr || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in certificate list handler', { error });
    return formatToolResponse('error', `Failed to list certificates: ${error instanceof Error ? error.message : String(error)}`);
  }
};
