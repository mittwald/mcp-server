import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sftpUserDeleteSchema = z.object({
  sftpUserId: z.string(),
  force: z.boolean().default(false),
  quiet: z.boolean().default(false)
});

export async function handleSftpUserDelete(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { sftpUserId, force, quiet } = sftpUserDeleteSchema.parse(args);

    if (!force && !quiet) {
      return {
        content: [
          {
            type: "text",
            text: "This operation will permanently delete the SFTP user. Use 'force: true' to confirm deletion."
          }
        ]
      };
    }

    // Delete the SFTP user
    await apiClient.sshsftpUser.sftpUserDeleteSftpUser({
      sftpUserId
    });

    if (quiet) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "deleted",
              sftpUserId,
              status: "success"
            })
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `SFTP user ${sftpUserId} has been successfully deleted.`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting SFTP user: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}