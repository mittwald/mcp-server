import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerUpdateCliArgs {
  containerId: string;
  image?: string;
  env?: string[];
  envFile?: string[];
  description?: string;
  entrypoint?: string;
  command?: string;
  publish?: string[];
  publishAll?: boolean;
  volume?: string[];
  recreate?: boolean;
  quiet?: boolean;
  projectId?: string;
}

function validateContainerId(containerId: string | undefined): string | undefined {
  const trimmed = containerId?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function buildCliArgs(args: MittwaldContainerUpdateCliArgs): string[] {
  const cliArgs: string[] = ['container', 'update', args.containerId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.projectId) cliArgs.push('--project-id', args.projectId);

  if (args.image) cliArgs.push('--image', args.image);

  if (args.env && args.env.length > 0) {
    args.env.forEach((envVar) => cliArgs.push('--env', envVar));
  }

  if (args.envFile && args.envFile.length > 0) {
    args.envFile.forEach((envFile) => cliArgs.push('--env-file', envFile));
  }

  if (args.description) cliArgs.push('--description', args.description);
  if (args.entrypoint) cliArgs.push('--entrypoint', args.entrypoint);
  if (args.command) cliArgs.push('--command', args.command);

  if (args.publishAll) cliArgs.push('--publish-all');
  if (args.publish && args.publish.length > 0) {
    args.publish.forEach((mapping) => cliArgs.push('--publish', mapping));
  }

  if (args.volume && args.volume.length > 0) {
    args.volume.forEach((vol) => cliArgs.push('--volume', vol));
  }

  if (args.recreate) cliArgs.push('--recreate');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldContainerUpdateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found: ${args.containerId}. Verify the container ID is correct.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('image') && combined.includes('not found')) {
    return `Container image not found: ${args.image}. Verify the image name and tag are correct.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('port')) {
    return `Invalid port mapping format. Use <host-port>:<container-port> or <container-port>.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('volume')) {
    return `Invalid volume mount format. Use <source>:<destination>.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied. You may not have access to update this container.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('unknown flag') || combined.includes('unknown option')) {
    return `Unknown flag provided. Review the available options for container update.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildUpdatedAttributes(args: MittwaldContainerUpdateCliArgs) {
  return {
    image: args.image,
    description: args.description,
    entrypoint: args.entrypoint,
    command: args.command,
    envCount: args.env?.length ?? 0,
    envFileCount: args.envFile?.length ?? 0,
    portMappings: args.publish?.length ?? 0,
    publishAll: args.publishAll ?? false,
    volumeMounts: args.volume?.length ?? 0,
    recreate: args.recreate ?? false,
  };
}

export const handleContainerUpdateCli: MittwaldCliToolHandler<MittwaldContainerUpdateCliArgs> = async (args) => {
  const containerId = validateContainerId(args.containerId);
  if (!containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs({ ...args, containerId });

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container ${containerId} updated successfully`;

    if (args.quiet) {
      const quietId = parseQuietOutput(stdout) ?? containerId;
      return formatToolResponse(
        'success',
        `Container ${quietId} updated successfully`,
        {
          containerId: quietId,
          projectId: args.projectId,
          updatedAttributes: buildUpdatedAttributes(args),
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Container ${containerId} update completed`,
      {
        containerId,
        projectId: args.projectId,
        updatedAttributes: buildUpdatedAttributes(args),
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, { ...args, containerId });
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
