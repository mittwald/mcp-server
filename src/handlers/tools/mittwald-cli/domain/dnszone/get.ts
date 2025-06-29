import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getMittwaldClient } from "../../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../../types/request-context.js";
import { formatToolResponse } from "../../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const domainDnszoneGetSchema = z.object({
  dnszoneId: z.string(),
  output: z.enum(["txt", "json", "yaml"]).default("json")
});

export type DomainDnszoneGetParams = z.infer<typeof domainDnszoneGetSchema>;

export async function handleDomainDnszoneGet(
  params: DomainDnszoneGetParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = `mw domain dnszone get ${params.dnszoneId}`;
    
    // Add output format flag
    command += ` --output ${params.output}`;
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DNS zone get failed: ${error}`);
    }
    
    // Try to parse JSON/YAML output if applicable
    let parsedData = null;
    if (params.output === "json") {
      try {
        parsedData = JSON.parse(output);
      } catch {
        // If parsing fails, just use raw output
      }
    }
    
    // Format the response
    const result = {
      success: Boolean(output),
      message: `DNS zone information retrieved for ${params.dnszoneId}`,
      dnszoneId: params.dnszoneId,
      output: output || null,
      parsedData: parsedData,
      format: params.output,
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