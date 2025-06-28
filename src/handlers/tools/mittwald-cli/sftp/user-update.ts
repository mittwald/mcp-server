import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sftpUserUpdateSchema = z.object({
  sftpUserId: z.string(),
  quiet: z.boolean().default(false),
  expires: z.string().optional(),
  description: z.string().optional(),
  publicKey: z.string().optional(),
  password: z.string().optional(),
  accessLevel: z.enum(["read", "full"]).optional(),
  directories: z.array(z.string()).optional(),
  enable: z.boolean().optional(),
  disable: z.boolean().optional()
}).refine(data => !(data.publicKey && data.password), {
  message: "Cannot specify both publicKey and password - choose one authentication method"
}).refine(data => !(data.enable && data.disable), {
  message: "Cannot specify both enable and disable - choose one"
});

export async function handleSftpUserUpdate(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { 
      sftpUserId, 
      quiet, 
      expires, 
      description, 
      publicKey, 
      password, 
      accessLevel, 
      directories, 
      enable, 
      disable 
    } = sftpUserUpdateSchema.parse(args);

    // Build the update payload
    const updateData: any = {};

    if (description !== undefined) {
      updateData.description = description;
    }

    if (accessLevel !== undefined) {
      updateData.accessLevel = accessLevel;
    }

    if (directories !== undefined) {
      updateData.directories = directories;
    }

    if (expires !== undefined) {
      updateData.expiresAt = expires; // The API might expect a specific format
    }

    if (publicKey !== undefined) {
      updateData.publicKey = publicKey;
      updateData.authMethod = "publicKey";
    }

    if (password !== undefined) {
      updateData.password = password;
      updateData.authMethod = "password";
    }

    if (enable !== undefined) {
      updateData.active = enable;
    } else if (disable !== undefined) {
      updateData.active = !disable;
    }

    // Update the SFTP user
    await apiClient.sshsftpUser.sftpUserUpdateSftpUser({
      sftpUserId,
      data: updateData
    });

    if (quiet) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "updated",
              sftpUserId,
              status: "success"
            })
          }
        ]
      };
    }

    let successMessage = `SFTP user ${sftpUserId} has been successfully updated.`;
    
    const updates = [];
    if (description !== undefined) updates.push(`description: "${description}"`);
    if (accessLevel !== undefined) updates.push(`access level: ${accessLevel}`);
    if (directories !== undefined) updates.push(`directories: [${directories.join(', ')}]`);
    if (expires !== undefined) updates.push(`expires: ${expires}`);
    if (publicKey !== undefined) updates.push(`authentication: public key`);
    if (password !== undefined) updates.push(`authentication: password`);
    if (enable !== undefined) updates.push(`status: enabled`);
    if (disable !== undefined) updates.push(`status: disabled`);

    if (updates.length > 0) {
      successMessage += `\n\nUpdated fields:\n- ${updates.join('\n- ')}`;
    }

    return {
      content: [
        {
          type: "text",
          text: successMessage
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating SFTP user: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}