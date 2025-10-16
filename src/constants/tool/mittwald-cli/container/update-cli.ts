import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContainerUpdateCli } from '../../../../handlers/tools/mittwald-cli/container/update-cli.js';

const tool: Tool = {
  name: 'mittwald_container_update',
  title: 'Update Container',
  description: 'Updates attributes of an existing container such as image, environment variables, port mappings, and volumes.',
  inputSchema: {
    type: 'object',
    properties: {
      containerId: {
        type: 'string',
        description: 'Container ID or short ID to update'
      },
      image: {
        type: 'string',
        description: 'Update the container image (e.g., "nginx:latest", "mysql:8.0")'
      },
      env: {
        type: 'array',
        items: { type: 'string' },
        description: 'Environment variables in KEY=VALUE format. Multiple values can be specified.'
      },
      envFile: {
        type: 'array',
        items: { type: 'string' },
        description: 'Paths to files containing environment variables (one KEY=VALUE per line). Multiple files can be specified.'
      },
      description: {
        type: 'string',
        description: 'Update the descriptive label of the container'
      },
      entrypoint: {
        type: 'string',
        description: 'Override the entrypoint of the container'
      },
      command: {
        type: 'string',
        description: 'Update the command to run in the container (overrides image default)'
      },
      publish: {
        type: 'array',
        items: { type: 'string' },
        description: 'Port mappings in format <host-port>:<container-port> or just <container-port>. Multiple mappings can be specified.'
      },
      publishAll: {
        type: 'boolean',
        description: 'Automatically publish all ports exposed by the container image'
      },
      volume: {
        type: 'array',
        items: { type: 'string' },
        description: 'Volume mounts in format <host-path>:<container-path> or <named-volume>:<container-path>. Multiple volumes can be specified.'
      },
      recreate: {
        type: 'boolean',
        description: 'Recreate the container after updating to apply changes immediately'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      projectId: {
        type: 'string',
        description: 'Project ID or short ID (optional if default project is set in context)'
      }
    },
    required: ['containerId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContainerUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_container_update_cli = tool;
