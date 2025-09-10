import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContainerRunArgs {
  image: string;
  command?: string;
  args?: string[];
  projectId?: string;
  quiet?: boolean;
  env?: string[];
  envFile?: string[];
  description?: string;
  entrypoint?: string;
  name?: string;
  publish?: string[];
  publishAll?: boolean;
  volume?: string[];
}

export const handleContainerRunCli: MittwaldToolHandler<MittwaldContainerRunArgs> = async (args) => {
  try {
    if (!args.image) {
      return formatToolResponse(
        "error",
        "Container image is required"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['container', 'run', args.image];
    
    // Add command if specified
    if (args.command) {
      cliArgs.push(args.command);
    }
    
    // Add args if specified
    if (args.args && args.args.length > 0) {
      cliArgs.push(...args.args);
    }
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.name) {
      cliArgs.push('--name', args.name);
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.entrypoint) {
      cliArgs.push('--entrypoint', args.entrypoint);
    }
    
    if (args.publishAll) {
      cliArgs.push('--publish-all');
    }
    
    // Handle arrays of values
    if (args.env && args.env.length > 0) {
      args.env.forEach(envVar => {
        cliArgs.push('--env', envVar);
      });
    }
    
    if (args.envFile && args.envFile.length > 0) {
      args.envFile.forEach(file => {
        cliArgs.push('--env-file', file);
      });
    }
    
    if (args.publish && args.publish.length > 0) {
      args.publish.forEach(port => {
        cliArgs.push('--publish', port);
      });
    }
    
    if (args.volume && args.volume.length > 0) {
      args.volume.forEach(vol => {
        cliArgs.push('--volume', vol);
      });
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('image') && errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Container image not found: ${args.image}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('port') && errorMessage.includes('already')) {
        return formatToolResponse(
          "error",
          `Port conflict: One or more specified ports are already in use.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('volume') && errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Volume not found or path does not exist.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to run container: ${errorMessage}`
      );
    }
    
    // Handle quiet mode output
    if (args.quiet) {
      const containerId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Container created and started successfully from image ${args.image}`,
        {
          containerId: containerId,
          image: args.image,
          name: args.name,
          action: "run",
          projectId: args.projectId,
          command: args.command,
          args: args.args
        }
      );
    }
    
    // Handle normal output
    return formatToolResponse(
      "success",
      `Container created and started successfully from image ${args.image}`,
      {
        image: args.image,
        name: args.name,
        action: "run",
        projectId: args.projectId,
        command: args.command,
        args: args.args,
        env: args.env,
        volumes: args.volume,
        ports: args.publish,
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
