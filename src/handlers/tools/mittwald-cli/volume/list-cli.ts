import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { formatTable } from '../../../../utils/format-table.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldVolumeListArgs {
  projectId: string;
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export interface RawVolume {
  id?: string;
  name?: string;
  stackId?: string;
  orphaned?: boolean;
  linkedServices?: Array<{ id?: string; name?: string }> | null;
  storageUsageInBytes?: number | null;
  storageUsageInBytesSetAt?: string | null;
}

export interface FormattedVolume {
  id?: string;
  name: string;
  stackId?: string;
  orphaned: boolean;
  mountedServiceCount: number;
  mountedServices: Array<{ id?: string; name?: string }>;
  storage: {
    bytes?: number;
    formatted?: string;
    updatedAt?: string | null;
  };
}

function buildCliArgs(args: MittwaldVolumeListArgs): string[] {
  const cliArgs: string[] = ['volume', 'list', '--output', 'json'];

  cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function safeParseVolumes(output: string): RawVolume[] | undefined {
  if (!output) return undefined;

  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed as RawVolume[];
    }
    return undefined;
  } catch (error) {
    logger.error('[Volume List] Failed to parse CLI output as JSON', { error });
    return undefined;
  }
}

function formatBytes(value?: number | null): string | undefined {
  if (!value || Number.isNaN(value)) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function mapVolume(raw: RawVolume): FormattedVolume {
  const linkedServices = Array.isArray(raw.linkedServices) ? raw.linkedServices.filter(Boolean) : [];

  return {
    id: raw.id,
    name: raw.name ?? raw.id ?? 'unknown',
    stackId: raw.stackId ?? undefined,
    orphaned: Boolean(raw.orphaned),
    mountedServiceCount: linkedServices.length,
    mountedServices: linkedServices,
    storage: {
      bytes: typeof raw.storageUsageInBytes === 'number' ? raw.storageUsageInBytes : undefined,
      formatted: typeof raw.storageUsageInBytes === 'number' ? formatBytes(raw.storageUsageInBytes) : undefined,
      updatedAt: raw.storageUsageInBytesSetAt ?? null,
    },
  };
}

function buildVolumeTable(volumes: FormattedVolume[]): string {
  const tableData = volumes.map((volume) => ({
    ID: volume.id ?? '-',
    NAME: volume.name,
    USAGE: volume.storage.formatted ?? 'unknown',
    UPDATED_AT: volume.storage.updatedAt ?? '-',
    STATUS: volume.orphaned
      ? 'orphaned'
      : volume.mountedServiceCount > 0
        ? `${volume.mountedServiceCount} service(s)`
        : 'unmounted',
  }));

  return formatTable(tableData, { showHeaders: true, truncate: true });
}

function mapCliError(error: CliToolError, args: MittwaldVolumeListArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}\n${error.message}`.toLowerCase();

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found. Verify the project ID: ${args.projectId}.`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized')) {
    return 'Authentication with Mittwald CLI failed. Re-run OAuth authentication and try again.';
  }

  return `Failed to list volumes. ${error.stderr || error.message}`;
}

export const handleVolumeListCli: MittwaldCliToolHandler<MittwaldVolumeListArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required to list volumes.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_volume_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = safeParseVolumes(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Volumes retrieved (raw output)',
        { rawOutput: stdout },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (parsed.length === 0) {
      return formatToolResponse(
        'success',
        'No volumes found for this project.',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const volumes = parsed.map(mapVolume);

    return formatToolResponse(
      'success',
      `Found ${volumes.length} volume(s).`,
      {
        volumes,
        table: buildVolumeTable(volumes),
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
