import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerRunCli } from '../../../../handlers/tools/mittwald-cli/container/run-cli.js';

const tool: Tool = {
  name: 'mittwald_container_run',
  title: 'Run Container',
  description: 'Create and start a new container.',
  inputSchema: {
    type: 'object',
    properties: {
      image: {
        type: 'string',
        description: 'Container image (e.g., ubuntu:20.04 or alpine@sha256:abc123...)'
      },
      command: {
        type: 'string',
        description: 'Override the default command specified in the container image'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Runtime arguments passed to the command'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project (optional if default project is set in context)'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      env: {
        type: 'array',
        items: { type: 'string' },
        description: 'Set environment variables in the container (format: KEY=VALUE)'
      },
      envFile: {
        type: 'array',
        items: { type: 'string' },
        description: 'Read environment variables from files'
      },
      description: {
        type: 'string',
        description: 'Add a descriptive label to the container'
      },
      entrypoint: {
        type: 'string',
        description: 'Override the default entrypoint of the container image'
      },
      name: {
        type: 'string',
        description: 'Assign a custom name to the container'
      },
      publish: {
        type: 'array',
        items: { type: 'string' },
        description: 'Publish container ports to the host (format: host-port:container-port)'
      },
      publishAll: {
        type: 'boolean',
        description: 'Publish all ports that are defined in the image'
      },
      volume: {
        type: 'array',
        items: { type: 'string' },
        description: 'Bind mount volumes to the container (format: host-path:container-path)'
      }
    },
    required: ["image", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerRunCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_run_cli = tool;