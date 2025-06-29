import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const domainDnszoneMainSchema = z.object({
  help: z.boolean().optional()
});

interface DomainDnszoneMainArgs {
  help?: boolean;
}

export const handleDomainDnszoneMain: MittwaldToolHandler<DomainDnszoneMainArgs> = async (args) => {
  try {
    // Build the command
    let command = "mw domain dnszone";
    
    if (args.help) {
      command += " --help";
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DNS zone command failed: ${error}`);
    }
    
    // Format the response with available commands info
    const result = {
      success: true,
      message: "DNS zone management help",
      availableCommands: [
        {
          command: "mittwald_domain_dnszone_get",
          description: "Gets a specific DNS zone by ID or domain name"
        },
        {
          command: "mittwald_domain_dnszone_list",
          description: "List all DNS zones by project ID"
        },
        {
          command: "mittwald_domain_dnszone_update",
          description: "Updates a record set of a DNS zone"
        }
      ],
      output: output || null,
      command: command
    };
    
    return formatToolResponse("success", "DNS zone management help", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};