import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserSshKeyCreateArgs {
  quiet?: boolean;
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
    
    if (args.quiet) {
      cliArgs.push('--quiet');
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
    
    // Handle quiet mode output
    if (args.quiet) {
      const keyId = parseQuietOutput(result.stdout);
      
      if (!keyId) {
        return formatToolResponse(
          "error",
          "Failed to create SSH key - no key ID returned"
        );
      }
      
      return formatToolResponse(
        "success",
        keyId,
        { 
          keyId: keyId
        }
      );
    }
    
    // For non-quiet mode, return success with the output
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
