import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../types.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { getMittwaldClient } from "../../../../services/mittwald/index.js";
import { 
  MITTWALD_EXTENSION_LIST_SUCCESS,
  MITTWALD_EXTENSION_GET_SUCCESS,
  MITTWALD_EXTENSION_CREATE_SUCCESS,
  MITTWALD_EXTENSION_UPDATE_SUCCESS,
  MITTWALD_EXTENSION_DELETE_SUCCESS,
  MITTWALD_EXTENSION_PUBLISH_SUCCESS,
  MITTWALD_EXTENSION_UPDATE_CONTEXT_SUCCESS,
  MITTWALD_EXTENSION_UPLOAD_LOGO_SUCCESS,
  MITTWALD_EXTENSION_DELETE_LOGO_SUCCESS,
  MITTWALD_EXTENSION_UPLOAD_ASSET_SUCCESS,
  MITTWALD_EXTENSION_DELETE_ASSET_SUCCESS,
  MITTWALD_EXTENSION_CREATE_SECRET_SUCCESS,
  MITTWALD_EXTENSION_DELETE_SECRET_SUCCESS,
  MITTWALD_EXTENSION_REQUEST_VERIFICATION_SUCCESS
} from "../../../../constants/tool/mittwald/marketplace/extension-management.js";
import type { 
  ExtensionListResponse,
  Extension,
  CreateExtensionRequest,
  UpdateExtensionRequest,
  UpdateExtensionContextRequest,
  Context,
  ExtensionAsset,
  ExtensionSecret
} from "../../../../types/mittwald/marketplace.js";

/**
 * Handler for listing extensions
 */
