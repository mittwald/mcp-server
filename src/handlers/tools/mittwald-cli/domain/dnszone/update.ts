import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const domainDnszoneUpdateSchema = z.object({
  dnszoneId: z.string(),
  recordSet: z.enum(["a", "mx", "txt", "srv", "cname"]),
  projectId: z.string().optional(),
  set: z.array(z.string()).optional(),
  recordId: z.string().optional(),
  unset: z.array(z.string()).optional(),
  // Additional fields used in the handler implementation
  quiet: z.boolean().optional(),
  managed: z.boolean().optional(),
  record: z.array(z.string()).optional(),
  ttl: z.number().optional()
});

interface DomainDnszoneUpdateArgs {
  dnszoneId: string;
  recordSet: 'a' | 'mx' | 'txt' | 'srv' | 'cname';
  projectId?: string;
  set?: string[];
  recordId?: string;
  unset?: string[];
  // Additional fields used in the handler implementation
  quiet?: boolean;
  managed?: boolean;
  record?: string[];
  ttl?: number;
}

export const handleDomainDnszoneUpdate: MittwaldToolHandler<DomainDnszoneUpdateArgs> = async (args) => {
  try {
    // Build the command
    let command = `mw domain dnszone update ${args.dnszoneId} ${args.recordSet}`;
    
    // Add flags
    if (args.projectId) {
      command += ` --project-id ${args.projectId}`;
    }
    
    if (args.quiet) {
      command += " --quiet";
    }
    
    if (args.managed) {
      command += " --managed";
    }
    
    if (args.unset) {
      command += " --unset";
    }
    
    if (args.record && args.record.length > 0) {
      for (const record of args.record) {
        command += ` --record "${record}"`;
      }
    }
    
    if (args.ttl) {
      command += ` --ttl ${args.ttl}`;
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error && !args.quiet) {
      throw new Error(`DNS zone update failed: ${error}`);
    }
    
    // Format the response
    const result = {
      success: true,
      message: `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      dnszoneId: args.dnszoneId,
      recordSet: args.recordSet,
      output: output || null,
      command: command,
      recordsSet: args.record || null,
      ttl: args.ttl || null,
      managed: args.managed || false,
      unset: args.unset || false
    };
    
    if (args.quiet && output) {
      // In quiet mode, output is machine-readable
      try {
        const parsedOutput = JSON.parse(output);
        Object.assign(result, { parsedOutput });
      } catch {
        // If parsing fails, just include raw output
      }
    }
    
    return formatToolResponse("success", `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`, result);
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};