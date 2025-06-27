import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../types.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { getMittwaldClient } from "../../../../services/mittwald/index.js";
import { 
  MITTWALD_CONTRIBUTOR_LIST_SUCCESS,
  MITTWALD_CONTRIBUTOR_GET_SUCCESS,
  MITTWALD_CONTRIBUTOR_GET_EXTENSIONS_SUCCESS
} from "../../../../constants/tool/mittwald/marketplace/contributor-management.js";
import type { 
  ContributorListResponse,
  Contributor,
  ExtensionListResponse 
} from "../../../../types/mittwald/marketplace.js";

/**
 * Handler for listing marketplace contributors
 */
export const handleMittwaldContributorList: ToolHandler<{
  limit?: number;
  offset?: number;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { limit = 50, offset = 0 } = args;

    // Call the API using the client
    const response = await client.api.marketplace.listContributors({
      queryParameters: {
        limit,
        skip: offset
      }
    });

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to list contributors: ${response.status}`
      );
    }

    return formatToolResponse<ContributorListResponse>(
      "success",
      MITTWALD_CONTRIBUTOR_LIST_SUCCESS,
      {
        contributors: response.data,
        totalCount: response.data.length
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error listing contributors: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting contributor details
 */
export const handleMittwaldContributorGet: ToolHandler<{
  contributorId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId } = args;

    // Call the API using the client
    const response = await client.api.marketplace.getContributor({
      contributorId
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Contributor with ID ${contributorId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get contributor: ${response.status}`
      );
    }

    return formatToolResponse<Contributor>(
      "success",
      MITTWALD_CONTRIBUTOR_GET_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting contributor: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting contributor's extensions
 */
export const handleMittwaldContributorGetExtensions: ToolHandler<{
  contributorId: string;
  limit?: number;
  offset?: number;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, limit = 50, offset = 0 } = args;

    // Call the API using the client
    const response = await client.api.marketplace.listExtensionsFromContributor({
      contributorId,
      queryParameters: {
        limit,
        skip: offset
      }
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Contributor with ID ${contributorId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get contributor extensions: ${response.status}`
      );
    }

    return formatToolResponse<ExtensionListResponse>(
      "success",
      MITTWALD_CONTRIBUTOR_GET_EXTENSIONS_SUCCESS,
      {
        extensions: response.data,
        totalCount: response.data.length
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting contributor extensions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};