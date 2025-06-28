import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ddev_render_config } from "../../../../constants/tool/mittwald-cli/ddev/render-config.js";
import { getMittwaldClient } from "../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../types/request-context.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

export const ddevRenderConfigSchema = z.object({
  installationId: z.string().optional(),
  overrideType: z.enum([
    "backdrop",
    "craftcms", 
    "django4",
    "drupal6",
    "drupal7",
    "drupal",
    "laravel",
    "magento",
    "magento2",
    "php",
    "python",
    "shopware6",
    "silverstripe",
    "typo3",
    "wordpress",
    "auto"
  ]).default("auto").optional(),
  withoutDatabase: z.boolean().optional(),
  databaseId: z.string().optional()
});

export type DdevRenderConfigParams = z.infer<typeof ddevRenderConfigSchema>;

export async function handleDdevRenderConfig(
  params: DdevRenderConfigParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = "mw ddev render-config";
    
    if (params.installationId) {
      command += ` ${params.installationId}`;
    }
    
    // Add flags
    if (params.overrideType && params.overrideType !== "auto") {
      command += ` --override-type ${params.overrideType}`;
    }
    
    if (params.withoutDatabase) {
      command += " --without-database";
    } else if (params.databaseId) {
      command += ` --database-id ${params.databaseId}`;
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error) {
      throw new Error(`DDEV render-config failed: ${error}`);
    }
    
    // Check if config.yaml was created or output was generated
    const configPath = join(process.cwd(), ".ddev", "config.yaml");
    const configExists = existsSync(configPath);
    
    // Format the response
    const result = {
      success: Boolean(output),
      message: output 
        ? "DDEV configuration rendered successfully" 
        : "No DDEV configuration output generated",
      configPath: configExists ? configPath : null,
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