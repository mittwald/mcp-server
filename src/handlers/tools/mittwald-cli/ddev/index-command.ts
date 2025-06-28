import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ddev_main } from "../../../../constants/tool/mittwald-cli/ddev/index-command.js";
import { getMittwaldClient } from "../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../types/request-context.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const ddevMainSchema = z.object({
  help: z.boolean().optional()
});

export type DdevMainParams = z.infer<typeof ddevMainSchema>;

export async function handleDdevMain(
  params: DdevMainParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = "mw ddev";
    
    if (params.help) {
      command += " --help";
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
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
    
    return formatToolResponse("success", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      {},
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}