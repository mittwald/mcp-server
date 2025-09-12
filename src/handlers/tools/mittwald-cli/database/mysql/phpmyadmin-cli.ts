import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDatabaseMysqlPhpmyadminArgs {
  databaseId: string;
}

export const handleDatabaseMysqlPhpmyadminCli: MittwaldToolHandler<MittwaldDatabaseMysqlPhpmyadminArgs> = async (args) => {
  try {
    // Build CLI command for user to execute
    const cliArgs: string[] = ['mw', 'database', 'mysql', 'phpmyadmin'];
    
    // Required database ID
    cliArgs.push(args.databaseId);
    
    const commandToExecute = cliArgs.join(' ');
    
    // Since this command opens phpMyAdmin in a browser, we cannot execute it directly
    // Instead, we provide the user with the command to run
    const instructions = `
BROWSER COMMAND: phpMyAdmin

The phpMyAdmin command opens a web browser to access the phpMyAdmin interface for your MySQL database.

To open phpMyAdmin for your MySQL database, please run the following command in your terminal:

${commandToExecute}

This will:
1. Authenticate with your Mittwald account
2. Generate a secure access URL for phpMyAdmin
3. Open your default web browser to the phpMyAdmin interface
4. Provide direct access to database ${args.databaseId}

NOTES:
- This command requires a web browser to be available
    - Ensure you are authenticated with the Mittwald CLI (run 'mw login' if needed)
- The session is secure and tied to your authentication
- You can manage your database through the phpMyAdmin web interface

TIP: 
- Make sure you have a web browser available on your system
- The phpMyAdmin session will be automatically authenticated
    `;

    return formatToolResponse(
      "success",
      "phpMyAdmin access command prepared",
      {
        command: commandToExecute,
        databaseId: args.databaseId,
        requiresBrowser: true,
        instructions: instructions.trim(),
        environmentVariables: {}
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to prepare phpMyAdmin command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
