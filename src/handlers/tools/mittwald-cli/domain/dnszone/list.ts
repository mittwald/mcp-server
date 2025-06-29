import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const domainDnszoneListSchema = z.object({
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().default("json"),
  projectId: z.string().optional(),
  extended: z.boolean().optional(),
  noHeader: z.boolean().optional(),
  noTruncate: z.boolean().optional(),
  noRelativeDates: z.boolean().optional(),
  csvSeparator: z.enum([",", ";"]).optional().default(",")
});

interface DomainDnszoneListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  projectId?: string;
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDomainDnszoneList: MittwaldToolHandler<DomainDnszoneListArgs> = async (args) => {
  try {
    let command = "mw domain dnszone list";

    // Add optional project ID
    if (args.projectId) {
      command += ` --project-id ${args.projectId}`;
    }

    // Add output format
    const output = args.output || 'txt';
    if (output !== "txt") {
      command += ` --output ${output}`;
    }

    // Add other flags
    if (args.extended) {
      command += " --extended";
    }
    if (args.noHeader) {
      command += " --no-header";
    }
    if (args.noTruncate) {
      command += " --no-truncate";
    }
    if (args.noRelativeDates) {
      command += " --no-relative-dates";
    }
    if (args.csvSeparator && output === "csv") {
      command += ` --csv-separator "${args.csvSeparator}"`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      return formatToolResponse("error", stderr);
    }

    return formatToolResponse("success", "DNS zones listed successfully", {
      command: command,
      format: output,
      output: stdout
    });
  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : "Failed to list DNS zones"
    );
  }
};