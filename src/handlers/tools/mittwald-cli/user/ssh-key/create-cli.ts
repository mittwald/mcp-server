import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyCreateArgs {
  expires?: string;
  output?: string;
  noPassphrase?: boolean;
  comment?: string;
}

export const handleUserSshKeyCreateCli: MittwaldCliToolHandler<MittwaldUserSshKeyCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'ssh-key', 'create'];
    
    // Optional arguments
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
    if (args.output) {
      cliArgs.push('--output', args.output);
    }
    
    if (args.noPassphrase) {
      cliArgs.push('--no-passphrase');
    }
    
    if (args.comment) {
      cliArgs.push('--comment', args.comment);
    }
    
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      return formatToolResponse(
        "error",
        `Failed to create SSH key: ${errorMessage}`
      );
    }
    
    // Return success with the output
    const output = result.stdout.trim();
    
    return formatToolResponse(
      "success",
      output || "SSH key created successfully",
      {
        expires: args.expires,
        output: args.output,
        comment: args.comment,
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
