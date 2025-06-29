import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlShellSchema = z.object({
  databaseId: z.string(),
  mysqlPassword: z.string().optional(),
  mysqlCharset: z.string().optional(),
  temporaryUser: z.boolean().optional(),
  sshUser: z.string().optional(),
  sshIdentityFile: z.string().optional(),
});

export async function handleDatabaseMysqlShell(
  input: z.infer<typeof MittwaldDatabaseMysqlShellSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "shell", input.databaseId];

  if (input.mysqlPassword) {
    args.push("-p", input.mysqlPassword);
  }

  if (input.mysqlCharset) {
    args.push("--mysql-charset", input.mysqlCharset);
  }

  if (input.temporaryUser !== undefined) {
    args.push(input.temporaryUser ? "--temporary-user" : "--no-temporary-user");
  }

  if (input.sshUser) {
    args.push("--ssh-user", input.sshUser);
  }

  if (input.sshIdentityFile) {
    args.push("--ssh-identity-file", input.sshIdentityFile);
  }

  try {
    const result = await executeCommand("mw", args);

    return {
      content: [
        {
          type: "text",
          text: `MySQL shell connection established for database ${input.databaseId}\n\nOutput: ${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to connect to MySQL shell: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}