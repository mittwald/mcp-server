import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDdevInitArgs {
  directory?: string;
  appId?: string;
  serverId?: string;
  projectId?: string;
  sshHost?: string;
  sshUser?: string;
  documentRoot?: string;
  ddevDirectory?: string;
  workingCopy?: boolean;
}

function buildCliArgs(args: MittwaldDdevInitArgs): string[] {
  const cliArgs: string[] = ['ddev', 'init'];

  if (args.directory) cliArgs.push('--directory', args.directory);
  if (args.appId) cliArgs.push('--app-id', args.appId);
  if (args.serverId) cliArgs.push('--server-id', args.serverId);
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.sshHost) cliArgs.push('--ssh-host', args.sshHost);
  if (args.sshUser) cliArgs.push('--ssh-user', args.sshUser);
  if (args.documentRoot) cliArgs.push('--document-root', args.documentRoot);
  if (args.ddevDirectory) cliArgs.push('--ddev-directory', args.ddevDirectory);
  if (args.workingCopy) cliArgs.push('--working-copy');

  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('directory already exists')) {
    return `DDEV directory already exists.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('not found')) {
    return `Resource not found.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `DDEV init failed: ${error.stderr || error.stdout || error.message}`;
}

function parseDdevDirectory(output: string): string | null {
  const match = output.match(/Created DDEV configuration in: (.+)/);
  return match ? match[1] : null;
}

export const handleDdevInitCli: MittwaldCliToolHandler<MittwaldDdevInitArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ddev_init',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const ddevDirectory = parseDdevDirectory(stdout);

    return formatToolResponse(
      'success',
      'DDEV project initialized successfully',
      {
        success: true,
        message: 'DDEV project initialized successfully',
        ddevDirectory,
        output: stdout || null,
        timestamp: new Date().toISOString(),
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
