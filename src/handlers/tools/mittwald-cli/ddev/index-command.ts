import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCommand } from '../../../../utils/executeCommand.js';

export interface DdevMainArgs {
  help?: boolean;
}

export const handleDdevMain: MittwaldToolHandler<DdevMainArgs> = async (args, { mittwaldClient }) => {
  try {
    // Build the command
    let command = "mw ddev";
    
    if (args.help) {
      command += " --help";
    }
    
    // Execute the command
    const { stdout, stderr } = await executeCommand(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DDEV command failed: ${error}`);
    }
    
    // Format the response with available commands info
    const result = {
      success: true,
      message: "DDEV integration help",
      availableCommands: [
        {
          command: "mittwald_ddev_init",
          description: "Initialize a new ddev project in the current directory"
        },
        {
          command: "mittwald_ddev_render_config", 
          description: "Generate a DDEV configuration YAML file for the current app"
        }
      ],
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