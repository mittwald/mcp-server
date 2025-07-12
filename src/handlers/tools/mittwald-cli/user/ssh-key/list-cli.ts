import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleUserSshKeyListCli: MittwaldCliToolHandler<MittwaldUserSshKeyListArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'ssh-key', 'list'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Optional flags
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
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      return formatToolResponse(
        "error",
        `Failed to list SSH keys: ${errorMessage}`
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
          "No SSH keys found",
          []
        );
      }
      
      // Format the data to match expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        comment: item.comment,
        fingerprint: item.fingerprint,
        publicKey: item.publicKey,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        // Include any additional fields from the CLI output
        ...item
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} SSH key(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "SSH keys retrieved (raw output)",
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