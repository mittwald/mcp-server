import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailDeliveryboxUpdateArgs {
  id: string;
  description?: string;
  password?: string;
  randomPassword?: boolean;
}

function buildCliArgs(args: MittwaldMailDeliveryboxUpdateArgs): string[] {
  const cliArgs: string[] = ['mail', 'deliverybox', 'update', args.id];
  if (args.description) cliArgs.push('--description', args.description);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');
  return cliArgs;
}


function extractGeneratedPassword(output: string): string | undefined {
  const match = output.match(/password:\s*(.+)/i);
  return match ? match[1].trim() : undefined;
}

function mapCliError(error: CliToolError, id: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when updating delivery box. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Delivery box not found: ${id}.\nError: ${errorMessage}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${errorMessage}`;
  }

  return `Failed to update delivery box: ${errorMessage}`;
}

export const handleMittwaldMailDeliveryboxUpdateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxUpdateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_deliverybox_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    let generatedPassword: string | undefined;

    if (args.randomPassword) {
      generatedPassword = extractGeneratedPassword(stdout);
    }

    const resultData = {
      id: args.id,
      updated: true,
      ...(args.description ? { description: args.description } : {}),
      ...(generatedPassword ? { password: generatedPassword } : {}),
      output,
    };

    const message = `Successfully updated delivery box: ${args.id}${generatedPassword ? ' with new generated password' : ''}`;

    return formatToolResponse(
      'success',
      message,
      resultData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.id);
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
