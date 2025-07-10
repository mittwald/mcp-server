import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldLoginStatusArgs {
  output?: 'txt' | 'json' | 'yaml';
}

export const handleLoginStatusCli: MittwaldToolHandler<MittwaldLoginStatusArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['login', 'status'];
    
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
      if (errorMessage.includes('not logged in') || errorMessage.includes('not authenticated')) {
        return formatToolResponse(
          "success",
          "Not logged in",
          {
            authenticated: false,
            message: 'Not logged in',
            formattedOutput: errorMessage,
            format: outputFormat
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to check login status: ${errorMessage}`
      );
    }
    
    // Parse output based on format
    let parsedData;
    let loginData = {};
    
    if (outputFormat === 'json') {
      try {
        parsedData = parseJsonOutput(result.stdout);
        loginData = parsedData;
      } catch (parseError) {
        // If JSON parsing fails, return the raw output
        return formatToolResponse(
          "success",
          "Login status retrieved (raw output)",
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
      
      // Try to extract login information from text output
      if (outputFormat === 'txt' && result.stdout) {
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          if (line.includes('logged in')) {
            loginData['authenticated'] = true;
          }
          if (line.includes('User:')) {
            const userMatch = line.match(/User:\s*(.+)/);
            if (userMatch) {
              loginData['user'] = userMatch[1].trim();
            }
          }
          if (line.includes('Email:')) {
            const emailMatch = line.match(/Email:\s*(.+)/);
            if (emailMatch) {
              loginData['email'] = emailMatch[1].trim();
            }
          }
        }
      }
    }
    
    const isAuthenticated = loginData['authenticated'] || 
                          loginData['user'] || 
                          loginData['email'] || 
                          result.stdout.includes('logged in');
    
    const message = isAuthenticated ? 'Logged in' : 'Not logged in';
    
    return formatToolResponse(
      "success",
      message,
      {
        authenticated: isAuthenticated,
        loginData: loginData,
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