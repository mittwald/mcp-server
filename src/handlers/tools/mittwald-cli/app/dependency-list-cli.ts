import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppDependencyListArgs {
  appType?: string;
  appId?: string;
  includeMetadata?: boolean;
}

type RawSystemSoftware = {
  id?: string;
  name?: string;
  tags?: string[];
  meta?: Record<string, unknown> | null;
};

type RawInstalledSystemSoftware = {
  systemSoftwareId?: string;
  systemSoftwareVersion?: {
    current?: string;
    desired?: string;
  } | null;
  updatePolicy?: string;
};

interface AppInstallationDetails {
  id?: string;
  systemSoftware?: RawInstalledSystemSoftware[];
}

function buildCliArgs(): string[] {
  return ['app', 'dependency', 'list', '--output', 'json'];
}

function parseSystemSoftwareList(output: string): RawSystemSoftware[] | undefined {
  if (!output) return undefined;

  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed as RawSystemSoftware[];
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).data)) {
      return (parsed as { data: RawSystemSoftware[] }).data;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseAppInstallation(output: string): AppInstallationDetails | undefined {
  if (!output) return undefined;

  try {
    const parsed = JSON.parse(output) as unknown;
    if (!parsed || typeof parsed !== 'object') return undefined;

    const container = parsed as Record<string, unknown>;

    if ('appInstallation' in container && typeof container.appInstallation === 'object' && container.appInstallation !== null) {
      return container.appInstallation as AppInstallationDetails;
    }

    return parsed as AppInstallationDetails;
  } catch {
    return undefined;
  }
}

function filterDependenciesByType(items: RawSystemSoftware[], appType?: string): RawSystemSoftware[] {
  if (!appType) return items;

  const normalized = appType.trim().toLowerCase();
  return items.filter((item) => item.tags?.some((tag) => tag.toLowerCase() === normalized));
}

function buildInstalledMap(installed?: RawInstalledSystemSoftware[]): Map<string, RawInstalledSystemSoftware> {
  const map = new Map<string, RawInstalledSystemSoftware>();
  if (!installed) return map;

  for (const entry of installed) {
    if (!entry?.systemSoftwareId) continue;
    map.set(entry.systemSoftwareId, entry);
  }

  return map;
}

function formatDependencies(
  items: RawSystemSoftware[],
  installedMap: Map<string, RawInstalledSystemSoftware>,
  includeMetadata: boolean,
) {
  return items.map((item) => {
    const installed = item.id ? installedMap.get(item.id) : undefined;
    const currentVersion = installed?.systemSoftwareVersion?.current;
    const desiredVersion = installed?.systemSoftwareVersion?.desired;

    const updateAvailable = currentVersion && desiredVersion && currentVersion !== desiredVersion;

    const base: Record<string, unknown> = {
      id: item.id,
      name: item.name,
      tags: item.tags ?? [],
      currentVersion,
      desiredVersion,
      updatePolicy: installed?.updatePolicy,
      updateAvailable: updateAvailable ?? false,
    };

    if (!installed) {
      base.updateAvailable = undefined;
    }

    if (includeMetadata && item.meta && typeof item.meta === 'object') {
      base.meta = item.meta;
    }

    return base;
  });
}

function mapListCliError(error: CliToolError): string {
  if (error.stderr?.toLowerCase().includes('unauthorized')) {
    return 'Authentication failed while listing dependencies. Please re-authenticate and try again.';
  }

  return error.message;
}

function mapAppGetError(error: CliToolError, appId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${appId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppDependencyListCli: MittwaldCliToolHandler<MittwaldAppDependencyListArgs> = async (args) => {
  const argv = buildCliArgs();

  try {
    const listResult = await invokeCliTool({
      toolName: 'mittwald_app_dependency_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = listResult.result.stdout ?? '';
    const parsed = parseSystemSoftwareList(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Dependencies retrieved (raw output)',
        { rawOutput: stdout },
        {
          command: listResult.meta.command,
          durationMs: listResult.meta.durationMs,
        },
      );
    }

    let installationDetails: AppInstallationDetails | undefined;

    let enrichmentWarning: string | undefined;

    if (args.appId) {
      try {
        const appResult = await invokeCliTool({
          toolName: 'mittwald_app_get',
          argv: ['app', 'get', args.appId, '--output', 'json'],
          parser: (stdout) => stdout,
        });

        installationDetails = parseAppInstallation(appResult.result);
        if (!installationDetails) {
          enrichmentWarning = 'Unable to parse app installation details; dependency enrichment skipped.';
        }
      } catch (error) {
        if (error instanceof CliToolError) {
          const message = mapAppGetError(error, args.appId);
          return formatToolResponse('error', message, {
            exitCode: error.exitCode,
            stderr: error.stderr,
            stdout: error.stdout,
            suggestedAction: error.suggestedAction,
          });
        }

        return formatToolResponse(
          'error',
          `Failed to fetch app installation details: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const dependencies = filterDependenciesByType(parsed, args.appType);
    const installedMap = buildInstalledMap(installationDetails?.systemSoftware);
    const includeMetadata = Boolean(args.includeMetadata);

    const formatted = formatDependencies(dependencies, installedMap, includeMetadata);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} dependenc${formatted.length === 1 ? 'y' : 'ies'}`,
      {
        filters: {
          appType: args.appType,
          appId: args.appId,
        },
        dependencies: formatted,
      },
      {
        command: listResult.meta.command,
        durationMs: listResult.meta.durationMs,
        ...(enrichmentWarning ? { warnings: [enrichmentWarning] } : {}),
      },
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapListCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
