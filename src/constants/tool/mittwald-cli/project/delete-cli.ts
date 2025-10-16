import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectDeleteCli } from '../../../../handlers/tools/mittwald-cli/project/delete-cli.js';

const tool: Tool = {
  name: "mittwald_project_delete",
  title: "Delete Project",
  description: "Delete a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      }
    },
    required: ["projectId", "confirm"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectDeleteCli,
  schema: tool.inputSchema
};

export default registration;
