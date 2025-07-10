import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldAppInstallNextcloudArgs {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  siteTitle?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppInstallNextcloudCli: MittwaldToolHandler<MittwaldAppInstallNextcloudArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'install', 'nextcloud'];
    
    // Required project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Version (required by CLI)
    if (args.version) {
      cliArgs.push('--version', args.version);
    } else {
      // Default to latest if not specified
      cliArgs.push('--version', 'latest');
    }
    
    // Optional parameters
    if (args.host) {
      cliArgs.push('--host', args.host);
    }
    
    if (args.adminUser) {
      cliArgs.push('--admin-user', args.adminUser);
    }
    
    if (args.adminEmail) {
      cliArgs.push('--admin-email', args.adminEmail);
    }
    
    if (args.adminPass) {
      cliArgs.push('--admin-pass', args.adminPass);
    }
    
    if (args.siteTitle) {
      cliArgs.push('--site-title', args.siteTitle);
    }
    
    // Quiet mode
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Wait for completion
    if (args.wait) {
      cliArgs.push('--wait');
    }
    
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
          `Permission denied when installing Nextcloud. Check if your API token has project management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') && errorMessage.includes('version')) {
        return formatToolResponse(
          "error",
          `Invalid Nextcloud version: ${args.version}. Please use a valid version number.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already exists') || errorMessage.includes('conflict')) {
        return formatToolResponse(
          "error",
          `Nextcloud installation already exists or conflicts with existing installation.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to install Nextcloud: ${errorMessage}`
      );
    }
    
    // Parse the output
    let appInstallationId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      appInstallationId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "Nextcloud installation started with ID app-xxxxx"
      const idMatch = result.stdout.match(/(?:ID|id)\s+([a-f0-9-]+)/i);
      if (idMatch) {
        appInstallationId = idMatch[1];
      }
    }
    
    if (!appInstallationId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Nextcloud installation started successfully`,
        {
          projectId: args.projectId,
          version: args.version || 'latest',
          siteTitle: args.siteTitle,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      appInstallationId,
      projectId: args.projectId,
      version: args.version || 'latest',
      ...(args.host && { host: args.host }),
      ...(args.adminUser && { adminUser: args.adminUser }),
      ...(args.adminEmail && { adminEmail: args.adminEmail }),
      ...(args.siteTitle && { siteTitle: args.siteTitle }),
      status: args.wait ? 'completed' : 'installing'
    };
    
    const successMessage = args.quiet ? 
      appInstallationId :
      args.wait ? 
        `Nextcloud installation completed successfully with ID ${appInstallationId}` :
        `Nextcloud installation started with ID ${appInstallationId}`;
    
    return formatToolResponse(
      "success",
      successMessage,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};