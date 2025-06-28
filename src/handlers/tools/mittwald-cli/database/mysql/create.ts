import { ToolResponse } from '@/types/mcp';
import { executeCliCommand } from '@/utils/execute-cli-command';

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
): Promise<ToolResponse> {
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

    const result = await executeCliCommand('mw', args);

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error creating MySQL database: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}