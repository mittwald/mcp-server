import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

export interface MittwaldAppCreatePythonArgs {
  projectId?: string;
  siteTitle?: string;
  entrypoint?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreatePythonCli: MittwaldToolHandler<MittwaldAppCreatePythonArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'create', 'python'];
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Optional site title
    if (args.siteTitle) {
      cliArgs.push('--site-title', args.siteTitle);
    }
    
    // Optional entrypoint
    if (args.entrypoint) {
      cliArgs.push('--entrypoint', args.entrypoint);
    }
    
    // Quiet mode
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Wait for readiness
    if (args.wait) {
      cliArgs.push('--wait');
    }
    
    // Wait timeout
    if (args.waitTimeout) {
      cliArgs.push('--wait-timeout', `${args.waitTimeout}s`);
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
          `Permission denied when creating Python app. Check if your API token has app management permissions.\nError: ${errorMessage}`
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
          `Invalid format in request. Please check your parameters.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create Python app: ${errorMessage}`
      );
    }
    
    // Parse the output
    let appId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      appId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "Python app created successfully with ID a-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        appId = idMatch[1];
      }
    }
    
    if (!appId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created Python app`,
        {
          siteTitle: args.siteTitle,
          entrypoint: args.entrypoint,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      appInstallationId: appId,
      status: 'created',
      siteTitle: args.siteTitle,
      entrypoint: args.entrypoint,
      ...(args.projectId && { projectId: args.projectId })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        appId :
        `Successfully created Python app with ID ${appId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};