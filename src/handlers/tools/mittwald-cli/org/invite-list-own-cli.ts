import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldOrgInviteListOwnArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleOrgInviteListOwnCli: MittwaldToolHandler<MittwaldOrgInviteListOwnArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'invite', 'list-own'];
    
    // Add output format
    if (args.output) {
      cliArgs.push('--output', args.output);
    }
    
    // Add extended flag
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    // Add no-header flag
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    // Add no-truncate flag
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    // Add no-relative-dates flag
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    // Add CSV separator
    if (args.csvSeparator && (args.output === 'csv' || args.output === 'tsv')) {
      cliArgs.push('--csv-separator', args.csvSeparator);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      return formatToolResponse(
        "error",
        `Failed to list user's organization invites: ${errorMessage}`
      );
    }
    
    // If output is JSON, parse and return structured data
    if (args.output === 'json') {
      try {
        const data = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Found ${Array.isArray(data) ? data.length : 0} organization invite(s) for the user`,
          data
        );
      } catch (parseError) {
        return formatToolResponse(
          "success",
          "User's organization invites retrieved (raw output)",
          {
            rawOutput: result.stdout,
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        );
      }
    }
    
    // For other output formats, return raw output
    return formatToolResponse(
      "success",
      "User's organization invites retrieved",
      {
        output: result.stdout,
        format: args.output || 'txt'
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
