import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCommand } from '@/utils/executeCommand.js';

export async function handleMittwaldDatabaseMysqlCreate(
  description: string,
  version: string,
  projectId?: string,
  quiet?: boolean,
  collation?: string,
  characterSet?: string,
  userPassword?: string,
  userExternal?: boolean,
  userAccessLevel?: string
): Promise<CallToolResult> {
  try {
    const args = ['database', 'mysql', 'create'];

    args.push('--description', description);
    args.push('--version', version);

    if (projectId) {
      args.push('--project-id', projectId);
    }

    if (quiet) {
      args.push('--quiet');
    }

    if (collation) {
      args.push('--collation', collation);
    }

    if (characterSet) {
      args.push('--character-set', characterSet);
    }

    if (userPassword) {
      args.push('--user-password', userPassword);
    }

    if (userExternal) {
      args.push('--user-external');
    }

    if (userAccessLevel) {
      args.push('--user-access-level', userAccessLevel);
    }

    const result = await executeCommand(`mw ${args.join(' ')}`);

    return formatToolResponse('success', 'MySQL database created successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error creating MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
}