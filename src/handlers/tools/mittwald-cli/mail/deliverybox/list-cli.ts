import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailDeliveryboxListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleMittwaldMailDeliveryboxListCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxListArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'deliverybox', 'list'];
    
    // Output format (required)
    const outputFormat = args.output || 'txt';
    cliArgs.push('--output', outputFormat);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Optional flags
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.csvSeparator) {
      cliArgs.push('--csv-separator', args.csvSeparator);
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
          `Permission denied when listing delivery boxes. Check if your API token has mail management permissions.\nError: ${errorMessage}`
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
        `Failed to list delivery boxes: ${errorMessage}`
      );
    }
    
    // Parse output based on format
    if (outputFormat === 'json') {
      try {
        const deliveryBoxes = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Retrieved ${Array.isArray(deliveryBoxes) ? deliveryBoxes.length : 'unknown count'} delivery boxes`,
          {
            format: 'json',
            deliveryBoxes,
            count: Array.isArray(deliveryBoxes) ? deliveryBoxes.length : null
          }
        );
      } catch (parseError) {
        // If JSON parsing fails, return the raw output
        return formatToolResponse(
          "success",
          "Retrieved delivery boxes",
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
        "Retrieved delivery boxes",
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