import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldAppInstallShopware5Args {
  projectId: string;
  version?: string;
  host?: string;
  adminUser?: string;
  adminEmail?: string;
  adminPass?: string;
  adminFirstname?: string;
  adminLastname?: string;
  siteTitle?: string;
  shopEmail?: string;
  shopLang?: string;
  shopCurrency?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppInstallShopware5Cli: MittwaldCliToolHandler<MittwaldAppInstallShopware5Args> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'install', 'shopware5'];
    
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
    
    if (args.adminFirstname) {
      cliArgs.push('--admin-firstname', args.adminFirstname);
    }
    
    if (args.adminLastname) {
      cliArgs.push('--admin-lastname', args.adminLastname);
    }
    
    if (args.siteTitle) {
      cliArgs.push('--site-title', args.siteTitle);
    }
    
    if (args.shopEmail) {
      cliArgs.push('--shop-email', args.shopEmail);
    }
    
    if (args.shopLang) {
      cliArgs.push('--shop-lang', args.shopLang);
    }
    
    if (args.shopCurrency) {
      cliArgs.push('--shop-currency', args.shopCurrency);
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
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when installing Shopware 5. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
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
          `Invalid Shopware 5 version: ${args.version}. Please use a valid version number.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already exists') || errorMessage.includes('conflict')) {
        return formatToolResponse(
          "error",
          `Shopware 5 installation already exists or conflicts with existing installation.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to install Shopware 5: ${errorMessage}`
      );
    }
    
    // Parse the output
    let appInstallationId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      appInstallationId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "Shopware 5 installation started with ID app-xxxxx"
      const idMatch = result.stdout.match(/(?:ID|id)\s+([a-f0-9-]+)/i);
      if (idMatch) {
        appInstallationId = idMatch[1];
      }
    }
    
    if (!appInstallationId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Shopware 5 installation started successfully`,
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
      ...(args.adminFirstname && { adminFirstname: args.adminFirstname }),
      ...(args.adminLastname && { adminLastname: args.adminLastname }),
      ...(args.siteTitle && { siteTitle: args.siteTitle }),
      ...(args.shopEmail && { shopEmail: args.shopEmail }),
      ...(args.shopLang && { shopLang: args.shopLang }),
      ...(args.shopCurrency && { shopCurrency: args.shopCurrency }),
      status: args.wait ? 'completed' : 'installing'
    };
    
    const successMessage = args.quiet ? 
      appInstallationId :
      args.wait ? 
        `Shopware 5 installation completed successfully with ID ${appInstallationId}` :
        `Shopware 5 installation started with ID ${appInstallationId}`;
    
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
