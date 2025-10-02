import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldLoginStatusArgs {
  output?: 'txt' | 'json' | 'yaml';
}

interface LoginStatusResult {
  authenticated?: boolean;
  user?: unknown;
  email?: unknown;
  [key: string]: unknown;
}

function buildCliArgs(outputFormat: string): string[] {
  return ['login', 'status', '--output', outputFormat];
}

function parseJsonStatus(stdout: string): LoginStatusResult {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('CLI returned empty output.');
  }

  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('{') && !line.startsWith('[')) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as LoginStatusResult;
        }
      } catch {
        // Continue accumulating until JSON parses successfully
      }
    }

    const parsed = JSON.parse(snippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as LoginStatusResult;
    }
  }

  const parsed = JSON.parse(trimmed);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as LoginStatusResult;
  }

  throw new Error('Unexpected JSON output format');
}

function deriveAuthenticatedFlag(loginData: LoginStatusResult | undefined, stdout: string): boolean {
  if (loginData?.authenticated === true) return true;
  if (typeof loginData?.user === 'string' && loginData.user) return true;
  if (typeof loginData?.email === 'string' && loginData.email) return true;
  return /logged in/i.test(stdout);
}

function extractFromText(stdout: string): LoginStatusResult {
  const result: LoginStatusResult = {};
  const lines = stdout.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/logged in/i.test(line)) {
      result.authenticated = true;
    }

    const userMatch = line.match(/user:\s*(.+)/i);
    if (userMatch) {
      result.user = userMatch[1].trim();
    }

    const emailMatch = line.match(/email:\s*(.+)/i);
    if (emailMatch) {
      result.email = emailMatch[1].trim();
    }
  }

  return result;
}

function mapCliError(error: CliToolError): { message: string; treatAsSuccess?: boolean } {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (combined.includes('not logged in') || combined.includes('not authenticated')) {
    return { message: 'Not logged in', treatAsSuccess: true };
  }

  if (combined.includes('session') && combined.includes('not found')) {
    return { message: 'No active login session to report', treatAsSuccess: true };
  }

  const rawMessage = stderr || stdout || error.message;
  return { message: `Failed to check login status: ${rawMessage}` };
}

export const handleLoginStatusCli: MittwaldCliToolHandler<MittwaldLoginStatusArgs> = async (args) => {
  const outputFormat = args.output ?? 'json';
  const argv = buildCliArgs(outputFormat);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_login_status',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    if (outputFormat === 'json') {
      try {
        const loginData = parseJsonStatus(stdout);
        const authenticated = deriveAuthenticatedFlag(loginData, stdout);
        const message = authenticated ? 'Logged in' : 'Not logged in';

        return formatToolResponse(
          'success',
          message,
          {
            authenticated,
            loginData,
            formattedOutput: loginData,
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
          'Login status retrieved (raw output)',
          {
            rawOutput: stdout || stderr,
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            format: outputFormat,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }
    }

    const parsed = extractFromText(stdout || stderr);
    const authenticated = deriveAuthenticatedFlag(parsed, stdout || stderr);
    const message = authenticated ? 'Logged in' : 'Not logged in';

    return formatToolResponse(
      'success',
      message,
      {
        authenticated,
        loginData: parsed,
        formattedOutput: stdout || stderr,
        format: outputFormat,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const mapped = mapCliError(error);
      if (mapped.treatAsSuccess) {
        return formatToolResponse(
          'success',
          mapped.message,
          {
            authenticated: false,
            message: mapped.message,
            formattedOutput: error.stdout || error.stderr || mapped.message,
            format: args.output ?? 'json',
          }
        );
      }

      return formatToolResponse('error', mapped.message, {
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
