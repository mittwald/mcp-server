import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

export interface MittwaldAppCreateStaticArgs {
  projectId?: string;
  siteTitle?: string;
  documentRoot: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreateStaticCli: MittwaldCliToolHandler<MittwaldAppCreateStaticArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'create', 'static'];
    
    // Required document root
    cliArgs.push('--document-root', args.documentRoot);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Optional site title
    if (args.siteTitle) {
      cliArgs.push('--site-title', args.siteTitle);
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
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when creating static app. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
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
        `Failed to create static app: ${errorMessage}`
      );
    }
    
    // Parse the output
    let appId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      appId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "Static app created successfully with ID a-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        appId = idMatch[1];
      }
    }
    
    if (!appId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created static app`,
        {
          siteTitle: args.siteTitle,
          documentRoot: args.documentRoot,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      appInstallationId: appId,
      status: 'created',
      siteTitle: args.siteTitle,
      documentRoot: args.documentRoot,
      ...(args.projectId && { projectId: args.projectId })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        appId :
        `Successfully created static app with ID ${appId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
