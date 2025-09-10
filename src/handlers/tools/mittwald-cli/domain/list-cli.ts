import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldDomainListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDomainListCli: MittwaldToolHandler<MittwaldDomainListArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'list'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.csvSeparator && args.output === 'csv') {
      cliArgs.push('--csv-separator', args.csvSeparator);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list domains: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!Array.isArray(data)) {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      if (data.length === 0) {
        return formatToolResponse(
          "success",
          "No domains found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        domain: item.domain,
        connected: item.connected,
        deleted: item.deleted,
        nameservers: item.nameservers,
        usesDefaultNameserver: item.usesDefaultNameserver,
        projectId: item.projectId,
        contactHash: item.contactHash,
        authCode: item.authCode
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} domain(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Domains retrieved (raw output)",
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
