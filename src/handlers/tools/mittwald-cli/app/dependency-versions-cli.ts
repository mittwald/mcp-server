import { Range } from 'semver';

import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppDependencyVersionsArgs {
  dependency: string;
  versionRange?: string;
  recommendedOnly?: boolean;
  includeDependencies?: boolean;
}

type RawDependencyVersion = {
  id?: string;
  externalVersion?: string;
  internalVersion?: string;
  recommended?: boolean;
  expiryDate?: string;
  systemSoftwareDependencies?: Array<{
    systemSoftwareId?: string;
    versionRange?: string;
  }>;
};

function buildCliArgs(dependency: string): string[] {
  return ['app', 'dependency', 'versions', dependency, '--output', 'json'];
}

function parseVersionList(output: string): RawDependencyVersion[] | undefined {
  if (!output) return undefined;

  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed as RawDependencyVersion[];
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).data)) {
      return (parsed as { data: RawDependencyVersion[] }).data;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function filterByVersionRange(
  versions: RawDependencyVersion[],
  rangeExpression: string | undefined,
): {
  filtered: RawDependencyVersion[];
  warning?: string;
} {
  if (!rangeExpression) {
    return { filtered: versions };
  }

  try {
    const range = new Range(rangeExpression, { includePrerelease: true });
    const filtered = versions.filter((version) => {
      if (!version.externalVersion) return false;
      return range.test(version.externalVersion);
    });
    return { filtered };
  } catch (error) {
    const warning = `Invalid version range '${rangeExpression}': ${error instanceof Error ? error.message : String(error)}`;
    return { filtered: versions, warning };
  }
}

function filterRecommended(versions: RawDependencyVersion[], recommendedOnly?: boolean): RawDependencyVersion[] {
  if (!recommendedOnly) return versions;
  return versions.filter((version) => version.recommended === true);
}

function formatVersions(
  versions: RawDependencyVersion[],
  includeDependencies: boolean,
) {
  return versions.map((version) => {
    const base: Record<string, unknown> = {
      id: version.id,
      version: version.externalVersion,
      internalVersion: version.internalVersion,
      recommended: version.recommended ?? false,
      expiryDate: version.expiryDate,
    };

    if (!version.recommended) {
      base.recommended = undefined;
    }

    if (includeDependencies && Array.isArray(version.systemSoftwareDependencies)) {
      base.dependencies = version.systemSoftwareDependencies.map((dependency) => ({
        systemSoftwareId: dependency.systemSoftwareId,
        versionRange: dependency.versionRange,
      }));
    }

    return base;
  });
}

function mapCliError(error: CliToolError, dependency: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('system software') && combined.includes('not found')) {
    return `Dependency not found. Please verify the dependency name: ${dependency}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppDependencyVersionsCli: MittwaldCliToolHandler<MittwaldAppDependencyVersionsArgs> = async (args) => {
  const argv = buildCliArgs(args.dependency);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_dependency_versions',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = parseVersionList(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        `Versions retrieved for ${args.dependency} (raw output)`,
        { rawOutput: stdout },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        },
      );
    }

    const includeDependencies = Boolean(args.includeDependencies);
    const { filtered: rangeFiltered, warning } = filterByVersionRange(parsed, args.versionRange);
    const recommendedFiltered = filterRecommended(rangeFiltered, args.recommendedOnly);
    const formatted = formatVersions(recommendedFiltered, includeDependencies);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} version${formatted.length === 1 ? '' : 's'} for ${args.dependency}`,
      {
        dependency: args.dependency,
        filters: {
          versionRange: args.versionRange,
          recommendedOnly: args.recommendedOnly,
        },
        versions: formatted,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
        ...(warning ? { warnings: [warning] } : {}),
      },
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.dependency);
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
