import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ("api_read" | "api_write")[];
  quiet?: boolean;
  expires?: string;
}

export const handleUserApiTokenCreate: MittwaldToolHandler<MittwaldUserApiTokenCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Prepare the create data
    const createData: any = {
      description: args.description,
      roles: args.roles
    };

    if (args.expires) {
      createData.expiresAt = args.expires;
    }

    // Create API token via API
    const result = await mittwaldClient.api.user.createApiToken({
      data: createData
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        "Failed to create API token - no data returned"
      );
    }

    const tokenData = result.data;

    if (args.quiet) {
      return formatToolResponse(
        "success",
        tokenData.id || "API token created",
        { 
          tokenId: tokenData.id,
          token: tokenData.token // This might be the actual token value
        }
      );
    }

    return formatToolResponse(
      "success",
      `API token created successfully`,
      {
        tokenId: tokenData.id,
        description: args.description,
        roles: args.roles,
        expires: args.expires,
        token: tokenData.token, // The actual token value for immediate use
        createdAt: tokenData.createdAt,
        result: tokenData
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};