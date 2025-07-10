import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldContextGetArgs {
  output?: 'txt' | 'json' | 'yaml';
}

export const handleContextGetCli: MittwaldCliToolHandler<MittwaldContextGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['context', 'get'];
    
    // Add output format (default to json for consistent parsing)
    const outputFormat = args.output || 'json';
    cliArgs.push('--output', outputFormat);
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('No context parameters')) {
        return formatToolResponse(
          "success",
          "No context parameters are currently set",
          {
            context: {},
            message: 'No context parameters are currently set',
            formattedOutput: errorMessage,
            format: outputFormat
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get context: ${errorMessage}`
      );
    }
    
    // Parse output based on format
    let parsedData;
    let contextData = {};
    
    if (outputFormat === 'json') {
      try {
        parsedData = parseJsonOutput(result.stdout);
        contextData = parsedData;
      } catch (parseError) {
        // If JSON parsing fails, return the raw output
        return formatToolResponse(
          "success",
          "Context retrieved (raw output)",
          {
            rawOutput: result.stdout,
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            format: outputFormat
          }
        );
      }
    } else {
      // For txt/yaml output, return as-is
      parsedData = result.stdout;
      
      // Try to extract context values from text output
      if (outputFormat === 'txt' && result.stdout) {
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            (contextData as any)[key] = value;
          }
        }
      }
    }
    
    const contextCount = Object.keys(contextData).length;
    const message = contextCount > 0 
      ? `Found ${contextCount} context parameter(s)`
      : 'No context parameters set';
    
    return formatToolResponse(
      "success",
      message,
      {
        context: contextData,
        formattedOutput: parsedData,
        format: outputFormat
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};