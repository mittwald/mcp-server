import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldMailAddressCreateArgs {
  address: string;
  projectId?: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

function buildCliArgs(args: MittwaldMailAddressCreateArgs): string[] {
  const cliArgs: string[] = ['mail', 'address', 'create', '--address', args.address];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.catchAll) cliArgs.push('--catch-all');

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

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractGeneratedPassword(output: string): string | undefined {
  const passwordMatch = output.match(/password:\s*(.+)/i);
  return passwordMatch ? passwordMatch[1].trim() : undefined;
}

function extractAddressId(output: string): string | undefined {
  const idMatch = output.match(/ID\s+([a-z0-9-]+)/i);
  return idMatch ? idMatch[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldMailAddressCreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when creating mail address. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`;
  }

  if (combined.includes('already exists') || combined.includes('conflict')) {
    return `Mail address already exists: ${args.address}.\nError: ${errorMessage}`;
  }

  if (combined.includes('invalid') && combined.includes('address')) {
    return `Invalid mail address format: ${args.address}.\nError: ${errorMessage}`;
  }

  if (combined.includes('no default project')) {
    return `No default project set. Please provide --project-id or set a default project context.\nError: ${errorMessage}`;
  }

  return `Failed to create mail address: ${errorMessage}`;
}

export const handleMittwaldMailAddressCreateCli: MittwaldCliToolHandler<MittwaldMailAddressCreateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_mail_address_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr;

    let addressId: string | undefined;
    let generatedPassword: string | undefined;

    if (args.quiet) {
      const quietResult = parseQuietOutput(stdout);
      if (quietResult) {
        if (args.randomPassword) {
          const [idPart, passwordPart] = quietResult.split('\t');
          addressId = idPart;
          generatedPassword = passwordPart ? passwordPart.trim() : undefined;
        } else {
          addressId = quietResult;
        }
      }
    } else {
      addressId = extractAddressId(stdout);
      if (args.randomPassword) {
        generatedPassword = extractGeneratedPassword(stdout);
      }
    }

    if (!addressId) {
      const message = args.quiet ? output || 'Successfully created mail address' : `Successfully created mail address '${args.address}'`;
      return formatToolResponse(
        'success',
        message,
        {
          address: args.address,
          output,
          ...(generatedPassword ? { password: generatedPassword } : {}),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const resultData = {
      id: addressId,
      address: args.address,
      ...(args.forwardTo ? { forwardTo: args.forwardTo } : {}),
      ...(args.catchAll ? { catchAll: args.catchAll } : {}),
      ...(args.quota ? { quota: args.quota } : {}),
      ...(generatedPassword ? { password: generatedPassword } : {}),
    };

    const message = args.quiet
      ? (generatedPassword ? `${addressId}\t${generatedPassword}` : addressId)
      : `Successfully created mail address '${args.address}' with ID ${addressId}${generatedPassword ? ' and generated password' : ''}`;

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
