/**
 * @file Redis database shell handler
 * @module handlers/tools/mittwald-cli/database/redis-shell
 */

import { z } from 'zod';
import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

export const MittwaldDatabaseRedisShellSchema = z.object({
  databaseId: z.string(),
  quiet: z.boolean().optional().default(false),
  sshUser: z.string().optional(),
  sshIdentityFile: z.string().optional(),
});

export type MittwaldDatabaseRedisShellInput = z.infer<typeof MittwaldDatabaseRedisShellSchema>;

export const handleMittwaldDatabaseRedisShell: MittwaldToolHandler<MittwaldDatabaseRedisShellInput> = async (
  args
) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'redis', 'shell'];
    
    // Required arguments
    cliArgs.push(args.databaseId);
    
    // Optional arguments
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
    }
    
    // Note: Interactive shell sessions are not directly supported in MCP context
    // This command would typically open an interactive redis-cli session
    // For MCP, we'll return information about the connection instead
    
    return formatToolResponse(
      "success",
      `Redis shell connection would be initiated for database ${args.databaseId}.\n\nNote: Interactive shell sessions are not directly supported in MCP context.\nThe CLI command would be: mw ${cliArgs.join(' ')}\n\nConsider using specific Redis commands or connection information for programmatic access.`,
      {
        databaseId: args.databaseId,
        command: `mw ${cliArgs.join(' ')}`,
        sshUser: args.sshUser,
        sshIdentityFile: args.sshIdentityFile,
        connectionType: 'redis-cli',
        note: 'Interactive shell sessions require terminal access and are not suitable for MCP automation'
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to prepare Redis shell command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};