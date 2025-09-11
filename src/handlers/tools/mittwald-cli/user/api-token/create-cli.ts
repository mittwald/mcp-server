import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ("api_read" | "api_write")[];
  expires?: string;
}

export const handleUserApiTokenCreateCli: MittwaldCliToolHandler<MittwaldUserApiTokenCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'api-token', 'create'];
    
    // Required arguments
    cliArgs.push('--description', args.description);
    
    // Add roles (multiple values)
    args.roles.forEach(role => {
      cliArgs.push('--roles', role);
    });
    
    // Optional arguments
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
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
        `Failed to create API token: ${errorMessage}`
      );
    }
    
    // Parse the output
    // The CLI might return structured output or just the token
    const output = result.stdout.trim();
    
    // Try to extract the token from the output
    // This might be in the format "Token: <token>" or just the token itself
    let token = output;
    const tokenMatch = output.match(/Token:\s*(.+)/i) || output.match(/^([a-zA-Z0-9_-]+)$/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }
    
    if (!token) {
      return formatToolResponse(
        "error",
        "Failed to create API token - no token in output"
      );
    }
    
    return formatToolResponse(
      "success",
      `API token created successfully`,
      {
        token: token,
        description: args.description,
        roles: args.roles,
        expires: args.expires,
        rawOutput: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};