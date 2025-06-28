import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectArgs {}

export const handleProject: MittwaldToolHandler<MittwaldProjectArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `Project Management Commands

Available project operations:
- create: Create a new project
- delete: Delete a project  
- get: Get details of a project
- list: List all projects that you have access to
- ssh: Connect to a project via SSH
- update: Update an existing project

Project Topics:
- filesystem: Interact with the filesystem of your project
- invite: Invite users to your projects and manage their invitations  
- membership: Control who gets to work on your projects

Use the specific project tools available in this MCP server to perform these operations.`;

    return formatToolResponse('success', helpText);
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to get project command help: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};