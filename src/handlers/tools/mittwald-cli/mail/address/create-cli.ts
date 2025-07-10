import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailAddressCreateArgs {
  address: string;
  projectId?: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

export const handleMittwaldMailAddressCreateCli: MittwaldCliToolHandler<MittwaldMailAddressCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'address', 'create'];
    
    // Required address
    cliArgs.push('--address', args.address);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Quiet mode
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Mailbox options
    if (args.catchAll) {
      cliArgs.push('--catch-all');
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
          `Permission denied when creating mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('already exists') || errorMessage.includes('conflict')) {
        return formatToolResponse(
          "error",
          `Mail address already exists: ${args.address}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') && errorMessage.includes('address')) {
        return formatToolResponse(
          "error",
          `Invalid mail address format: ${args.address}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('no default project')) {
        return formatToolResponse(
          "error",
          `No default project set. Please provide --project-id or set a default project context.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create mail address: ${errorMessage}`
      );
    }
    
    // Parse the output
    let addressId: string | null = null;
    let generatedPassword: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs the ID and optionally the password
      const output = parseQuietOutput(result.stdout);
      if (output) {
        if (args.randomPassword) {
          // Output format: ID<tab>password
          const parts = output.split('\t');
          addressId = parts[0];
          generatedPassword = parts[1] || null;
        } else {
          addressId = output;
        }
      }
    } else {
      // In normal mode, parse the success message
      // Example: "Mail address 'test@example.com' created successfully with ID ma-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        addressId = idMatch[1];
      }
      
      if (args.randomPassword) {
        // Look for generated password in the output
        const passwordMatch = result.stdout.match(/password:\s*(.+)/i);
        if (passwordMatch) {
          generatedPassword = passwordMatch[1].trim();
        }
      }
    }
    
    if (!addressId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created mail address '${args.address}'`,
        {
          address: args.address,
          output: result.stdout,
          ...(generatedPassword && { password: generatedPassword })
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: addressId,
      address: args.address,
      ...(args.forwardTo && { forwardTo: args.forwardTo }),
      ...(args.catchAll && { catchAll: args.catchAll }),
      ...(args.quota && { quota: args.quota }),
      ...(generatedPassword && { password: generatedPassword })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        (generatedPassword ? `${addressId}\t${generatedPassword}` : addressId) :
        `Successfully created mail address '${args.address}' with ID ${addressId}${generatedPassword ? ` and generated password` : ''}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};