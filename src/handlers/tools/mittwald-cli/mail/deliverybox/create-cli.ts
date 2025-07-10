import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailDeliveryboxCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  password?: string;
  randomPassword?: boolean;
}

export const handleMittwaldMailDeliveryboxCreateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'deliverybox', 'create'];
    
    // Required description
    cliArgs.push('--description', args.description);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Quiet mode
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Password options
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.randomPassword) {
      cliArgs.push('--random-password');
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
          `Permission denied when creating delivery box. Check if your API token has mail management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
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
        `Failed to create delivery box: ${errorMessage}`
      );
    }
    
    // Parse the output
    let deliveryBoxId: string | null = null;
    let generatedPassword: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs the ID and optionally the password
      const output = parseQuietOutput(result.stdout);
      if (output) {
        if (args.randomPassword) {
          // Output format: ID<tab>password
          const parts = output.split('\t');
          deliveryBoxId = parts[0];
          generatedPassword = parts[1] || null;
        } else {
          deliveryBoxId = output;
        }
      }
    } else {
      // In normal mode, parse the success message
      // Example: "Delivery box 'My Box' created successfully with ID db-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        deliveryBoxId = idMatch[1];
      }
      
      if (args.randomPassword) {
        // Look for generated password in the output
        const passwordMatch = result.stdout.match(/password:\s*(.+)/i);
        if (passwordMatch) {
          generatedPassword = passwordMatch[1].trim();
        }
      }
    }
    
    if (!deliveryBoxId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created delivery box '${args.description}'`,
        {
          description: args.description,
          output: result.stdout,
          ...(generatedPassword && { password: generatedPassword })
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: deliveryBoxId,
      description: args.description,
      ...(generatedPassword && { password: generatedPassword })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        (generatedPassword ? `${deliveryBoxId}\t${generatedPassword}` : deliveryBoxId) :
        `Successfully created delivery box '${args.description}' with ID ${deliveryBoxId}${generatedPassword ? ` and generated password` : ''}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};