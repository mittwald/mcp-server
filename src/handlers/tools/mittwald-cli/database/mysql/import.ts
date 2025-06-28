import { z } from "zod";
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeCommand } from "../../../../../utils/executeCommand.js";

export const MittwaldDatabaseMysqlImportSchema = z.object({
  databaseId: z.string(),
  input: z.string(),
  mysqlPassword: z.string().optional(),
  quiet: z.boolean().optional(),
  gzip: z.boolean().optional(),
  mysqlCharset: z.string().optional(),
  temporaryUser: z.boolean().optional(),
  sshUser: z.string().optional(),
  sshIdentityFile: z.string().optional(),
});

export async function handleDatabaseMysqlImport(
  input: z.infer<typeof MittwaldDatabaseMysqlImportSchema>
): Promise<CallToolResult> {
  const args = ["database", "mysql", "import", input.databaseId];

  args.push("-i", input.input);

  if (input.mysqlPassword) {
    args.push("-p", input.mysqlPassword);
  }

  if (input.quiet) {
    args.push("-q");
  }

  if (input.gzip) {
    args.push("--gzip");
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

    const isStdin = input.input === "-" || input.input === "/dev/stdin";
    
    return {
      content: [
        {
          type: "text",
          text: `MySQL database import ${isStdin ? 'from stdin' : `from ${input.input}`} completed successfully\n\nOutput: ${result.stdout}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to import MySQL database: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}