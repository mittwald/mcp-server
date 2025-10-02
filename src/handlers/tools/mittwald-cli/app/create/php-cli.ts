import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

export interface MittwaldAppCreatePhpArgs {
  projectId?: string;
  siteTitle?: string;
  documentRoot: string;
  wait?: boolean;
  waitTimeout?: number;
}

const parseAppIdFromStdout = (stdout: string): string | undefined => {
  const idMatch = stdout.match(/ID\s+([a-z0-9-]+)/i);
  return idMatch ? idMatch[1] : undefined;
};


export const handleAppCreatePhpCli: MittwaldCliToolHandler<MittwaldAppCreatePhpArgs> = async (args) => {
  if (!args.documentRoot) {
    return formatToolResponse('error', 'Document root is required. Please provide the documentRoot parameter.');
  }

  const argv: string[] = ['app', 'create', 'php', '--document-root', args.documentRoot];

  if (args.projectId) {
    argv.push('--project-id', args.projectId);
  }

  if (args.siteTitle) {
    argv.push('--site-title', args.siteTitle);
  }


  if (args.wait) {
    argv.push('--wait');
  }

  if (typeof args.waitTimeout === 'number') {
    argv.push('--wait-timeout', `${args.waitTimeout}s`);
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_create_php',
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
      return formatToolResponse('success', 'PHP app created', {
        projectId: args.projectId,
        siteTitle: args.siteTitle,
        documentRoot: args.documentRoot,
        output: payload.output,
      }, {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      });
    }

    return formatToolResponse('success', `Successfully created PHP app with ID ${appInstallationId}`, {
      appInstallationId,
      projectId: args.projectId,
      siteTitle: args.siteTitle,
      documentRoot: args.documentRoot,
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
