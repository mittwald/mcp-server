import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDomainGetArgs {
  domainId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainGetArgs): string[] {
  return ['domain', 'get', args.domainId, '--output', 'json'];
}

interface ParsedDomainResult {
  item?: Record<string, any>;
  error?: string;
}

function parseDomain(output: string): ParsedDomainResult {
  if (!output) return { error: 'Empty output received from CLI command' };

  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? { item: parsed as Record<string, any> } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldDomainGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('domain')) {
    return `Domain not found: ${args.domainId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainGetCli: MittwaldCliToolHandler<MittwaldDomainGetArgs> = async (args) => {
  if (!args.domainId) {
    return formatToolResponse('error', 'Domain ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { item, error: parseError } = parseDomain(stdout);

    if (!item) {
      return formatToolResponse(
        'success',
        'Domain retrieved (raw output)',
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
      domain: item.domain,
      connected: item.connected,
      deleted: item.deleted,
      nameservers: item.nameservers,
      usesDefaultNameserver: item.usesDefaultNameserver,
      projectId: item.projectId,
      contactHash: item.contactHash,
      authCode: item.authCode,
      id: item.id,
    };

    return formatToolResponse(
      'success',
      `Domain information retrieved for ${args.domainId}`,
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