export const handleMittwaldExtensionList: ToolHandler<{
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

    const response = await client.api.marketplace.listExtensions({
      queryParameters: {
        limit,
        skip: offset
      }
    });

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to list extensions: ${response.status}`
      );
    }

    return formatToolResponse<ExtensionListResponse>(
      "success",
      MITTWALD_EXTENSION_LIST_SUCCESS,
      {
        extensions: response.data,
        totalCount: response.data.length
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error listing extensions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting extension details
 */
export const handleMittwaldExtensionGet: ToolHandler<{
  extensionId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionId } = args;

    const response = await client.api.marketplace.getExtension({
      extensionId
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get extension: ${response.status}`
      );
    }

    return formatToolResponse<Extension>(
      "success",
      MITTWALD_EXTENSION_GET_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for creating an extension
 */
export const handleMittwaldExtensionCreate: ToolHandler<{
  contributorId: string;
  name: string;
  shortDescription: Record<string, string>;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, name, shortDescription } = args;

    const response = await client.api.marketplace.createExtension({
      contributorId,
      data: {
        name,
        shortDescription
      }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to create extensions for this contributor"
      );
    }

    if (response.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to create extension: ${response.status}`
      );
    }

    return formatToolResponse<{ extensionId: string }>(
      "success",
      MITTWALD_EXTENSION_CREATE_SUCCESS,
      { extensionId: response.data.id }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for updating an extension
 */
export const handleMittwaldExtensionUpdate: ToolHandler<UpdateExtensionRequest & {
  contributorId: string;
  extensionId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, ...updateData } = args;

    const response = await client.api.marketplace.updateExtension({
      contributorId,
      extensionId,
      data: updateData
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to update this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to update extension: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_UPDATE_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error updating extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for deleting an extension
 */
export const handleMittwaldExtensionDelete: ToolHandler<{
  contributorId: string;
  extensionId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId } = args;

    const response = await client.api.marketplace.deleteExtension({
      contributorId,
      extensionId
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to delete this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status === 409) {
      return formatToolResponse(
        "error",
        "Cannot delete extension with active installations"
      );
    }

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to delete extension: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_DELETE_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error deleting extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for publishing/unpublishing an extension
 */
export const handleMittwaldExtensionPublish: ToolHandler<{
  contributorId: string;
  extensionId: string;
  published: boolean;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, published } = args;

    const response = await client.api.marketplace.updateExtensionPublished({
      contributorId,
      extensionId,
      data: { published }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to update this extension's publication status"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to update publication status: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_PUBLISH_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error updating publication status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for updating extension context
 */
export const handleMittwaldExtensionUpdateContext: ToolHandler<{
  contributorId: string;
  extensionId: string;
  context: Context;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, context: extensionContext } = args;

    const response = await client.api.marketplace.updateExtensionContext({
      contributorId,
      extensionId,
      data: { context: extensionContext }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to update this extension's context"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to update context: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_UPDATE_CONTEXT_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error updating context: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for uploading extension logo
 */
export const handleMittwaldExtensionUploadLogo: ToolHandler<{
  contributorId: string;
  extensionId: string;
  logoBase64: string;
  contentType: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, logoBase64, contentType } = args;

    // Convert base64 to Buffer
    const logoBuffer = Buffer.from(logoBase64, 'base64');

    const response = await client.api.marketplace.uploadExtensionLogo({
      contributorId,
      extensionId,
      data: logoBuffer,
      headers: {
        'Content-Type': contentType
      }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to upload logo for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to upload logo: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_UPLOAD_LOGO_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error uploading logo: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for deleting extension logo
 */
export const handleMittwaldExtensionDeleteLogo: ToolHandler<{
  contributorId: string;
  extensionId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId } = args;

    const response = await client.api.marketplace.deleteExtensionLogo({
      contributorId,
      extensionId
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to delete logo for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to delete logo: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_DELETE_LOGO_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error deleting logo: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for uploading extension asset
 */
export const handleMittwaldExtensionUploadAsset: ToolHandler<{
  contributorId: string;
  extensionId: string;
  filename: string;
  contentBase64: string;
  contentType: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, filename, contentBase64, contentType } = args;

    // Convert base64 to Buffer
    const contentBuffer = Buffer.from(contentBase64, 'base64');

    const response = await client.api.marketplace.uploadExtensionAsset({
      contributorId,
      extensionId,
      data: {
        filename,
        content: contentBuffer,
        contentType
      }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to upload assets for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to upload asset: ${response.status}`
      );
    }

    return formatToolResponse<{ assetId: string }>(
      "success",
      MITTWALD_EXTENSION_UPLOAD_ASSET_SUCCESS,
      { assetId: response.data.id }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error uploading asset: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for deleting extension asset
 */
export const handleMittwaldExtensionDeleteAsset: ToolHandler<{
  contributorId: string;
  extensionId: string;
  assetRefId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, assetRefId } = args;

    const response = await client.api.marketplace.deleteExtensionAsset({
      contributorId,
      extensionId,
      assetRefId
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to delete assets for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Asset with ID ${assetRefId} not found`
      );
    }

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to delete asset: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_DELETE_ASSET_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error deleting asset: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for creating extension secret
 */
export const handleMittwaldExtensionCreateSecret: ToolHandler<{
  contributorId: string;
  extensionId: string;
  name: string;
  value: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, name, value } = args;

    const response = await client.api.marketplace.createExtensionSecret({
      contributorId,
      extensionId,
      data: { name, value }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to create secrets for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to create secret: ${response.status}`
      );
    }

    return formatToolResponse<{ secretId: string }>(
      "success",
      MITTWALD_EXTENSION_CREATE_SECRET_SUCCESS,
      { secretId: response.data.id }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating secret: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for deleting extension secret
 */
export const handleMittwaldExtensionDeleteSecret: ToolHandler<{
  contributorId: string;
  extensionId: string;
  extensionSecretId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, extensionSecretId } = args;

    const response = await client.api.marketplace.deleteExtensionSecret({
      contributorId,
      extensionId,
      extensionSecretId
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to delete secrets for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Secret with ID ${extensionSecretId} not found`
      );
    }

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to delete secret: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_DELETE_SECRET_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error deleting secret: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for requesting extension verification
 */
export const handleMittwaldExtensionRequestVerification: ToolHandler<{
  contributorId: string;
  extensionId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId } = args;

    const response = await client.api.marketplace.requestExtensionVerification({
      contributorId,
      extensionId
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to request verification for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to request verification: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_REQUEST_VERIFICATION_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error requesting verification: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};