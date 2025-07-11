import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldLoginTokenArgs {
  token: string;
}

export const handleLoginTokenCli: MittwaldCliToolHandler<MittwaldLoginTokenArgs> = async (args) => {
  try {
    // Validate required parameters
    if (!args.token) {
      return formatToolResponse(
        "error",
        "API token is required"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['login', 'token', args.token];
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('invalid token') || errorMessage.includes('authentication failed')) {
        return formatToolResponse(
          "error",
          `Invalid API token: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('network error') || errorMessage.includes('connection failed')) {
        return formatToolResponse(
          "error",
          `Network error during login: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to login with token: ${errorMessage}`
      );
    }
    
    // Parse success output
    const output = result.stdout.trim();
    
    const responseData = {
      message: 'Login successful with API token',
      output: output || null,
      timestamp: new Date().toISOString()
    };
    
    return formatToolResponse(
      "success",
      "Login successful with API token",
      responseData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};