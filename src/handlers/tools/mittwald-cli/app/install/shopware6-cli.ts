import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldAppInstallShopware6Args {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  adminFirstname?: string;
  adminLastname?: string;
  siteTitle?: string;
  shopEmail?: string;
  shopLang?: string;
  shopCurrency?: string;
  wait?: boolean;
  waitTimeout?: number;
}

function buildCliArgs(args: MittwaldAppInstallShopware6Args): string[] {
  const cliArgs: string[] = ['app', 'install', 'shopware6'];

  cliArgs.push('--project-id', args.projectId);
  cliArgs.push('--version', args.version ?? 'latest');

  if (args.host) cliArgs.push('--host', args.host);
  if (args.adminUser) cliArgs.push('--admin-user', args.adminUser);
  if (args.adminEmail) cliArgs.push('--admin-email', args.adminEmail);
  if (args.adminPass) cliArgs.push('--admin-pass', args.adminPass);
  if (args.adminFirstname) cliArgs.push('--admin-firstname', args.adminFirstname);
  if (args.adminLastname) cliArgs.push('--admin-lastname', args.adminLastname);
  if (args.siteTitle) cliArgs.push('--site-title', args.siteTitle);
  if (args.shopEmail) cliArgs.push('--shop-email', args.shopEmail);
  if (args.shopLang) cliArgs.push('--shop-lang', args.shopLang);
  if (args.shopCurrency) cliArgs.push('--shop-currency', args.shopCurrency);
  if (args.wait) cliArgs.push('--wait');
  if (typeof args.waitTimeout === 'number') {
    cliArgs.push('--wait-timeout', `${args.waitTimeout}s`);
  }

  return cliArgs;
}

function parseInstallationId(output: string): string | undefined {
  if (!output) return undefined;

  const match = output.match(/(?:ID|id)\s+([a-z0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldAppInstallShopware6Args): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('permission') || stderr.includes('forbidden')) {
    return `Permission denied when installing Shopware 6. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('invalid') && stderr.includes('version')) {
    return `Invalid Shopware 6 version: ${args.version ?? 'latest'}. Please use a valid version number.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('already exists') || stderr.includes('conflict')) {
    return `Shopware 6 installation already exists or conflicts with an existing installation.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppInstallShopware6Cli: MittwaldCliToolHandler<MittwaldAppInstallShopware6Args> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required. Please provide the projectId parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_install_shopware6',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout || result.result.stderr || '';
    const installationId = parseInstallationId(output);

    if (!installationId) {
      return formatToolResponse(
        'success',
'Shopware 6 installation started successfully',
        {
          projectId: args.projectId,
          version: args.version ?? 'latest',
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
    const successMessage = args.wait
      ? `Shopware 6 installation completed successfully with ID ${installationId}`
      : `Shopware 6 installation started with ID ${installationId}`;

    return formatToolResponse(
      'success',
      successMessage,
      {
        appInstallationId: installationId,
        projectId: args.projectId,
        version: args.version ?? 'latest',
        host: args.host,
        adminUser: args.adminUser,
        adminEmail: args.adminEmail,
        adminPass: args.adminPass,
        adminFirstname: args.adminFirstname,
        adminLastname: args.adminLastname,
        siteTitle: args.siteTitle,
        shopEmail: args.shopEmail,
        shopLang: args.shopLang,
        shopCurrency: args.shopCurrency,
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
