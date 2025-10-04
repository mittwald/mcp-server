import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';

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

function mapCliError(error: CliToolError, args: MittwaldExtensionInstallCliArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('extension') && combined.includes('not found')) {
    return `Extension not found: ${args.extensionId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found: ${args.projectId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('organization') && combined.includes('not found')) {
    return `Organization not found: ${args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('consent') || combined.includes('scope')) {
    return `Consent required. Please run the command with consent=true to grant permissions.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to install extension: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionInstallCli: MittwaldToolHandler<MittwaldExtensionInstallCliArgs> = async (args) => {
  const validationMessage = validateScope(args);
  if (validationMessage) {
    return formatToolResponse('error', validationMessage);
  }

  const cliArgs: string[] = ['extension', 'install', args.extensionId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.orgId) cliArgs.push('--org-id', args.orgId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.consent) cliArgs.push('--consent');

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_install',
      argv: cliArgs,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

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
          command: result.meta.command,
          durationMs: result.meta.durationMs,
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
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
