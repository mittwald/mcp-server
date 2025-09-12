import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldDomainVirtualhostGetArgs {
  virtualhostId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainVirtualhostGetCli: MittwaldToolHandler<MittwaldDomainVirtualhostGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'virtualhost', 'get', args.virtualhostId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Virtual host not found: ${args.virtualhostId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get virtual host: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      // Format the data to match our expected structure
      const formattedData = {
        id: data.id,
        hostname: data.hostname,
        projectId: data.projectId,
        paths: data.paths,
        status: data.status,
        ips: data.ips,
        dnsValidationErrors: data.dnsValidationErrors || []
      };
      
      return formatToolResponse(
        "success",
        `Virtual host details for ${data.hostname}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Virtual host retrieved (raw output)",
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
