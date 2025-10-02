import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

export interface MittwaldAppCreateNodeArgs {
  projectId?: string;
  siteTitle?: string;
  entrypoint?: string;
  wait?: boolean;
  waitTimeout?: number;
}

function parseAppIdFromStdout(stdout: string): string | undefined {
  const idMatch = stdout.match(/ID\s+([a-z0-9-]+)/i);
  return idMatch ? idMatch[1] : undefined;
}


export const handleAppCreateNodeCli: MittwaldCliToolHandler<MittwaldAppCreateNodeArgs> = async (args) => {
  const argv: string[] = ['app', 'create', 'node'];

  if (args.projectId) {
    argv.push('--project-id', args.projectId);
  }

  if (args.siteTitle) {
    argv.push('--site-title', args.siteTitle);
  }

  if (args.entrypoint) {
    argv.push('--entrypoint', args.entrypoint);
  }


  if (args.wait) {
    argv.push('--wait');
  }

  if (typeof args.waitTimeout === 'number') {
    argv.push('--wait-timeout', `${args.waitTimeout}s`);
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_create_node',
      argv,
      parser: (stdout, raw) => {
        const appId = parseAppIdFromStdout(stdout ?? '');

        return {
          appInstallationId: appId,
          output: stdout,
          meta: raw,
        };
      },
    });

    const payload = result.result;
    const appInstallationId = payload.appInstallationId;

    if (!appInstallationId) {
      return formatToolResponse('success', 'Node.js app created', {
        projectId: args.projectId,
        siteTitle: args.siteTitle,
        entrypoint: args.entrypoint ?? 'yarn start',
        output: payload.output,
      }, {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      });
    }

    return formatToolResponse('success', `Successfully created Node.js app with ID ${appInstallationId}`, {
      appInstallationId,
      projectId: args.projectId,
      siteTitle: args.siteTitle,
      entrypoint: args.entrypoint ?? 'yarn start',
    }, {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    });
  } catch (error) {
    if (error instanceof CliToolError) {
      return formatToolResponse('error', error.message, {
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
