import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { domain_dnszone_update } from "../../../../../constants/tool/mittwald-cli/domain/dnszone/update.js";
import { getMittwaldClient } from "../../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../../types/request-context.js";
import { formatToolResponse } from "../../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const domainDnszoneUpdateSchema = domain_dnszone_update.parameters;
export type DomainDnszoneUpdateParams = z.infer<typeof domainDnszoneUpdateSchema>;

export async function handleDomainDnszoneUpdate(
  params: DomainDnszoneUpdateParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = `mw domain dnszone update ${params.dnszoneId} ${params.recordSet}`;
    
    // Add flags
    if (params.projectId) {
      command += ` --project-id ${params.projectId}`;
    }
    
    if (params.quiet) {
      command += " --quiet";
    }
    
    if (params.managed) {
      command += " --managed";
    }
    
    if (params.unset) {
      command += " --unset";
    }
    
    if (params.record && params.record.length > 0) {
      for (const record of params.record) {
        command += ` --record "${record}"`;
      }
    }
    
    if (params.ttl) {
      command += ` --ttl ${params.ttl}`;
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error && !params.quiet) {
      throw new Error(`DNS zone update failed: ${error}`);
    }
    
    // Format the response
    const result = {
      success: true,
      message: `DNS zone ${params.dnszoneId} record set '${params.recordSet}' updated successfully`,
      dnszoneId: params.dnszoneId,
      recordSet: params.recordSet,
      output: output || null,
      command: command,
      recordsSet: params.record || null,
      ttl: params.ttl || null,
      managed: params.managed || false,
      unset: params.unset || false
    };
    
    if (params.quiet && output) {
      // In quiet mode, output is machine-readable
      try {
        const parsedOutput = JSON.parse(output);
        Object.assign(result, { parsedOutput });
      } catch {
        // If parsing fails, just include raw output
      }
    }
    
    return formatToolResponse("success", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      {},
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}