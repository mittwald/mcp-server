import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlImportArgs {
  databaseId: string;
  input: string;
  mysqlPassword?: string;
  mysqlCharset?: string;
  temporaryUser?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  gzip?: boolean;
}

export const handleDatabaseMysqlImportCli: MittwaldToolHandler<MittwaldDatabaseMysqlImportArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'mysql', 'import'];
    
    // Required arguments
    cliArgs.push(args.databaseId);
    cliArgs.push('--input', args.input);
    
    
    // MySQL options
    if (args.mysqlPassword) {
      cliArgs.push('--mysql-password', args.mysqlPassword);
    }
    
    if (args.mysqlCharset) {
      cliArgs.push('--mysql-charset', args.mysqlCharset);
    }
    
    // Temporary user option
    if (args.temporaryUser !== undefined) {
      cliArgs.push(args.temporaryUser ? '--temporary-user' : '--no-temporary-user');
    }
    
    // SSH options
    if (args.sshUser) {
      cliArgs.push('--ssh-user', args.sshUser);
    }
    
    if (args.sshIdentityFile) {
      cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
    }
    
    // Compression
    if (args.gzip) {
      cliArgs.push('--gzip');
    }
    
    // Execute CLI command with longer timeout for imports
    const result = await executeCli('mw', cliArgs, {
      timeout: 300000, // 5 minutes timeout for large imports
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || '',
        // Pass MySQL password via environment variable if provided
        ...(args.mysqlPassword && { MYSQL_PWD: args.mysqlPassword }),
        // Pass SSH settings via environment variables if provided
        ...(args.sshUser && { MITTWALD_SSH_USER: args.sshUser }),
        ...(args.sshIdentityFile && { MITTWALD_SSH_IDENTITY_FILE: args.sshIdentityFile })
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when importing to MySQL database. Check if your API token has database write permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        if (errorMessage.includes('database')) {
          return formatToolResponse(
            "error",
            `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${errorMessage}`
          );
        } else {
          return formatToolResponse(
            "error",
            `Input file not found. Please verify the file path: ${args.input}\nError: ${errorMessage}`
          );
        }
      }
      
      if (errorMessage.includes('SSH') && errorMessage.includes('connection')) {
        return formatToolResponse(
          "error",
          `SSH connection failed. Check your SSH configuration and credentials.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('password') && errorMessage.includes('authentication')) {
        return formatToolResponse(
          "error",
          `MySQL authentication failed. Check your password or enable temporary user option.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return formatToolResponse(
          "error",
          `Database import operation timed out. Try again or check file size and compression.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('permission denied') && errorMessage.includes('file')) {
        return formatToolResponse(
          "error",
          `Cannot read input file. Check file permissions and path: ${args.input}\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('SQL') && errorMessage.includes('syntax')) {
        return formatToolResponse(
          "error",
          `SQL syntax error in dump file. Please verify the dump file format and content.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('disk') && errorMessage.includes('space')) {
        return formatToolResponse(
          "error",
          `Insufficient disk space for import operation. Please free up space or contact support.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to import MySQL dump: ${errorMessage}`
      );
    }
    
    // Build result data
    const resultData = {
      databaseId: args.databaseId,
      inputFile: args.input,
      compressed: args.gzip || false,
      temporaryUser: args.temporaryUser,
      success: true,
      output: result.stdout
    };
    
    const inputSource = args.input === '-' || args.input === '/dev/stdin' ? 'stdin' : args.input;
    
    return formatToolResponse(
      "success",
      `Successfully imported MySQL dump from ${inputSource} to database '${args.databaseId}'`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};