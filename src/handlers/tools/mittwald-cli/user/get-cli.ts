import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldUserGetArgs {
  userId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawUserProfile {
  userId?: string;
  email?: string;
  person?: {
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  phoneNumber?: string;
  registeredAt?: string;
  mfa?: {
    active?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function buildCliArgs(args: MittwaldUserGetArgs): { argv: string[]; userId: string } {
  const userId = args.userId && args.userId.trim() ? args.userId : 'self';
  const argv = ['user', 'get', userId, '--output', 'json'];
  return { argv, userId };
}

function parseUserProfile(stdout: string): RawUserProfile {
  const lines = stdout.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let jsonSnippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      jsonSnippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(jsonSnippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawUserProfile;
        }
      } catch {
        // Keep collecting until JSON parses
      }
    }

    const parsed = JSON.parse(jsonSnippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawUserProfile;
    }
  }

  const parsed = JSON.parse(stdout);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawUserProfile;
  }

  throw new Error('Unexpected output format from CLI command');
}

function formatUserProfileText(user: RawUserProfile): string {
  const firstName = user.person?.firstName ?? 'N/A';
  const lastName = user.person?.lastName ?? 'N/A';
  const mfaActive = user.mfa?.active ? 'Yes' : 'No';

  return [
    'User Profile:',
    `ID: ${user.userId ?? 'N/A'}`,
    `Email: ${user.email ?? 'N/A'}`,
    `First Name: ${firstName}`,
    `Last Name: ${lastName}`,
    `Phone: ${user.phoneNumber ?? 'N/A'}`,
    `Registered: ${user.registeredAt ?? 'N/A'}`,
    `MFA Active: ${mfaActive}`,
  ].join('\n');
}

function formatUserProfileYaml(user: RawUserProfile): string {
  return Object.entries(user)
    .map(([key, value]) => {
      if (value && typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value ?? 'null'}`;
    })
    .join('\n');
}

function mapCliError(error: CliToolError, userId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`;
  const combinedLower = combined.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no user found')) {
    return `User not found: ${userId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get user: ${rawMessage}`;
}

export const handleUserGetCli: MittwaldCliToolHandler<MittwaldUserGetArgs> = async (args) => {
  const { argv, userId } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const user = parseUserProfile(stdout);
      const outputFormat = args.output ?? 'txt';

      let formattedOutput: string;
      switch (outputFormat) {
        case 'json':
          formattedOutput = JSON.stringify(user, null, 2);
          break;
        case 'yaml':
          formattedOutput = formatUserProfileYaml(user);
          break;
        case 'txt':
        default:
          formattedOutput = formatUserProfileText(user);
          break;
      }

      return formatToolResponse(
        'success',
        `User details for ${userId}:`,
        {
          user,
          formattedOutput,
          format: outputFormat,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'User retrieved (raw output)',
        {
          rawOutput: stdout || stderr,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, userId);
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
