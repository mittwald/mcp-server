import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContextGetArgs {
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldContextGetArgs): string[] {
  const cliArgs: string[] = ['context', 'get'];
  const outputFormat = args.output ?? 'json';
  cliArgs.push('--output', outputFormat);
  return cliArgs;
}

type JsonContextResult = {
  ok: true;
  value: Record<string, unknown>;
} | {
  ok: false;
  error: string;
}

function parseJsonContext(output: string): JsonContextResult {
  if (!output) {
    return { ok: true, value: {} };
  }

  try {
    const parsed = JSON.parse(output);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ok: true, value: parsed as Record<string, unknown> };
    }
    return { ok: true, value: {} };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

function parseTextContext(output: string): Record<string, string> {
  const context: Record<string, string> = {};
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      context[key] = value;
    }
  }
  return context;
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  if (combined.includes('no context parameters')) {
    return 'No context parameters are currently set';
  }
  return error.message;
}

export const handleContextGetCli: MittwaldCliToolHandler<MittwaldContextGetArgs> = async (args) => {
  const outputFormat = args.output ?? 'json';
  const argv = buildCliArgs({ output: outputFormat });

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_context_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const trimmed = stdout.trim();

    if (outputFormat === 'json') {
      const parsed = parseJsonContext(trimmed);

      if (!parsed.ok) {
        return formatToolResponse(
          'success',
          'Context retrieved (raw output)',
          {
            rawOutput: stdout,
            parseError: parsed.error,
            format: outputFormat,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const contextEntries = Object.entries(parsed.value).filter(([, value]) => Boolean(value));
      const message = contextEntries.length > 0
        ? `Found ${contextEntries.length} context parameter(s)`
        : 'No context parameters set';

      return formatToolResponse(
        'success',
        message,
        {
          context: parsed.value,
          formattedOutput: parsed.value,
          format: outputFormat,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formattedOutput = trimmed;
    const contextData = outputFormat === 'txt' ? parseTextContext(trimmed) : {};
    const contextEntries = Object.entries(contextData).filter(([, value]) => Boolean(value));
    const message = contextEntries.length > 0
      ? `Found ${contextEntries.length} context parameter(s)`
      : 'No context parameters set';

    return formatToolResponse(
      'success',
      message,
      {
        context: contextData,
        formattedOutput,
        format: outputFormat,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      if (combined.includes('No context parameters')) {
        return formatToolResponse(
          'success',
          'No context parameters are currently set',
          {
            context: {},
            message: 'No context parameters are currently set',
            formattedOutput: combined.trim(),
            format: outputFormat,
          },
          error.command
            ? {
                command: error.command,
              }
            : undefined
        );
      }

      const message = mapCliError(error);
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
