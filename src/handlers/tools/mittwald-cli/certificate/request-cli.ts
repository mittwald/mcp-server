import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { CliToolError } from '../../../../tools/index.js';
import { requestCertificate, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCertificateRequestArgs {
  projectId: string;
  commonName: string;
  city?: string;
  company?: string;
  country?: string;
  organizationalUnit?: string;
  state?: string;
}


export const handleCertificateRequestCli: MittwaldCliToolHandler<MittwaldCertificateRequestArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  if (!args.commonName) {
    return formatToolResponse('error', 'commonName is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await requestCertificate({
      projectId: args.projectId,
      commonName: args.commonName,
      contact: {
        city: args.city,
        company: args.company,
        country: args.country,
        organizationalUnit: args.organizationalUnit,
        state: args.state,
      },
      apiToken: session.mittwaldAccessToken,
    });

    const certificateRequest = result.data;

    return formatToolResponse(
      'success',
      'SSL certificate request initiated',
      certificateRequest,
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

    logger.error('[WP06] Unexpected error in certificate request handler', { error });
    return formatToolResponse('error', `Failed to request certificate: ${error instanceof Error ? error.message : String(error)}`);
  }
};
