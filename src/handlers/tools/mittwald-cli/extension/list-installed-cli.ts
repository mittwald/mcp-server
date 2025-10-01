import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldExtensionListInstalledCliArgs {
  projectId?: string;
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleExtensionListInstalledCli: MittwaldToolHandler<MittwaldExtensionListInstalledCliArgs> = async (args) => {
  try {
    // Validate that exactly one of projectId or orgId is provided
    if (!args.projectId && !args.orgId) {
      return formatToolResponse(
        "error",
        "Either projectId or orgId must be provided"
      );
    }

    if (args.projectId && args.orgId) {
      return formatToolResponse(
        "error",
        "Only one of projectId or orgId can be provided"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['extension', 'list-installed'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Context flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.orgId) {
      cliArgs.push('--org-id', args.orgId);
    }
    
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
    
    if (args.csvSeparator) {
      cliArgs.push('--csv-separator', args.csvSeparator);
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && (errorMessage.includes('project') || errorMessage.includes('organization'))) {
        return formatToolResponse(
          "error",
          `Resource not found. Please verify the ${args.projectId ? 'project' : 'organization'} ID: ${args.projectId || args.orgId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list installed extensions: ${errorMessage}`
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
          "No installed extensions found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        extensionId: item.extensionId,
        extensionName: item.extensionName || item.name,
        state: item.state || 'enabled',
        context: args.orgId ? 'organization' : 'project',
        contextId: args.orgId || args.projectId,
        disabled: item.disabled || false,
        consentedScopes: item.consentedScopes || [],
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} installed extension(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Installed extensions retrieved (raw output)",
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
