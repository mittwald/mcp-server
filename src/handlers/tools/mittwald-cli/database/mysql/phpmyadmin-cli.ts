import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlPhpmyadminArgs {
  databaseId: string;
}

function buildCliCommand(args: MittwaldDatabaseMysqlPhpmyadminArgs): string {
  const cliArgs: string[] = ['mw', 'database', 'mysql', 'phpmyadmin', args.databaseId];
  return cliArgs.join(' ');
}

function buildInstructions(command: string, databaseId: string): string {
  return `BROWSER COMMAND: phpMyAdmin

The phpMyAdmin command opens a web browser to access the phpMyAdmin interface for your MySQL database.

To open phpMyAdmin for your MySQL database, please run the following command in your terminal:

${command}

This will:
1. Authenticate with your Mittwald account
2. Generate a secure access URL for phpMyAdmin
3. Open your default web browser to the phpMyAdmin interface
4. Provide direct access to database ${databaseId}

NOTES:
- This command requires a web browser to be available
  - Ensure you are authenticated with the Mittwald CLI (run 'mw login' if needed)
- The session is secure and tied to your authentication
- You can manage your database through the phpMyAdmin web interface

TIP:
- Make sure you have a web browser available on your system
- The phpMyAdmin session will be automatically authenticated`; 
}

export const handleDatabaseMysqlPhpmyadminCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlPhpmyadminArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  try {
    const commandToExecute = buildCliCommand(args);
    const instructions = buildInstructions(commandToExecute, args.databaseId);

    return formatToolResponse(
      'success',
      'phpMyAdmin access command prepared',
      {
        command: commandToExecute,
        databaseId: args.databaseId,
        requiresBrowser: true,
        instructions,
        environmentVariables: {},
      },
      {
        command: commandToExecute,
        durationMs: null,
      }
    );
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to prepare phpMyAdmin command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
