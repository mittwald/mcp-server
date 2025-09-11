import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  pathToApp?: string[];
  pathToUrl?: string[];
  pathToContainer?: string[];
}

export const handleDomainVirtualhostCreateCli: MittwaldToolHandler<MittwaldDomainVirtualhostCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'virtualhost', 'create'];
    
    // Required hostname
    cliArgs.push('--hostname', args.hostname);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    
    // Path mappings
    if (args.pathToApp) {
      for (const pathMapping of args.pathToApp) {
        cliArgs.push('--path-to-app', pathMapping);
      }
    }
    
    if (args.pathToUrl) {
      for (const pathMapping of args.pathToUrl) {
        cliArgs.push('--path-to-url', pathMapping);
      }
    }
    
    if (args.pathToContainer) {
      for (const pathMapping of args.pathToContainer) {
        cliArgs.push('--path-to-container', pathMapping);
      }
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        // Pass through API token if available
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when creating virtual host. ${
            args.hostname?.includes('.project.space') 
              ? 'Subdomains on .project.space may not be allowed. Try using a custom domain instead.' 
              : 'Check if your API token has domain management permissions.'
          }\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') && errorMessage.includes('format')) {
        return formatToolResponse(
          "error",
          `Invalid format in request. Please check your path mappings.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create virtual host: ${errorMessage}`
      );
    }
    
    // Parse the output
    let ingressId: string | null = null;
    
    // Parse the success message
    // Example: "Virtual host 'example.com' created successfully with ID i-xxxxx"
    const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
    if (idMatch) {
      ingressId = idMatch[1];
    }
    
    if (!ingressId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        `Successfully created virtual host '${args.hostname}'`,
        {
          hostname: args.hostname,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      ...(args.pathToApp && { pathToApp: args.pathToApp }),
      ...(args.pathToUrl && { pathToUrl: args.pathToUrl }),
      ...(args.pathToContainer && { pathToContainer: args.pathToContainer })
    };
    
    return formatToolResponse(
      "success",
      `Successfully created virtual host '${args.hostname}' with ID ${ingressId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};