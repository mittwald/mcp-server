import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppGetArgs {
  installationId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleAppGetCli: MittwaldCliToolHandler<MittwaldAppGetArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv: string[] = ['app', 'get', args.installationId, '--output', 'json'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_get',
      argv,
      parser: (stdout) => JSON.parse(stdout),
    });

    const data = result.result as Record<string, unknown>;
    if (!data || typeof data !== 'object') {
      return formatToolResponse('error', 'Unexpected output format from CLI command');
    }

    const formattedData = {
      id: data.id,
      appId: data.appId,
      name: data.name,
      version: data.version,
      status: data.status,
      description: data.description,
      installationPath: data.installationPath,
      createdAt: data.createdAt,
      projectId: data.projectId,
    };

    return formatToolResponse('success', `App installation details retrieved for: ${data.name || data.appId}`, formattedData, {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    });
  } catch (error) {
    if (error instanceof CliToolError) {
      const stderr = (error.stderr || '').toLowerCase();
      if (stderr.includes('not found') && stderr.includes('installation')) {
        return formatToolResponse('error', `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${error.stderr || error.message}`);
      }

      return formatToolResponse('error', error.message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
