import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

export interface MittwaldAppCreateStaticArgs {
  projectId?: string;
  siteTitle?: string;
  documentRoot: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

const parseAppIdFromStdout = (stdout: string): string | undefined => {
  const idMatch = stdout.match(/ID\s+([a-z0-9-]+)/i);
  return idMatch ? idMatch[1] : undefined;
};

const parseQuietIdentifier = (stdout: string): string | undefined => {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.at(-1);
};

export const handleAppCreateStaticCli: MittwaldCliToolHandler<MittwaldAppCreateStaticArgs> = async (args) => {
  if (!args.documentRoot) {
    return formatToolResponse('error', 'Document root is required. Please provide the documentRoot parameter.');
  }

  const argv: string[] = ['app', 'create', 'static', '--document-root', args.documentRoot];

  if (args.projectId) {
    argv.push('--project-id', args.projectId);
  }

  if (args.siteTitle) {
    argv.push('--site-title', args.siteTitle);
  }

  if (args.quiet) {
    argv.push('--quiet');
  }

  if (args.wait) {
    argv.push('--wait');
  }

  if (typeof args.waitTimeout === 'number') {
    argv.push('--wait-timeout', `${args.waitTimeout}s`);
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_create_static',
      argv,
      parser: (stdout, raw) => {
        let appId: string | undefined;
        if (args.quiet) {
          appId = parseQuietIdentifier(stdout ?? '');
        } else {
          appId = parseAppIdFromStdout(stdout ?? '') ?? parseQuietIdentifier(stdout ?? '');
        }

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
      return formatToolResponse('success', 'Static app created', {
        projectId: args.projectId,
        siteTitle: args.siteTitle,
        documentRoot: args.documentRoot,
        output: payload.output,
      }, {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      });
    }

    return formatToolResponse('success', `Successfully created static app with ID ${appInstallationId}`, {
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
