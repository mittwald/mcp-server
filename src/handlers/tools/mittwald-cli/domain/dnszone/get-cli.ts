import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDomainDnszoneGetArgs {
  dnszoneId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainDnszoneGetArgs): string[] {
  return ['domain', 'dnszone', 'get', args.dnszoneId, '--output', 'json'];
}

interface ParsedDnszoneResult {
  item?: Record<string, any>;
  error?: string;
}

function parseDnszone(output: string): ParsedDnszoneResult {
  if (!output) return { error: 'Empty output received from CLI command' };

  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? { item: parsed as Record<string, any> } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldDomainDnszoneGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('zone')) {
    return `DNS zone not found: ${args.dnszoneId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainDnszoneGetCli: MittwaldCliToolHandler<MittwaldDomainDnszoneGetArgs> = async (args) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_dnszone_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { item, error: parseError } = parseDnszone(stdout);

    if (!item) {
      return formatToolResponse(
        'success',
        'DNS zone retrieved (raw output)',
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
      domainName: item.domainName,
      projectId: item.projectId,
      recordCount: item.recordCount,
      zone: item.zone,
      domain: item.domain,
      records: item.records || [],
    };

    return formatToolResponse(
      'success',
      `DNS zone information retrieved for ${args.dnszoneId}`,
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
