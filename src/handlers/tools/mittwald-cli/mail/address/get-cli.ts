import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailAddressGetArgs {
  id: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldMailAddressGetCli: MittwaldCliToolHandler<MittwaldMailAddressGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'address', 'get'];
    
    // Required ID
    cliArgs.push(args.id);
    
    // Output format (required)
    const outputFormat = args.output || 'txt';
    cliArgs.push('--output', outputFormat);
    
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
          `Permission denied when getting mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Mail address not found: ${args.id}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get mail address: ${errorMessage}`
      );
    }
    
    // Parse output based on format
    if (outputFormat === 'json') {
      try {
        const mailAddress = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Retrieved mail address: ${mailAddress.address || args.id}`,
          {
            format: 'json',
            mailAddress
          }
        );
      } catch (parseError) {
        // If JSON parsing fails, return the raw output
        return formatToolResponse(
          "success",
          `Retrieved mail address: ${args.id}`,
          {
            format: 'json',
            content: result.stdout
          }
        );
      }
    } else {
      // For other formats, return the raw output
      return formatToolResponse(
        "success",
        `Retrieved mail address: ${args.id}`,
        {
          format: outputFormat,
          content: result.stdout
        }
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};