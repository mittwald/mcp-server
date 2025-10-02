import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDomainVirtualhostGetArgs {
  virtualhostId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainVirtualhostGetArgs): string[] {
  return ['domain', 'virtualhost', 'get', args.virtualhostId, '--output', 'json'];
}

interface ParsedVirtualhostResult {
  item?: Record<string, any>;
  error?: string;
}

function parseVirtualhost(output: string): ParsedVirtualhostResult {
  if (!output) return { error: 'Empty output received from CLI command' };

  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? { item: parsed as Record<string, any> } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/not found/i.test(combined)) {
    return `Virtual host not found: ${args.virtualhostId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/403|forbidden|permission denied/i.test(combined)) {
    return `Permission denied when retrieving virtual host. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to get virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostGetCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostGetArgs> = async (args) => {
  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_virtualhost_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr ?? '' }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { item, error: parseError } = parseVirtualhost(stdout);

    if (!item) {
      return formatToolResponse(
        'success',
        'Virtual host retrieved (raw output)',
        {
          rawOutput: stdout,
          stderr,
          parseError,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formattedData = {
      id: item.id,
      hostname: item.hostname,
      projectId: item.projectId,
      paths: item.paths,
      status: item.status,
      ips: item.ips,
      dnsValidationErrors: item.dnsValidationErrors ?? [],
    };

    return formatToolResponse(
      'success',
      `Virtual host details for ${formattedData.hostname ?? args.virtualhostId}`,
      formattedData,
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
