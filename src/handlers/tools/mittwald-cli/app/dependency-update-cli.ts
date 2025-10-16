import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface DependencyUpdateInput {
  dependency: string;
  version: string;
}

interface MittwaldAppDependencyUpdateArgs {
  appId?: string;
  dependency?: string;
  version?: string;
  updates?: DependencyUpdateInput[];
  updatePolicy?: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
  quiet?: boolean;
}

interface PreparedUpdate {
  dependency: string;
  version: string;
  spec: string;
}

function collectUpdates(args: MittwaldAppDependencyUpdateArgs): { updates: PreparedUpdate[]; error?: string } {
  const updates: PreparedUpdate[] = [];

  if (args.dependency && args.version) {
    updates.push({ dependency: args.dependency, version: args.version, spec: `${args.dependency}=${args.version}` });
  }

  if (Array.isArray(args.updates)) {
    for (const entry of args.updates) {
      if (!entry?.dependency || !entry?.version) {
        return { updates: [], error: 'Each entry in updates must include both dependency and version values.' };
      }
      updates.push({ dependency: entry.dependency, version: entry.version, spec: `${entry.dependency}=${entry.version}` });
    }
  }

  if (updates.length === 0) {
    return { updates: [], error: 'At least one dependency update is required. Provide dependency/version or populate the updates array.' };
  }

  return { updates };
}

function buildCliArgs(appId: string, prepared: PreparedUpdate[], args: MittwaldAppDependencyUpdateArgs): string[] {
  const cliArgs: string[] = ['app', 'dependency', 'update', appId];

  if (args.quiet) cliArgs.push('--quiet');

  for (const update of prepared) {
    cliArgs.push('--set', update.spec);
  }

  if (args.updatePolicy) {
    cliArgs.push('--update-policy', args.updatePolicy);
  }

  return cliArgs;
}

function mapCliError(error: CliToolError, appId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('unknown system software')) {
    return `Unknown dependency specified. Verify the dependency name and try again.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('version spec') && combined.includes('not a valid semver constraint')) {
    return `Invalid version constraint provided. Please supply a valid semver range.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('no versions found')) {
    return `No versions found that satisfy the provided constraint. Adjust the version value and retry.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Verify the installation ID: ${appId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function summarizeOutput(stdout: string, stderr: string, quiet: boolean | undefined): { message: string; details: string } {
  const output = stdout.trim() || stderr.trim();

  if (!output) {
    return {
      message: 'App dependencies updated successfully',
      details: quiet ? 'CLI executed in quiet mode; no output received.' : 'Processed without additional CLI output.',
    };
  }

  if (quiet) {
    const lines = output.split(/\r?\n/).filter(Boolean);
    const summary = lines.at(-1) ?? 'App dependencies updated successfully';
    return {
      message: summary,
      details: output,
    };
  }

  return {
    message: 'App dependencies updated successfully',
    details: output,
  };
}

export const handleAppDependencyUpdateCli: MittwaldCliToolHandler<MittwaldAppDependencyUpdateArgs> = async (args) => {
  if (!args.appId) {
    return formatToolResponse('error', 'App installation ID is required. Please provide the appId parameter.');
  }

  const { updates, error: validationError } = collectUpdates(args);
  if (validationError) {
    return formatToolResponse('error', validationError);
  }

  const argv = buildCliArgs(args.appId, updates, args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_dependency_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
        timeout: 600_000,
      },
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const summary = summarizeOutput(stdout, stderr, args.quiet);

    return formatToolResponse(
      'success',
      summary.message,
      {
        appId: args.appId,
        updates: updates.map(({ dependency, version }) => ({ dependency, version })),
        updatePolicy: args.updatePolicy ?? 'patchLevel',
        quiet: Boolean(args.quiet),
        output: summary.details,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      },
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.appId);
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
