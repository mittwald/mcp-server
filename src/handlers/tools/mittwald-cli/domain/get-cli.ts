import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldDomainGetArgs {
  domainId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleDomainGetCli: MittwaldToolHandler<MittwaldDomainGetArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'get', args.domainId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('domain')) {
        return formatToolResponse(
          "error",
          `Domain not found: ${args.domainId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get domain: ${errorMessage}`
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
        domain: data.domain,
        connected: data.connected,
        deleted: data.deleted,
        nameservers: data.nameservers,
        usesDefaultNameserver: data.usesDefaultNameserver,
        projectId: data.projectId,
        contactHash: data.contactHash,
        authCode: data.authCode,
        id: data.id
      };
      
      return formatToolResponse(
        "success",
        `Domain information retrieved for ${args.domainId}`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Domain retrieved (raw output)",
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
