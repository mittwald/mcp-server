import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sshUserDeleteSchema = z.object({
  sshUserId: z.string(),
  force: z.boolean().default(false),
  quiet: z.boolean().default(false)
});

export async function handleSshUserDelete(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { sshUserId, force, quiet } = sshUserDeleteSchema.parse(args);

    if (!force && !quiet) {
      return {
        content: [
          {
            type: "text",
            text: "This operation will permanently delete the SSH user. Use 'force: true' to confirm deletion."
          }
        ]
      };
    }

    // Delete the SSH user
    await apiClient.sshsftpUser.sshUserDeleteSshUser({
      sshUserId
    });

    if (quiet) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "deleted",
              sshUserId,
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
          text: `SSH user ${sshUserId} has been successfully deleted.`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting SSH user: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}