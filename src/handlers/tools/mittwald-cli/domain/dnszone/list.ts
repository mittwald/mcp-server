import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { type CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getMittwaldClient } from "../../../../../services/mittwald/mittwald-client.js";
import type { RequestContext } from "../../../../../types/request-context.js";
import { formatToolResponse } from "../../../../../utils/format-tool-response.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const domainDnszoneListSchema = z.object({
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("json"),
  projectId: z.string().optional(),
  extended: z.boolean().optional(),
  noHeader: z.boolean().optional(),
  noTruncate: z.boolean().optional(),
  noRelativeDates: z.boolean().optional(),
  csvSeparator: z.enum([",", ";"]).default(",")
});

export type DomainDnszoneListParams = z.infer<typeof domainDnszoneListSchema>;

export async function handleDomainDnszoneList(
  params: DomainDnszoneListParams,
  context: RequestContext
): Promise<CallToolRequestSchema> {
  try {
    let command = "mw domain dnszone list";

    // Add optional project ID
    if (params.projectId) {
      command += ` --project-id ${params.projectId}`;
    }

    // Add output format
    if (params.output && params.output !== "txt") {
      command += ` --output ${params.output}`;
    }

    // Add other flags
    if (params.extended) {
      command += " --extended";
    }
    if (params.noHeader) {
      command += " --no-header";
    }
    if (params.noTruncate) {
      command += " --no-truncate";
    }
    if (params.noRelativeDates) {
      command += " --no-relative-dates";
    }
    if (params.csvSeparator && params.output === "csv") {
      command += ` --csv-separator "${params.csvSeparator}"`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      return formatToolResponse("error", stderr);
    }

    return formatToolResponse("success", stdout, {
      command: command,
      format: params.output || "txt"
    });
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Failed to list DNS zones"
    );
  }
}