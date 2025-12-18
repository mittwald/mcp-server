import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionInstallCliArgs {
  extensionId: string;
  projectId?: string;
  orgId?: string;
  quiet?: boolean;
  consent?: boolean;
}

function validateScope(args: MittwaldExtensionInstallCliArgs) {
  if (!args.projectId && !args.orgId) {
    return 'Either projectId or orgId must be provided';
  }

  if (args.projectId && args.orgId) {
    return 'Only one of projectId or orgId can be provided';
  }

  return undefined;
}


export const handleExtensionInstallCli: MittwaldCliToolHandler<MittwaldExtensionInstallCliArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const validationMessage = validateScope(args);
  if (validationMessage) {
    return formatToolResponse('error', validationMessage);
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const cliArgs = ['extension', 'install', args.extensionId];
    if (args.projectId) cliArgs.push('--project-id', args.projectId);
    if (args.orgId) cliArgs.push('--org-id', args.orgId);
    if (args.quiet) cliArgs.push('--quiet');
    if (args.consent) cliArgs.push('--consent');

    const result = await invokeCliTool({
      toolName: 'mittwald_extension_install',
      argv: [...cliArgs, '--token', session.mittwaldAccessToken],
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = (result.result as any).stdout ?? '';
    const durationMs = result.meta.durationMs;

    if (args.quiet) {
      const extensionInstanceId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        'Extension installed successfully',
        {
          extensionInstanceId,
          extensionId: args.extensionId,
          projectId: args.projectId,
          orgId: args.orgId,
          status: 'installed',
        },
        {
          durationMs,
        }
      );
    }

    const successMessage = stdout || 'Extension installation completed successfully';
    return formatToolResponse(
      'success',
      'Extension installation completed',
      {
        extensionId: args.extensionId,
        projectId: args.projectId,
        orgId: args.orgId,
        status: 'installed',
        output: successMessage,
      },
      {
        durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
      let message = `Failed to install extension: ${error.stderr || error.stdout || error.message}`;

      if (combined.includes('extension') && combined.includes('not found')) {
        message = `Extension not found: ${args.extensionId}.\nError: ${error.stderr || error.stdout || error.message}`;
      } else if (combined.includes('project') && combined.includes('not found')) {
        message = `Project not found: ${args.projectId}.\nError: ${error.stderr || error.stdout || error.message}`;
      } else if (combined.includes('organization') && combined.includes('not found')) {
        message = `Organization not found: ${args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
      } else if (combined.includes('consent') || combined.includes('scope')) {
        message = `Consent required. Please run the command with consent=true to grant permissions.\nError: ${error.stderr || error.stdout || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in extension install handler', { error });
    return formatToolResponse(
      'error',
      `Failed to install extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
