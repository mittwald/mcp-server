import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';


function buildCliArgs(args: MittwaldMailDeliveryboxCreateArgs): string[] {
  const cliArgs: string[] = ['mail', 'deliverybox', 'create', '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldMailDeliveryboxCreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when creating delivery box. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`;
  }

  if (combined.includes('no default project')) {
    return `No default project set. Please provide --project-id or set a default project context.\nError: ${errorMessage}`;
  }

  return `Failed to create delivery box: ${errorMessage}`;
}

interface MittwaldMailDeliveryboxCreateArgs {
  projectId?: string;
  description: string;
  password?: string;
  randomPassword?: boolean;
}

export const handleMittwaldMailDeliveryboxCreateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxCreateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_deliverybox_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    let deliveryBoxId: string | undefined;
    let generatedPassword: string | undefined;

    const idMatch = stdout.match(/ID\s+([a-f0-9-]+)/i);
    if (idMatch) deliveryBoxId = idMatch[1];
    if (args.randomPassword) generatedPassword = stdout ? extractPassword(stdout) : undefined;

    if (!deliveryBoxId) {
      return formatToolResponse(
        'success',
        `Successfully created delivery box '${args.description}'`,
        {
          description: args.description,
          output,
          ...(generatedPassword ? { password: generatedPassword } : {}),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
`Successfully created delivery box '${args.description}' with ID ${deliveryBoxId}${generatedPassword ? ' and generated password' : ''}`,
      {
        id: deliveryBoxId,
        description: args.description,
        ...(generatedPassword ? { password: generatedPassword } : {}),
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};

function extractPassword(output: string): string | undefined {
  const match = output.match(/password:\s*(.+)/i);
  return match ? match[1].trim() : undefined;
}
