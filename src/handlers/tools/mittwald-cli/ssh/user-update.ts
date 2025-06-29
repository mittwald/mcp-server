import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldSshUserUpdateArgs {
  sshUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  enable?: boolean;
  disable?: boolean;
}

export const handleSshUserUpdate: MittwaldToolHandler<MittwaldSshUserUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate mutually exclusive options
    if (args.enable && args.disable) {
      return formatToolResponse(
        "error",
        "Cannot specify both --enable and --disable flags"
      );
    }

    if (args.publicKey && args.password) {
      return formatToolResponse(
        "error",
        "Cannot specify both --public-key and --password (they are mutually exclusive)"
      );
    }

    // Prepare update payload
    const updateData: any = {};

    if (args.description !== undefined) {
      updateData.description = args.description;
    }

    if (args.expires !== undefined) {
      updateData.expiresAt = args.expires;
    }

    if (args.publicKey !== undefined) {
      updateData.publicKey = args.publicKey;
      updateData.authenticationMethod = 'publicKey';
    }

    if (args.password !== undefined) {
      updateData.password = args.password;
      updateData.authenticationMethod = 'password';
    }

    if (args.enable !== undefined) {
      updateData.active = args.enable;
    }

    if (args.disable !== undefined) {
      updateData.active = !args.disable;
    }

    // Update SSH user via API
    const result = await mittwaldClient.api.sshsftpUser.sshUserUpdateSshUser({
      sshUserId: args.sshUserId,
      data: updateData
    });

    if (args.quiet) {
      return formatToolResponse(
        "success",
        args.sshUserId,
        { sshUserId: args.sshUserId }
      );
    }

    return formatToolResponse(
      "success",
      `SSH user ${args.sshUserId} updated successfully`,
      {
        sshUserId: args.sshUserId,
        updatedFields: Object.keys(updateData),
        result: result.data
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to update SSH user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};