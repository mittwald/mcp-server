import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlListSchema = z.object({
  projectId: z.string().optional(),
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("txt"),
  extended: z.boolean().optional(),
  noHeader: z.boolean().optional(),
  noTruncate: z.boolean().optional(),
  noRelativeDates: z.boolean().optional(),
  csvSeparator: z.enum([",", ";"]).optional(),
});

export async function handleDatabaseMysqlList(
  input: z.infer<typeof MittwaldDatabaseMysqlListSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "list"];

  if (input.projectId) {
    args.push("--project-id", input.projectId);
  }

  args.push("-o", input.output);

  if (input.extended) {
    args.push("--extended");
  }

  if (input.noHeader) {
    args.push("--no-header");
  }

  if (input.noTruncate) {
    args.push("--no-truncate");
  }

  if (input.noRelativeDates) {
    args.push("--no-relative-dates");
  }

  if (input.csvSeparator) {
    args.push("--csv-separator", input.csvSeparator);
  }

  try {
    const result = await executeCommand("mw", args);

    return {
      content: [
        {
          type: "text",
          text: `MySQL databases list:\n${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to list MySQL databases: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}