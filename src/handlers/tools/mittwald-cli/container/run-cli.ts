import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerRunArgs {
  image: string;
  command?: string;
  args?: string[];
  projectId?: string;
  env?: string[];
  envFile?: string[];
  description?: string;
  entrypoint?: string;
  name?: string;
  publish?: string[];
  publishAll?: boolean;
  volume?: string[];
}

function buildCliArgs(args: MittwaldContainerRunArgs): string[] {
  const cliArgs: string[] = ['container', 'run', args.image];

  if (args.command) cliArgs.push(args.command);
  if (args.args?.length) cliArgs.push(...args.args);
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.name) cliArgs.push('--name', args.name);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.entrypoint) cliArgs.push('--entrypoint', args.entrypoint);
  if (args.publishAll) cliArgs.push('--publish-all');
  args.env?.forEach((item) => cliArgs.push('--env', item));
  args.envFile?.forEach((item) => cliArgs.push('--env-file', item));
  args.publish?.forEach((item) => cliArgs.push('--publish', item));
  args.volume?.forEach((item) => cliArgs.push('--volume', item));

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldContainerRunArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('image') && combined.includes('not found')) {
    return `Container image not found: ${args.image}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('port') && combined.includes('already')) {
    return `Port conflict detected. One or more specified ports are already in use.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('volume') && combined.includes('not found')) {
    return `Volume not found or path does not exist.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerRunCli: MittwaldCliToolHandler<MittwaldContainerRunArgs> = async (args) => {
  if (!args.image) {
    return formatToolResponse('error', 'Container image is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_run',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container created and started successfully from image ${args.image}`;

    return formatToolResponse(
      'success',
      `Container created and started successfully from image ${args.image}`,
      {
        image: args.image,
        name: args.name,
        action: 'run',
        projectId: args.projectId,
        command: args.command,
        args: args.args,
        env: args.env,
        volumes: args.volume,
        ports: args.publish,
        output,
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
