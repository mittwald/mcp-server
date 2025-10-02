import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldCronjobCreateCliArgs {
  description: string;
  interval: string;
  installationId?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  disable?: boolean;
  timeout?: string;
}

function buildCliArgs(args: MittwaldCronjobCreateCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'create'];

  cliArgs.push('--description', args.description);
  cliArgs.push('--interval', args.interval);

  if (args.installationId) {
    cliArgs.push('--installation-id', args.installationId);
  }

  if (args.email) {
    cliArgs.push('--email', args.email);
  }

  if (args.url) {
    cliArgs.push('--url', args.url);
  }

  if (args.command) {
    cliArgs.push('--command', args.command);
  }

  if (args.interpreter) {
    cliArgs.push('--interpreter', args.interpreter);
  }

  if (args.disable) {
    cliArgs.push('--disable');
  }

  if (args.timeout) {
    cliArgs.push('--timeout', args.timeout);
  }

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldCronjobCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `Installation not found. Please verify the installation ID: ${args.installationId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('cron expression')) {
    return `Invalid cron expression: ${args.interval}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleCronjobCreateCli: MittwaldToolHandler<MittwaldCronjobCreateCliArgs> = async (args, _context) => {
  if (!args.description) {
    return formatToolResponse('error', 'Description is required.');
  }

  if (!args.interval) {
    return formatToolResponse('error', 'Interval is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    return formatToolResponse(
      'success',
      'Cronjob created successfully',
      {
        output: stdout || stderr,
        description: args.description,
        interval: args.interval,
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
