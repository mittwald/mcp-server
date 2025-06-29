import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getMittwaldClient } from "../../../../services/mittwald/mittwald-client.js";
import { formatToolResponse } from "../../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const domainGetSchema = z.object({
  domainId: z.string(),
  output: z.enum(["txt", "json", "yaml"]).default("json")
});

export type DomainGetParams = z.infer<typeof domainGetSchema>;

export async function handleDomainGet(
  params: DomainGetParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = `mw domain get ${params.domainId}`;
    
    // Add output format flag
    command += ` --output ${params.output}`;
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`Domain get failed: ${error}`);
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
      message: `Domain information retrieved for ${params.domainId}`,
      domainId: params.domainId,
      output: output || null,
      parsedData: parsedData,
      format: params.output,
      command: command
    };
    
    return formatToolResponse("success", "Domain retrieved successfully", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}