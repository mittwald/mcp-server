import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppListUpgradeCandidatesArgs {
  installationId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldAppListUpgradeCandidatesArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'list-upgrade-candidates', installationId];

  // We always request JSON to simplify parsing.
  cliArgs.push('--output', 'json');

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawUpgradeCandidate = {
  version?: string;
  releaseDate?: string;
  changelog?: string;
  breaking?: boolean;
  recommended?: boolean;
};

function parseUpgradeCandidates(output: string): RawUpgradeCandidate[] | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return Array.isArray(data) ? data : undefined;
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, installationId: string): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppListUpgradeCandidatesCli: MittwaldCliToolHandler<MittwaldAppListUpgradeCandidatesArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_list_upgrade_candidates',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseUpgradeCandidates(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Upgrade candidates retrieved (raw output)',
        {
          installationId: args.installationId,
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (parsed.length === 0) {
      return formatToolResponse(
        'success',
        'No upgrade candidates available',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formatted = parsed.map((candidate) => ({
      version: candidate.version,
      releaseDate: candidate.releaseDate,
      changelog: candidate.changelog,
      breaking: candidate.breaking,
      recommended: candidate.recommended,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} upgrade candidate(s)`,
      formatted,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.installationId);
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
