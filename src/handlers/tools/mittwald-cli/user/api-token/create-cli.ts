import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ("api_read" | "api_write")[];
  quiet?: boolean;
  expires?: string;
}

function buildCliArgs(args: MittwaldUserApiTokenCreateArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'create', '--description', args.description];
  args.roles.forEach((role) => cliArgs.push('--roles', role));
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.quiet) cliArgs.push('--quiet');
  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const details = stderr || stdout || error.message;
  return `Failed to create API token: ${details}`;
}

function extractToken(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && 'token' in parsed) {
      const tokenValue = (parsed as Record<string, unknown>).token;
      if (typeof tokenValue === 'string' && tokenValue) {
        return tokenValue;
      }
    }
  } catch (error) {
    // ignore JSON parsing failures, fallback to regex extraction
  }

  const tokenMatch = trimmed.match(/token\s*[:=]\s*([A-Za-z0-9._-]+)/i) || trimmed.match(/^([A-Za-z0-9._-]+)$/);
  return tokenMatch ? tokenMatch[1] : undefined;
}

export const handleUserApiTokenCreateCli: MittwaldCliToolHandler<MittwaldUserApiTokenCreateArgs> = async (args) => {
  try {
    if (!args.description) {
      return formatToolResponse('error', 'Description is required to create an API token.');
    }

    if (!Array.isArray(args.roles) || args.roles.length === 0) {
      return formatToolResponse('error', 'At least one role must be specified to create an API token.');
    }

    const argv = buildCliArgs(args);

    const result = await invokeCliTool({
      toolName: 'mittwald_user_api_token_create',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    if (args.quiet) {
      const token = parseQuietOutput(stdout);
      if (!token) {
        return formatToolResponse('error', 'Failed to create API token - no token returned.');
      }

      return formatToolResponse(
        'success',
        token,
        {
          token,
          description: args.description,
          roles: args.roles,
          expires: args.expires,
        },
        commandMeta
      );
    }

    const token = extractToken(stdout);
    if (!token) {
      return formatToolResponse('error', 'Failed to create API token - no token in output.');
    }

    return formatToolResponse(
      'success',
      'API token created successfully',
      {
        token,
        description: args.description,
        roles: args.roles,
        expires: args.expires,
        rawOutput: stdout,
      },
      commandMeta
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
