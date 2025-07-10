import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlCreateArgs {
  description: string;
  version: string;
  projectId?: string;
  quiet?: boolean;
  collation?: string;
  characterSet?: string;
  userPassword?: string;
  userExternal?: boolean;
  userAccessLevel?: "full" | "readonly";
}

export const handleDatabaseMysqlCreateCli: MittwaldToolHandler<MittwaldDatabaseMysqlCreateArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'create'];
    
    // Required arguments
    cliArgs.push('--description', args.description);
    cliArgs.push('--version', args.version);
    
    // Optional project ID
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    // Quiet mode
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Character settings
    if (args.collation) {
      cliArgs.push('--collation', args.collation);
    }
    
    if (args.characterSet) {
      cliArgs.push('--character-set', args.characterSet);
    }
    
    // User settings
    if (args.userPassword) {
      cliArgs.push('--user-password', args.userPassword);
    }
    
    if (args.userExternal) {
      cliArgs.push('--user-external');
    }
    
    if (args.userAccessLevel) {
      cliArgs.push('--user-access-level', args.userAccessLevel);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || '',
        // Pass user password via environment variable if provided
        ...(args.userPassword && { MYSQL_PWD: args.userPassword })
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when creating MySQL database. Check if your API token has database creation permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('version') && errorMessage.includes('not supported')) {
        return formatToolResponse(
          "error",
          `MySQL version '${args.version}' is not supported. Use the 'database mysql versions' command to list available versions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') && errorMessage.includes('password')) {
        return formatToolResponse(
          "error",
          `Invalid password provided. Please check password requirements.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create MySQL database: ${errorMessage}`
      );
    }
    
    // Parse the output
    let databaseId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      databaseId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "MySQL database created successfully with ID mysql-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        databaseId = idMatch[1];
      }
    }
    
    if (!databaseId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created MySQL database '${args.description}'`,
        {
          description: args.description,
          version: args.version,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: databaseId,
      description: args.description,
      version: args.version,
      ...(args.projectId && { projectId: args.projectId }),
      ...(args.collation && { collation: args.collation }),
      ...(args.characterSet && { characterSet: args.characterSet }),
      ...(args.userAccessLevel && { userAccessLevel: args.userAccessLevel }),
      ...(args.userExternal !== undefined && { userExternal: args.userExternal })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        databaseId :
        `Successfully created MySQL database '${args.description}' with ID ${databaseId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};