import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { domain_dnszone_main } from "../../../../../constants/tool/mittwald-cli/domain/dnszone/main.js";
import { getMittwaldClient } from "../../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../../types/request-context.js";
import { formatToolResponse } from "../../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const domainDnszoneMainSchema = domain_dnszone_main.parameters;
export type DomainDnszoneMainParams = z.infer<typeof domainDnszoneMainSchema>;

export async function handleDomainDnszoneMain(
  params: DomainDnszoneMainParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = "mw domain dnszone";
    
    if (params.help) {
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
    
    return formatToolResponse("success", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      {},
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}