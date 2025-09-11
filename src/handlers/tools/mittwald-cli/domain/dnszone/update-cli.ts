import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDomainDnszoneUpdateArgs {
  dnszoneId: string;
  recordSet: 'a' | 'mx' | 'txt' | 'srv' | 'cname';
  projectId?: string;
  set?: string[];
  recordId?: string;
  unset?: string[];
  managed?: boolean;
  record?: string[];
  ttl?: number;
}

export const handleDomainDnszoneUpdateCli: MittwaldToolHandler<MittwaldDomainDnszoneUpdateArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'dnszone', 'update', args.dnszoneId, args.recordSet];
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.managed) {
      cliArgs.push('--managed');
    }
    
    if (args.unset) {
      cliArgs.push('--unset');
    }
    
    if (args.record && args.record.length > 0) {
      for (const record of args.record) {
        cliArgs.push('--record', record);
      }
    }
    
    if (args.ttl) {
      cliArgs.push('--ttl', args.ttl.toString());
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('zone')) {
        return formatToolResponse(
          "error",
          `DNS zone not found: ${args.dnszoneId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update DNS zone: ${errorMessage}`
      );
    }
    
    // Parse output
    try {
      let parsedData = null;
      
      if (result.stdout.trim()) {
        // Try to parse as JSON if there's output
        try {
          parsedData = parseJsonOutput(result.stdout);
        } catch {
          // If JSON parsing fails, use raw output
          parsedData = { rawOutput: result.stdout };
        }
      }
      
      // Format the response
      const formattedData = {
        success: true,
        message: `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
        dnszoneId: args.dnszoneId,
        recordSet: args.recordSet,
        output: result.stdout || null,
        parsedData: parsedData,
        recordsSet: args.record || null,
        ttl: args.ttl || null,
        managed: args.managed || false,
        unset: args.unset || false
      };
      
      return formatToolResponse(
        "success",
        `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
        formattedData
      );
      
    } catch (parseError) {
      // If parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "DNS zone updated (raw output)",
        {
          rawOutput: result.stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
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