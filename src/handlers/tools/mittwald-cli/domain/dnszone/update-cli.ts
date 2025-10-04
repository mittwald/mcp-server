import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput, parseQuietOutput } from '../../../../../utils/cli-output.js';

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
  if (args.unset) cliArgs.push('--unset');
  if (args.record) {
    for (const record of args.record) {
      cliArgs.push('--record', record);
    }
  }
  if (args.ttl !== undefined) cliArgs.push('--ttl', String(args.ttl));

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDomainDnszoneUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const baseMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('zone')) {
    return `DNS zone not found: ${args.dnszoneId}.\nError: ${baseMessage}`;
  }

  return `Failed to update DNS zone: ${baseMessage}`;
}

function buildSuccessPayload(
  args: MittwaldDomainDnszoneUpdateArgs,
  stdout: string,
): Record<string, unknown> {
  let parsedData: unknown = null;

  if (args.quiet) {
    const quietResult = parseQuietOutput(stdout);
    if (quietResult) {
      parsedData = { id: quietResult };
    }
  } else if (stdout.trim()) {
    try {
      parsedData = parseJsonOutput(stdout);
    } catch {
      parsedData = { rawOutput: stdout };
    }
  }

  return {
    success: true,
    message: `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
    dnszoneId: args.dnszoneId,
    recordSet: args.recordSet,
    output: stdout || null,
    parsedData,
    recordsSet: args.record || null,
    ttl: args.ttl ?? null,
    managed: args.managed ?? false,
    unset: args.unset ?? false,
  };
}

export const handleDomainDnszoneUpdateCli: MittwaldToolHandler<MittwaldDomainDnszoneUpdateArgs> = async (args) => {
  try {
    const argv = buildCliArgs(args);
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_dnszone_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const payload = buildSuccessPayload(args, stdout);

    return formatToolResponse(
      'success',
      `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      payload,
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
