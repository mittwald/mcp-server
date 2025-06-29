import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { executeCommand } from "../../../../utils/executeCommand.js";
import { z } from 'zod';

export const domainGetSchema = z.object({
  domainId: z.string().describe("The domain ID"),
  output: z.enum(['txt', 'json', 'yaml']).optional().describe("Output format")
});

interface MittwaldDomainGetArgs {
  domainId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainGet: MittwaldToolHandler<MittwaldDomainGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Build the command
    let command = `mw domain get ${args.domainId}`;
    
    // Add output format flag
    command += ` --output ${args.output || 'json'}`;
    
    // Execute the command
    const { stdout, stderr } = await executeCommand(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`Domain get failed: ${error}`);
    }
    
    // Try to parse JSON/YAML output if applicable
    let parsedData = null;
    if ((args.output || 'json') === "json") {
      try {
        parsedData = JSON.parse(output);
      } catch {
        // If parsing fails, just use raw output
      }
    }
    
    // Format the response
    const result = {
      success: Boolean(output),
      message: `Domain information retrieved for ${args.domainId}`,
      domainId: args.domainId,
      output: output || null,
      parsedData: parsedData,
      format: args.output || 'json',
      command: command
    };
    
    return formatToolResponse("success", "Domain retrieved successfully", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};