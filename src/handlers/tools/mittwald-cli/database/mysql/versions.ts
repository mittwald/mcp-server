import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlVersionsSchema = z.object({
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("txt"),
  extended: z.boolean().optional(),
  noHeader: z.boolean().optional(),
  noTruncate: z.boolean().optional(),
  noRelativeDates: z.boolean().optional(),
  csvSeparator: z.enum([",", ";"]).optional(),
});

export async function handleDatabaseMysqlVersions(
  input: z.infer<typeof MittwaldDatabaseMysqlVersionsSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "versions"];

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
          text: `Available MySQL versions:\n${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to list MySQL versions: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}