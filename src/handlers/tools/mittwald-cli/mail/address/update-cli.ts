import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailAddressUpdateArgs {
  id: string;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

export const handleMittwaldMailAddressUpdateCli: MittwaldCliToolHandler<MittwaldMailAddressUpdateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'address', 'update'];
    
    // Required ID
    cliArgs.push(args.id);
    
    
    // Mailbox options
    if (args.catchAll !== undefined) {
      cliArgs.push(args.catchAll ? '--catch-all' : '--no-catch-all');
    }
    
    if (args.enableSpamProtection !== undefined) {
      cliArgs.push(args.enableSpamProtection ? '--enable-spam-protection' : '--no-enable-spam-protection');
    }
    
    if (args.quota) {
      cliArgs.push('--quota', args.quota);
    }
    
    // Password options
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.randomPassword) {
      cliArgs.push('--random-password');
    }
    
    // Forward options
    if (args.forwardTo) {
      for (const forwardAddress of args.forwardTo) {
        cliArgs.push('--forward-to', forwardAddress);
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
          `Permission denied when updating mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Mail address not found: ${args.id}.\nError: ${errorMessage}`
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
        `Failed to update mail address: ${errorMessage}`
      );
    }
    
    // Look for generated password in the output if randomPassword was used
    let generatedPassword: string | null = null;
    if (args.randomPassword) {
      const passwordMatch = result.stdout.match(/password:\s*(.+)/i);
      if (passwordMatch) {
        generatedPassword = passwordMatch[1].trim();
      }
    }
    
    // Build result data
    const resultData = {
      id: args.id,
      updated: true,
      ...(args.forwardTo && { forwardTo: args.forwardTo }),
      ...(args.catchAll !== undefined && { catchAll: args.catchAll }),
      ...(args.quota && { quota: args.quota }),
      ...(generatedPassword && { password: generatedPassword })
    };
    
    // Success response
    return formatToolResponse(
      "success",
      `Successfully updated mail address: ${args.id}${generatedPassword ? ` with new generated password` : ''}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};