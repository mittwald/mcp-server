import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  quiet?: boolean;
  pathToApp?: string[];
  pathToUrl?: string[];
  pathToContainer?: string[];
}

function buildCliArgs(args: MittwaldDomainVirtualhostCreateArgs): string[] {
  const cliArgs: string[] = ['domain', 'virtualhost', 'create', '--hostname', args.hostname];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');

  if (args.pathToApp) {
    for (const mapping of args.pathToApp) cliArgs.push('--path-to-app', mapping);
  }

  if (args.pathToUrl) {
    for (const mapping of args.pathToUrl) cliArgs.push('--path-to-url', mapping);
  }

  if (args.pathToContainer) {
    for (const mapping of args.pathToContainer) cliArgs.push('--path-to-container', mapping);
  }

  return cliArgs;
}

function parseQuietId(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function extractIngressId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  return match?.[1];
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostCreateArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/403|forbidden|permission denied/i.test(combined)) {
    const note = args.hostname?.includes('.project.space')
      ? 'Subdomains on .project.space may not be allowed. Try using a custom domain instead.'
      : 'Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.';
    return `Permission denied when creating virtual host. ${note}\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/not found/i.test(combined) && /project/i.test(combined)) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/invalid/i.test(combined) && /format/i.test(combined)) {
    return `Invalid format in request. Please check your path mappings.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to create virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostCreateCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostCreateArgs> = async (args) => {
  if (!args.hostname) {
    return formatToolResponse('error', 'Hostname is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_virtualhost_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr ?? '' }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    const ingressId = args.quiet
      ? parseQuietId(stdout) ?? parseQuietId(stderr)
      : extractIngressId(stdout);

    if (!ingressId) {
      return formatToolResponse(
        'success',
        args.quiet ? stdout : `Successfully created virtual host '${args.hostname}'`,
        {
          hostname: args.hostname,
          output: stdout,
          stderr,
          pathToApp: args.pathToApp,
          pathToUrl: args.pathToUrl,
          pathToContainer: args.pathToContainer,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      ...(args.pathToApp && { pathToApp: args.pathToApp }),
      ...(args.pathToUrl && { pathToUrl: args.pathToUrl }),
      ...(args.pathToContainer && { pathToContainer: args.pathToContainer }),
    };

    return formatToolResponse(
      'success',
      args.quiet ? ingressId : `Successfully created virtual host '${args.hostname}' with ID ${ingressId}`,
      resultData,
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
