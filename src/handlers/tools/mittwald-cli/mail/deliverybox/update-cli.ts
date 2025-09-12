import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailDeliveryboxUpdateArgs {
  id: string;
  description?: string;
  password?: string;
  randomPassword?: boolean;
}

export const handleMittwaldMailDeliveryboxUpdateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxUpdateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'deliverybox', 'update'];
    
    // Required ID
    cliArgs.push(args.id);
    
    // Optional flags
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    // Password options
    if (args.password) {
      cliArgs.push('--password', args.password);
    }
    
    if (args.randomPassword) {
      cliArgs.push('--random-password');
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
          `Permission denied when updating delivery box. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Delivery box not found: ${args.id}.\nError: ${errorMessage}`
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
        `Failed to update delivery box: ${errorMessage}`
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
      ...(args.description && { description: args.description }),
      ...(generatedPassword && { password: generatedPassword })
    };
    
    // Success response
    return formatToolResponse(
      "success",
      `Successfully updated delivery box: ${args.id}${generatedPassword ? ` with new generated password` : ''}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
