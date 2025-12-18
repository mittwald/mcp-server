import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  quiet?: boolean;
  pathToApp?: string[];
  pathToUrl?: string[];
  pathToContainer?: string[];
}

function buildCliArgs(args: MittwaldDomainVirtualhostCreateArgs): string[] {
  const cliArgs: string[] = ['domain', 'virtualhost', 'create', '--hostname', args.hostname];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');

  if (args.pathToApp) {
    for (const mapping of args.pathToApp) cliArgs.push('--path-to-app', mapping);
  }

  if (args.pathToUrl) {
    for (const mapping of args.pathToUrl) cliArgs.push('--path-to-url', mapping);
  }

  if (args.pathToContainer) {
    for (const mapping of args.pathToContainer) cliArgs.push('--path-to-container', mapping);
  }

  return cliArgs;
}

function parsePathMappings(args: MittwaldDomainVirtualhostCreateArgs): any[] {
  const paths: any[] = [];

  // Parse path-to-app mappings (format: "path=/,appInstallationId=123")
  if (args.pathToApp) {
    for (const mapping of args.pathToApp) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const appPart = parts.find(p => p.startsWith('appInstallationId='));
      if (pathPart && appPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { appInstallationId: appPart.split('=')[1] }
        });
      }
    }
  }

  // Parse path-to-url mappings (format: "path=/,url=https://example.com")
  if (args.pathToUrl) {
    for (const mapping of args.pathToUrl) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const urlPart = parts.find(p => p.startsWith('url='));
      if (pathPart && urlPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { url: urlPart.split('=')[1] }
        });
      }
    }
  }

  // Parse path-to-container mappings (format: "path=/,containerId=123")
  if (args.pathToContainer) {
    for (const mapping of args.pathToContainer) {
      const parts = mapping.split(',');
      const pathPart = parts.find(p => p.startsWith('path='));
      const containerPart = parts.find(p => p.startsWith('containerId='));
      if (pathPart && containerPart) {
        paths.push({
          path: pathPart.split('=')[1],
          target: { containerId: containerPart.split('=')[1] }
        });
      }
    }
  }

  return paths;
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostCreateArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/403|forbidden|permission denied/i.test(combined)) {
    const note = args.hostname?.includes('.project.space')
      ? 'Subdomains on .project.space may not be allowed. Try using a custom domain instead.'
      : 'Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.';
    return `Permission denied when creating virtual host. ${note}\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/not found/i.test(combined) && /project/i.test(combined)) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/invalid/i.test(combined) && /format/i.test(combined)) {
    return `Invalid format in request. Please check your path mappings.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to create virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostCreateCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostCreateArgs> = async (args, sessionId) => {
  if (!args.hostname) {
    return formatToolResponse('error', 'Hostname is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);
  const paths = parsePathMappings(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_domain_virtualhost_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createVirtualHost({
          hostname: args.hostname,
          paths: paths,
          projectId: args.projectId || '',
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_virtualhost_create',
        hostname: args.hostname,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_virtualhost_create',
        hostname: args.hostname,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;
    const ingressId = result?.id || result?.ingressId;

    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      ...(args.pathToApp && { pathToApp: args.pathToApp }),
      ...(args.pathToUrl && { pathToUrl: args.pathToUrl }),
      ...(args.pathToContainer && { pathToContainer: args.pathToContainer }),
    };

    return formatToolResponse(
      'success',
      args.quiet ? ingressId : `Successfully created virtual host '${args.hostname}' with ID ${ingressId}`,
      resultData,
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

    logger.error('[WP04] Unexpected error in virtualhost create handler', { error });
    return formatToolResponse('error', `Failed to create virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
