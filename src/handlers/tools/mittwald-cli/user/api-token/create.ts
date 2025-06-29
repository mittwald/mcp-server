import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

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
    const result = await mittwaldClient.user.createApiToken({
      data: createData
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        "Failed to create API token - no data returned"
      );
    }

    const tokenData = result.data;
    const token = (tokenData as any).token;

    if (!token) {
      return formatToolResponse(
        "error",
        "Failed to create API token - no token returned"
      );
    }

    if (args.quiet) {
      return formatToolResponse(
        "success",
        token,
        { 
          token: token
        }
      );
    }

    return formatToolResponse(
      "success",
      `API token created successfully`,
      {
        token: token,
        description: args.description,
        roles: args.roles,
        expires: args.expires
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};