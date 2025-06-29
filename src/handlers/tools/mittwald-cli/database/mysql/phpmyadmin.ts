import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlPhpmyadminSchema = z.object({
  databaseId: z.string(),
});

export async function handleDatabaseMysqlPhpmyadmin(
  input: z.infer<typeof MittwaldDatabaseMysqlPhpmyadminSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "phpmyadmin", input.databaseId];

  try {
    const result = await executeCommand(`mw ${args.join(' ')}`);

    return {
      content: [
        {
          type: "text",
          text: `phpMyAdmin opened for MySQL database ${input.databaseId}\n\nOutput: ${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to open phpMyAdmin for MySQL database: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}