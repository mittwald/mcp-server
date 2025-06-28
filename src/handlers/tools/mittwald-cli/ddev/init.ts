import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ddev_init } from "../../../../constants/tool/mittwald-cli/ddev/init.js";
import { getMittwaldClient } from "../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../types/request-context.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

export const ddevInitSchema = ddev_init.parameters;
export type DdevInitParams = z.infer<typeof ddevInitSchema>;

export async function handleDdevInit(
  params: DdevInitParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Build the command
    let command = "mw ddev init";
    
    if (params.installationId) {
      command += ` ${params.installationId}`;
    }
    
    // Add flags
    if (params.quiet) {
      command += " --quiet";
    }
    
    if (params.overrideType && params.overrideType !== "auto") {
      command += ` --override-type ${params.overrideType}`;
    }
    
    if (params.withoutDatabase) {
      command += " --without-database";
    } else if (params.databaseId) {
      command += ` --database-id ${params.databaseId}`;
    }
    
    if (params.projectName) {
      command += ` --project-name ${params.projectName}`;
    }
    
    if (params.overrideMittwaldPlugin) {
      command += ` --override-mittwald-plugin ${params.overrideMittwaldPlugin}`;
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    // Parse the output
    const output = stdout.trim();
    const error = stderr.trim();
    
    if (error && !params.quiet) {
      throw new Error(`DDEV init failed: ${error}`);
    }
    
    // Check if .ddev directory was created
    const ddevDir = join(process.cwd(), ".ddev");
    const ddevExists = existsSync(ddevDir);
    
    // Format the response
    const result = {
      success: ddevExists,
      message: ddevExists 
        ? "DDEV project initialized successfully" 
        : "DDEV initialization may have failed",
      ddevDirectory: ddevExists ? ddevDir : null,
      output: output || null,
      command: command
    };
    
    if (params.quiet && output) {
      // In quiet mode, output is machine-readable
      try {
        const parsedOutput = JSON.parse(output);
        Object.assign(result, { parsedOutput });
      } catch {
        // If parsing fails, just include raw output
      }
    }
    
    return formatToolResponse("success", result);
  } catch (error) {
    return formatToolResponse(
      "error",
      {},
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}