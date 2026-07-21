import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppListUpgradeCandidatesCli } from '../../../../handlers/tools/mittwald-cli/app/list-upgrade-candidates-cli.js';

const tool: Tool = {
  name: 'mittwald_app_list_upgrade_candidates',
  title: 'List App Upgrade Candidates',
  annotations: {
    title: 'List App Upgrade Candidates',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List upgrade candidates for an app installation.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      }
    },
    required: ['installationId']
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleAppListUpgradeCandidatesCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_list_upgrade_candidates_cli = tool;