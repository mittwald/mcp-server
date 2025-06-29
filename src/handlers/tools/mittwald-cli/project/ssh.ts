import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectSSHArgs {
  projectId?: string;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleProjectSSH: MittwaldToolHandler<MittwaldProjectSSHArgs> = async (args, { mittwaldClient }) => {
  try {
    // For SSH connections, we need to provide connection info rather than execute
    // SSH connections are interactive and cannot be executed through the MCP interface
    
    let projectId = args.projectId;
    
    // If no project ID provided, we can't establish connection info
    if (!projectId) {
      return formatToolResponse(
        'error',
        'Project ID is required for SSH connection information. Please provide a project ID.'
      );
    }
    
    // Get project details to validate and get connection info
    const project = await mittwaldClient.project.getProject({
      projectId: projectId
    });
    
    if (!project.data) {
      return formatToolResponse(
        'error',
        `Project with ID ${projectId} not found.`
      );
    }
    
    // Build SSH connection command
    let sshCommand = `mw project ssh ${projectId}`;
    
    if (args.sshUser) {
      sshCommand += ` --ssh-user ${args.sshUser}`;
    }
    
    if (args.sshIdentityFile) {
      sshCommand += ` --ssh-identity-file "${args.sshIdentityFile}"`;
    }
    
    const responseText = `SSH Connection Information for Project: ${project.data.description}

Project ID: ${projectId}
Project Description: ${project.data.description}

To establish SSH connection, run this command in your terminal:
${sshCommand}

Note: SSH connections are interactive and cannot be executed through the MCP interface. 
You must run this command directly in your terminal to establish the connection.

Additional SSH options:
- Use --ssh-user to specify a different SSH user
- Use --ssh-identity-file to specify a private key file for authentication`;

    return formatToolResponse('success', responseText);
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to prepare SSH connection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};