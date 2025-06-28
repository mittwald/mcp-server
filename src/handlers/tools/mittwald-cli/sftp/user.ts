import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sftpUserSchema = z.object({
  help: z.boolean().default(true)
});

export async function handleSftpUser(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { help } = sftpUserSchema.parse(args);

    const helpText = `Manage SFTP users of your projects

AVAILABLE COMMANDS:
  mittwald_sftp_user_create   Create a new SFTP user
  mittwald_sftp_user_delete   Delete an SFTP user
  mittwald_sftp_user_list     List all SFTP users for a project
  mittwald_sftp_user_update   Update an existing SFTP user

DESCRIPTION:
  SFTP users allow secure file transfer access to your project files.
  Each SFTP user can be configured with specific access levels (read/full),
  restricted to specific directories, and authenticated via password or public key.

EXAMPLES:
  • Use mittwald_sftp_user_list to see all SFTP users for a project
  • Use mittwald_sftp_user_create to add a new SFTP user with specific permissions
  • Use mittwald_sftp_user_update to modify existing user settings
  • Use mittwald_sftp_user_delete to remove an SFTP user

For detailed help on any command, refer to the specific tool documentation.`;

    return {
      content: [
        {
          type: "text",
          text: helpText
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error showing SFTP user help: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}