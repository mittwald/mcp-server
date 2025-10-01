import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDomainDnszoneGetArgs {
  dnszoneId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainDnszoneGetCli: MittwaldToolHandler<MittwaldDomainDnszoneGetArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'dnszone', 'get', args.dnszoneId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
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
        `Failed to get DNS zone: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = {
        id: data.id,
        domainName: data.domainName,
        projectId: data.projectId,
        recordCount: data.recordCount,
        zone: data.zone,
        domain: data.domain,
        records: data.records || []
      };
      
      return formatToolResponse(
        "success",
        `DNS zone information retrieved for ${args.dnszoneId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "DNS zone retrieved (raw output)",
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
