import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlPortForwardSchema = z.object({
  databaseId: z.string(),
  port: z.number().default(3306),
  sshUser: z.string().optional(),
  sshIdentityFile: z.string().optional(),
});

export async function handleDatabaseMysqlPortForward(
  input: z.infer<typeof MittwaldDatabaseMysqlPortForwardSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "port", "forward", input.databaseId];

  args.push("--port", input.port.toString());

  if (input.sshUser) {
    args.push("--ssh-user", input.sshUser);
  }

  if (input.sshIdentityFile) {
    args.push("--ssh-identity-file", input.sshIdentityFile);
  }

  try {
    const result = await executeCommand(`mw ${args.join(' ')}`);

    return {
      content: [
        {
          type: "text",
          text: `Port forwarding established for MySQL database ${input.databaseId} on local port ${input.port}\n\nOutput: ${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to establish port forwarding for MySQL database: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}