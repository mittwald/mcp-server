import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseQuietOutput } from '../../../../../utils/cli-output.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ('api_read' | 'api_write')[];
  quiet?: boolean;
  expires?: string;
}

function buildCliArgs(args: MittwaldUserApiTokenCreateArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'create', '--description', args.description];
  args.roles.forEach((role) => cliArgs.push('--roles', role));
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.quiet ?? true) cliArgs.push('--quiet');
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
    const tokenValue = (parsed as Record<string, unknown>).token;
    if (typeof tokenValue === 'string' && tokenValue) {
      return tokenValue;
    }
  } catch (error) {
    // ignore JSON parsing failures, fallback to regex extraction
  }

  const tokenMatch = trimmed.match(/token\s*[:=]\s*([A-Za-z0-9._-]+)/i) || trimmed.match(/^([A-Za-z0-9._-]+)$/);
  return tokenMatch ? tokenMatch[1] : undefined;
}

export const handleUserApiTokenCreateCli: MittwaldCliToolHandler<MittwaldUserApiTokenCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an API token.');
  }

  if (!Array.isArray(args.roles) || args.roles.length === 0) {
    return buildSecureToolResponse('error', 'At least one role must be specified to create an API token.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_api_token_create',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const token = args.quiet ? parseQuietOutput(stdout) : extractToken(stdout);

    if (!token) {
      return buildSecureToolResponse(
        'error',
        'Failed to create API token - no token returned by CLI.',
        {
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const data = {
      description: args.description,
      roles: args.roles,
      expires: args.expires,
      generatedToken: token,
      tokenGenerated: true,
    };

    const message = args.quiet ? token : 'API token created successfully';

    return buildSecureToolResponse(
      'success',
      message,
      data,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
