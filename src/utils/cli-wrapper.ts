import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CliExecuteOptions {
  timeout?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
}

export interface CliExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCli(
  command: string,
  args: string[],
  options: CliExecuteOptions = {}
): Promise<CliExecuteResult> {
  const {
    timeout = 30000,
    maxBuffer = 1024 * 1024 * 10, // 10MB
    env = {}
  } = options;

  // Escape arguments to prevent shell injection and handle Unicode
  const escapedArgs = args.map(arg => {
    // Always quote arguments that contain spaces, special chars, or non-ASCII characters
    if (/[\s"'\\$`!@#%&*(){}[\]|;:<>?~`]/.test(arg) || /[^\x00-\x7F]/.test(arg)) {
      // Escape quotes, backslashes, and dollar signs within quoted strings
      const escaped = arg.replace(/["\\$`]/g, '\\$&');
      return `"${escaped}"`;
    }
    return arg;
  });

  const fullCommand = `${command} ${escapedArgs.join(' ')}`;
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout,
      maxBuffer,
      env: {
        ...process.env,
        ...env,
        // Ensure non-interactive mode
        MITTWALD_NONINTERACTIVE: '1',
        CI: '1'
      }
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0
    };
  } catch (error: any) {
    // exec throws an error if the command exits with non-zero
    let stderr = error.stderr?.trim() || '';
    
    // If stderr is empty but we have an error message, use that
    if (!stderr && error.message) {
      stderr = error.message;
    }
    
    // If we have a signal (like timeout), include that information
    if (error.signal) {
      stderr = `Command killed with signal ${error.signal}. ${stderr}`.trim();
    }
    
    // Include the full command in error output for debugging
    if (!stderr.includes(fullCommand)) {
      stderr = `Command: ${fullCommand}\nError: ${stderr}`.trim();
    }
    
    return {
      stdout: error.stdout?.trim() || '',
      stderr,
      exitCode: error.code || 1
    };
  }
}

export function parseJsonOutput(output: string): any {
  try {
    // Handle multiline JSON output
    const lines = output.split('\n');
    
    // Try to find JSON in the output
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') || line.startsWith('[')) {
        // Found potential JSON start, collect all lines until valid JSON
        let jsonStr = line;
        for (let j = i + 1; j < lines.length; j++) {
          jsonStr += '\n' + lines[j];
          try {
            return JSON.parse(jsonStr);
          } catch {
            // Continue collecting lines
          }
        }
        // Try parsing what we have
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Continue to next potential JSON start
        }
      }
    }
    
    // If no valid JSON found, try parsing the entire output
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseQuietOutput(output: string): string | null {
  // Quiet mode typically outputs just the ID
  const lines = output.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    // Return the last non-empty line (usually the ID)
    return lines[lines.length - 1].trim();
  }
  return null;
}