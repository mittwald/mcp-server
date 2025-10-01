import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput as parseJsonOutputLegacy, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDomainDnszoneUpdateArgs {
  dnszoneId: string;
  recordSet: 'a' | 'mx' | 'txt' | 'srv' | 'cname';
  projectId?: string;
  set?: string[];
  recordId?: string;
  unset?: string[];
  quiet?: boolean;
  managed?: boolean;
  record?: string[];
  ttl?: number;
}

function buildCliArgs(args: MittwaldDomainDnszoneUpdateArgs): string[] {
  const cliArgs: string[] = ['domain', 'dnszone', 'update', args.dnszoneId, args.recordSet];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.managed) cliArgs.push('--managed');
  if (args.unset && args.unset.length > 0) cliArgs.push('--unset');
  if (Array.isArray(args.record)) {
    for (const record of args.record) {
      cliArgs.push('--record', record);
    }
  }
  if (typeof args.ttl === 'number') cliArgs.push('--ttl', String(args.ttl));

  // Legacy fields `set` and `recordId` are ignored: the CLI does not expose equivalent flags.

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDomainDnszoneUpdateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const detail = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('zone')) {
    return `DNS zone not found: ${args.dnszoneId}.\nError: ${detail}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when updating DNS zone ${args.dnszoneId}. Ensure you are authenticated and have access rights.\nError: ${detail}`;
  }

  if (combined.includes('managed records') && args.managed) {
    return `Failed to reset managed records for DNS zone ${args.dnszoneId}: ${detail}`;
  }

  return `Failed to update DNS zone: ${detail}`;
}

function parseCommandOutput(stdout: string): { parsed: unknown; raw: string } {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return { parsed: null, raw: '' };
  }

  try {
    const parsed = parseJsonOutputLegacy(trimmed);
    return { parsed, raw: trimmed };
  } catch {
    return { parsed: { rawOutput: trimmed }, raw: trimmed };
  }
}

export const handleDomainDnszoneUpdateCli: MittwaldCliToolHandler<MittwaldDomainDnszoneUpdateArgs> = async (args) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
  }

  if (!args.recordSet) {
    return formatToolResponse('error', 'Record set type is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_dnszone_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const message = `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`;

    if (args.quiet) {
      const quietId = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);
      return formatToolResponse(
        'success',
        message,
        {
          dnszoneId: args.dnszoneId,
          recordSet: args.recordSet,
          projectId: args.projectId,
          recordValues: args.record ?? undefined,
          ttl: args.ttl,
          managed: Boolean(args.managed),
          unset: Boolean(args.unset && args.unset.length > 0),
          quietId,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const { parsed, raw } = parseCommandOutput(stdout);

    return formatToolResponse(
      'success',
      message,
      {
        dnszoneId: args.dnszoneId,
        recordSet: args.recordSet,
        projectId: args.projectId,
        recordValues: args.record ?? undefined,
        ttl: args.ttl,
        managed: Boolean(args.managed),
        unset: Boolean(args.unset && args.unset.length > 0),
        stdout: raw,
        stderr,
        parsed,
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
