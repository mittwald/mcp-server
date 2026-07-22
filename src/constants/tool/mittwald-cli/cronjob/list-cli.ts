import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCronjobListCli } from '../../../../handlers/tools/mittwald-cli/cronjob/list-cli.js';

const tool: Tool = {
  name: 'mittwald_cronjob_list',
  title: 'List Cron Jobs',
  annotations: {
    title: 'List Cron Jobs',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List cronjobs.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleCronjobListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_cronjob_list_cli = tool;