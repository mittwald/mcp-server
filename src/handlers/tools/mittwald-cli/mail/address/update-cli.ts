import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailAddressUpdateArgs {
  id: string;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

function buildCliArgs(args: MittwaldMailAddressUpdateArgs): string[] {
  const cliArgs: string[] = ['mail', 'address', 'update', args.id];

  if (args.catchAll !== undefined) cliArgs.push(args.catchAll ? '--catch-all' : '--no-catch-all');
  if (args.enableSpamProtection !== undefined) {
    cliArgs.push(args.enableSpamProtection ? '--enable-spam-protection' : '--no-enable-spam-protection');
  }
  if (args.quota) cliArgs.push('--quota', args.quota);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');
  if (args.forwardTo) {
    for (const forwardAddress of args.forwardTo) {
      cliArgs.push('--forward-to', forwardAddress);
    }
  }

  return cliArgs;
}


function extractGeneratedPassword(output: string): string | undefined {
  const passwordMatch = output.match(/password:\s*(.+)/i);
  return passwordMatch ? passwordMatch[1].trim() : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldMailAddressUpdateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when updating mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `Mail address not found: ${args.id}.\nError: ${errorMessage}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${errorMessage}`;
  }

  return `Failed to update mail address: ${errorMessage}`;
}

export const handleMittwaldMailAddressUpdateCli: MittwaldCliToolHandler<MittwaldMailAddressUpdateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_address_update',
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
      ...(args.forwardTo ? { forwardTo: args.forwardTo } : {}),
      ...(args.catchAll !== undefined ? { catchAll: args.catchAll } : {}),
      ...(args.quota ? { quota: args.quota } : {}),
      ...(generatedPassword ? { password: generatedPassword } : {}),
      output,
    };

    const message = `Successfully updated mail address: ${args.id}${generatedPassword ? ' with new generated password' : ''}`;

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
