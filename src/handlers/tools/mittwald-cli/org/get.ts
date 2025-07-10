import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldOrgGetArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleOrgGetCli: MittwaldToolHandler<MittwaldOrgGetArgs> = async (args, { orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      return formatToolResponse(
        "error",
        "Organization ID is required. Either provide it as a parameter or set a default org in the context."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'get'];
    
    // Add org ID
    cliArgs.push('--org-id', orgId);
    
    // Add output format
    if (args.output) {
      cliArgs.push('--output', args.output);
    } else {
      // Default to JSON for consistent parsing
      cliArgs.push('--output', 'json');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Organization not found: ${orgId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get organization: ${errorMessage}`
      );
    }
    
    // If output is JSON, parse and return structured data
    if (args.output === 'json' || !args.output) {
      try {
        const data = parseJsonOutput(result.stdout);
        return formatToolResponse(
          "success",
          `Organization ${orgId} details`,
          data
        );
      } catch (parseError) {
        return formatToolResponse(
          "success",
          "Organization retrieved (raw output)",
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
      `Organization ${orgId} details`,
      {
        output: result.stdout,
        format: args.output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Export with old name for backward compatibility
export const handleOrgGet = handleOrgGetCli;