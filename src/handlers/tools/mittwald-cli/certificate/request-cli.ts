import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { CliToolError } from '../../../../tools/index.js';
import { requestCertificate, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
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

function buildCliArgs(args: MittwaldCertificateRequestArgs): string[] {
  const cliArgs: string[] = ['domain', 'certificate', 'request', '--output', 'json'];
  cliArgs.push('--project-id', args.projectId);
  cliArgs.push('--common-name', args.commonName);
  if (args.city) cliArgs.push('--city', args.city);
  if (args.company) cliArgs.push('--company', args.company);
  if (args.country) cliArgs.push('--country', args.country);
  if (args.organizationalUnit) cliArgs.push('--organizational-unit', args.organizationalUnit);
  if (args.state) cliArgs.push('--state', args.state);
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCertificateRequestArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
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

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_certificate_request',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await requestCertificate({
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
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_certificate_request',
        projectId: args.projectId,
        commonName: args.commonName,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_certificate_request',
        projectId: args.projectId,
        commonName: args.commonName,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is the certificate request result
    const certificateRequest = validation.libraryOutput.data;

    return formatToolResponse(
      'success',
      'SSL certificate request initiated',
      certificateRequest,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
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
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in certificate request handler', { error });
    return formatToolResponse('error', `Failed to request certificate: ${error instanceof Error ? error.message : String(error)}`);
  }
};
