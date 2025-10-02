import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldAppInstallTypo3Args {
  projectId: string;
  version?: string;
  installMode?: 'composer' | 'symlink';
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  siteTitle?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

function buildCliArgs(args: MittwaldAppInstallTypo3Args): string[] {
  const cliArgs: string[] = ['app', 'install', 'typo3'];

  cliArgs.push('--project-id', args.projectId);
  cliArgs.push('--version', args.version ?? 'latest');
  cliArgs.push('--install-mode', args.installMode ?? 'composer');

  if (args.host) cliArgs.push('--host', args.host);
  if (args.adminUser) cliArgs.push('--admin-user', args.adminUser);
  if (args.adminEmail) cliArgs.push('--admin-email', args.adminEmail);
  if (args.adminPass) cliArgs.push('--admin-pass', args.adminPass);
  if (args.siteTitle) cliArgs.push('--site-title', args.siteTitle);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.wait) cliArgs.push('--wait');
  if (typeof args.waitTimeout === 'number') {
    cliArgs.push('--wait-timeout', `${args.waitTimeout}s`);
  }

  return cliArgs;
}

function parseInstallationId(output: string, quiet: boolean | undefined): string | undefined {
  if (!output) return undefined;
  if (quiet) {
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines.at(-1);
  }

  const match = output.match(/(?:ID|id)\s+([a-z0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldAppInstallTypo3Args): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('permission') || stderr.includes('forbidden')) {
    return `Permission denied when installing TYPO3. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('invalid') && stderr.includes('version')) {
    return `Invalid TYPO3 version: ${args.version ?? 'latest'}. Please use a valid version number.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('invalid') && stderr.includes('install-mode')) {
    return `Invalid install mode: ${args.installMode ?? 'composer'}. Valid options are 'composer' or 'symlink'.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('already exists') || stderr.includes('conflict')) {
    return `TYPO3 installation already exists or conflicts with an existing installation.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppInstallTypo3Cli: MittwaldCliToolHandler<MittwaldAppInstallTypo3Args> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required. Please provide the projectId parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_install_typo3',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout || result.result.stderr || '';
    const installationId = parseInstallationId(output, args.quiet);

    if (!installationId) {
      return formatToolResponse(
        'success',
        args.quiet ? output : 'TYPO3 installation started successfully',
        {
          projectId: args.projectId,
          version: args.version ?? 'latest',
          installMode: args.installMode ?? 'composer',
          siteTitle: args.siteTitle,
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const status = args.wait ? 'completed' : 'installing';
    const successMessage = args.quiet
      ? installationId
      : args.wait
        ? `TYPO3 installation completed successfully with ID ${installationId}`
        : `TYPO3 installation started with ID ${installationId}`;

    return formatToolResponse(
      'success',
      successMessage,
      {
        appInstallationId: installationId,
        projectId: args.projectId,
        version: args.version ?? 'latest',
        installMode: args.installMode ?? 'composer',
        host: args.host,
        adminUser: args.adminUser,
        adminEmail: args.adminEmail,
        adminPass: args.adminPass,
        siteTitle: args.siteTitle,
        status,
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
