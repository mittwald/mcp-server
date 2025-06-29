import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCommand } from '../../../../utils/executeCommand.js';
import { z } from 'zod';

export const ddevRenderConfigSchema = z.object({
  appInstallationId: z.string(),
  force: z.boolean().optional()
});

export interface DdevRenderConfigArgs {
  appInstallationId: string;
  force?: boolean;
}

export const handleDdevRenderConfig: MittwaldToolHandler<DdevRenderConfigArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate required parameters
    if (!args.appInstallationId) {
      return formatToolResponse(
        "error",
        "app-installation-id is required"
      );
    }
    
    // Build the command
    let command = `mw ddev render-config "${args.appInstallationId}"`;
    
    if (args.force) {
      command += " --force";
    }
    
    // Execute the command
    const { stdout, stderr } = await executeCommand(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DDEV render-config failed: ${error}`);
    }
    
    // Parse config path from output if available
    let configPath = null;
    const configPathMatch = output.match(/Generated configuration file: (.+)/);
    if (configPathMatch) {
      configPath = configPathMatch[1];
    }
    
    const result = {
      success: true,
      message: "DDEV configuration rendered successfully",
      configPath: configPath,
      output: output || null,
      command: command
    };
    
    return formatToolResponse("success", JSON.stringify(result));
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
};