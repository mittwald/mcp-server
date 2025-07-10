import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectSshCli } from '../../../../handlers/tools/mittwald-cli/project/ssh-cli.js';

const tool: Tool = {
  name: "mittwald_project_ssh_cli",
  description: "Connect to a project via SSH using Mittwald CLI (provides command for interactive terminal)",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with; if omitted, your own user will be used"
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectSshCli,
  schema: tool.inputSchema
};

export default registration;