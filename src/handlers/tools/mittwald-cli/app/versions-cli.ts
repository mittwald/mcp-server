import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppVersionsArgs {
  app?: string;
}

type VersionsResult = unknown;

function buildCliArgs(args: MittwaldAppVersionsArgs): string[] {
  const cliArgs: string[] = ['app', 'versions'];
  if (args.app) cliArgs.push(args.app);
  return cliArgs;
}

function parseJsonOutput(output: string): VersionsResult | undefined {
  if (!output) return undefined;

  try {
    return JSON.parse(output);
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldAppVersionsArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('app')) {
    return `App not found. Please verify the app name: ${args.app ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppVersionsCli: MittwaldCliToolHandler<MittwaldAppVersionsArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_versions',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseJsonOutput(stdout);

    if (parsed !== undefined) {
      return formatToolResponse(
        'success',
        args.app ? `Found versions for ${args.app}` : 'Found available apps and versions',
        parsed,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const output = stdout || result.result.stderr || 'No versions found';

    return formatToolResponse(
      'success',
      args.app ? `Versions for ${args.app}` : 'Available apps and versions',
      {
        app: args.app,
        rawOutput: output,
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
