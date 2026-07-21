import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleMittwaldProjectListCli } from '../../../../handlers/tools/mittwald-cli/project/list-cli.js';

const tool: Tool = {
  name: "mittwald_project_list",
  title: "List Projects",
  annotations: {
    title: "List Projects",
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: "List all projects that you have access to.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldProjectListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_list_cli = tool;