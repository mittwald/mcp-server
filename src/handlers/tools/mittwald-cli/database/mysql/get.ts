import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlGetSchema = z.object({
  databaseId: z.string(),
  output: z.enum(["txt", "json", "yaml"]).default("txt"),
});

export async function handleDatabaseMysqlGet(
  input: z.infer<typeof MittwaldDatabaseMysqlGetSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "get", input.databaseId];

  args.push("-o", input.output);

  try {
    const result = await executeCommand("mw", args);

    return {
      content: [
        {
          type: "text",
          text: `MySQL database information:\n${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to get MySQL database information: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}