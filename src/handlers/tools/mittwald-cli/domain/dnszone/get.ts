import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const domainDnszoneGetSchema = z.object({
  dnszoneId: z.string(),
  output: z.enum(["txt", "json", "yaml"]).optional().default("txt")
});

interface DomainDnszoneGetArgs {
  dnszoneId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainDnszoneGet: MittwaldToolHandler<DomainDnszoneGetArgs> = async (args) => {
  try {
    const output = args.output || 'json';
    
    // Build the command
    let command = `mw domain dnszone get ${args.dnszoneId}`;
    
    // Add output format flag
    command += ` --output ${output}`;
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const commandOutput = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DNS zone get failed: ${error}`);
    }
    
    // Try to parse JSON/YAML output if applicable
    let parsedData = null;
    if (output === "json") {
      try {
        parsedData = JSON.parse(commandOutput);
      } catch {
        // If parsing fails, just use raw output
      }
    }
    
    // Format the response
    const result = {
      success: Boolean(commandOutput),
      message: `DNS zone information retrieved for ${args.dnszoneId}`,
      dnszoneId: args.dnszoneId,
      output: commandOutput || null,
      parsedData: parsedData,
      format: output,
      command: command
    };
    
    return formatToolResponse("success", `DNS zone information retrieved for ${args.dnszoneId}`, result);
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};