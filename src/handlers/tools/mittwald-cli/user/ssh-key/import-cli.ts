import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyImportArgs {
  expires?: string;
  input?: string;
}

export const handleUserSshKeyImportCli: MittwaldToolHandler<MittwaldUserSshKeyImportArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'ssh-key', 'import'];
    
    // Optional arguments
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
    if (args.input) {
      cliArgs.push('--input', args.input);
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
        `Failed to import SSH key: ${errorMessage}`
      );
    }
    
    // Return success with the output
    const output = result.stdout.trim();
    
    return formatToolResponse(
      "success",
      output || "SSH key imported successfully",
      {
        expires: args.expires,
        input: args.input,
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