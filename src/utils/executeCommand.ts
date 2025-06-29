/**
 * @file Execute shell commands utility
 * @module utils/executeCommand
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Execute a shell command and return the output
 * @param command - The command to execute
 * @returns Promise with stdout and stderr
 */
export async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr };
  } catch (error: any) {
    // If the command fails, we still want to return the output
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Command execution failed'
    };
  }
}

/**
 * Execute a shell command and return only stdout
 * @param command - The command to execute
 * @returns Promise with stdout
 */
export async function executeCommandStdout(command: string): Promise<string> {
  const { stdout } = await executeCommand(command);
  return stdout.trim();
}

/**
 * Execute a shell command and check if it succeeded
 * @param command - The command to execute
 * @returns Promise with success boolean and output
 */
export async function executeCommandWithStatus(command: string): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
}> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return {
      success: true,
      stdout,
      stderr
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Command execution failed'
    };
  }
}