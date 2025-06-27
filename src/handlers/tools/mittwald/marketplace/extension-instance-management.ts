import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../types.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { getMittwaldClient } from "../../../../services/mittwald/index.js";
import { 
  MITTWALD_EXTENSION_INSTANCE_LIST_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_GET_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_CREATE_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_DELETE_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_ENABLE_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_DISABLE_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_UPDATE_SCOPES_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_CREATE_RETRIEVAL_KEY_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_CREATE_TOKEN_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_UPDATE_SECRET_SUCCESS,
  MITTWALD_EXTENSION_INSTANCE_AUTHENTICATE_SESSION_SUCCESS
} from "../../../../constants/tool/mittwald/marketplace/extension-instance-management.js";
import type { 
  ExtensionInstanceListResponse,
  ExtensionInstance,
  CreateExtensionInstanceRequest,
  UpdateExtensionInstanceScopesRequest,
  CreateAccessTokenRetrievalKeyResponse,
  CreateExtensionInstanceTokenRequest,
  CreateExtensionInstanceTokenResponse,
  AuthenticateSessionTokenRequest,
  AuthenticateSessionTokenResponse
} from "../../../../types/mittwald/marketplace.js";

/**
 * Handler for listing extension instances
 */
export const handleMittwaldExtensionInstanceList: ToolHandler<{
  projectId?: string;
  customerId?: string;
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
    const { projectId, customerId, limit = 50, offset = 0 } = args;

    const queryParams: any = {
      limit,
      skip: offset
    };

    if (projectId) queryParams.projectId = projectId;
    if (customerId) queryParams.customerId = customerId;

    const response = await client.marketplace.extensionListExtensionInstances({
      queryParameters: queryParams
    } as any);

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to list extension instances: ${response.status}`
      );
    }

    return formatToolResponse<ExtensionInstanceListResponse>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_LIST_SUCCESS,
      {
        extensionInstances: response.data as any, // SDK returns MarketplaceExtensionInstance[]
        totalCount: response.data?.length || 0
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error listing extension instances: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting extension instance details
 */
export const handleMittwaldExtensionInstanceGet: ToolHandler<{
  extensionInstanceId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId } = args;

    const response = await client.marketplace.extensionGetExtensionInstance({
      extensionInstanceId: extensionInstanceId
    } as any);

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension instance with ID ${extensionInstanceId} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to get extension instance: ${response.status}`
      );
    }

    return formatToolResponse<ExtensionInstance>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_GET_SUCCESS,
      response.data as any // SDK returns MarketplaceExtensionInstance
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting extension instance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for creating an extension instance
 */
export const handleMittwaldExtensionInstanceCreate: ToolHandler<{
  extensionId: string;
  projectId?: string;
  customerId?: string;
  scopes?: string[];
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionId, projectId, customerId, scopes } = args;

    if (!projectId && !customerId) {
      return formatToolResponse(
        "error",
        "Either projectId or customerId must be provided"
      );
    }

    const requestData: any = {
      extensionId
    };

    if (projectId) requestData.projectId = projectId;
    if (customerId) requestData.customerId = customerId;
    if (scopes) requestData.scopes = scopes;

    const response = await client.marketplace.extensionCreateExtensionInstance({
      data: requestData
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to install extensions in this context"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension with ID ${extensionId} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to create extension instance: ${response.status}`
      );
    }

    return formatToolResponse<{ extensionInstanceId: string }>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_CREATE_SUCCESS,
      { extensionInstanceId: (response.data as any).id }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating extension instance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for deleting an extension instance
 */
export const handleMittwaldExtensionInstanceDelete: ToolHandler<{
  extensionInstanceId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId } = args;

    const response = await client.marketplace.extensionDeleteExtensionInstance({
      extensionInstanceId
    });

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to delete extension instance: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_INSTANCE_DELETE_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error deleting extension instance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for enabling an extension instance
 */
export const handleMittwaldExtensionInstanceEnable: ToolHandler<{
  extensionInstanceId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId } = args;

    const response = await client.marketplace.extensionEnableExtensionInstance({
      extensionInstanceId
    });

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to enable extension instance: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_INSTANCE_ENABLE_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error enabling extension instance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for disabling an extension instance
 */
export const handleMittwaldExtensionInstanceDisable: ToolHandler<{
  extensionInstanceId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId } = args;

    const response = await client.marketplace.extensionDisableExtensionInstance({
      extensionInstanceId
    });

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to disable extension instance: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_INSTANCE_DISABLE_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error disabling extension instance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for updating extension instance scopes
 */
export const handleMittwaldExtensionInstanceUpdateScopes: ToolHandler<{
  extensionInstanceId: string;
  scopes: string[];
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId, scopes } = args;

    const response = await client.marketplace.extensionConsentToExtensionScopes({
      extensionInstanceId,
      data: { consentedScopes: scopes }
    });

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to update scopes: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_INSTANCE_UPDATE_SCOPES_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error updating scopes: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for creating access token retrieval key
 */
export const handleMittwaldExtensionInstanceCreateRetrievalKey: ToolHandler<{
  extensionInstanceId: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId } = args;

    const response = await client.marketplace.extensionCreateRetrievalKey({
      extensionInstanceId
    });

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to create retrieval key: ${response.status}`
      );
    }

    return formatToolResponse<CreateAccessTokenRetrievalKeyResponse>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_CREATE_RETRIEVAL_KEY_SUCCESS,
      response.data as any
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating retrieval key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for creating extension instance token
 */
export const handleMittwaldExtensionInstanceCreateToken: ToolHandler<{
  extensionInstanceId: string;
  description?: string;
  expiresAt?: string;
  scopes?: string[];
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId, description, expiresAt, scopes } = args;

    const requestData: any = {};
    if (description) requestData.description = description;
    if (expiresAt) requestData.expiresAt = expiresAt;
    if (scopes) requestData.scopes = scopes;

    const response = await client.marketplace.extensionGenerateSessionToken({
      extensionInstanceId,
      data: requestData
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to create tokens for this extension instance"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension instance with ID ${extensionInstanceId} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to create token: ${response.status}`
      );
    }

    return formatToolResponse<CreateExtensionInstanceTokenResponse>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_CREATE_TOKEN_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating token: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for updating extension instance secret
 */
export const handleMittwaldExtensionInstanceUpdateSecret: ToolHandler<{
  contributorId: string;
  extensionId: string;
  extensionInstanceId: string;
  secretName: string;
  secretValue: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, extensionInstanceId, secretName, secretValue } = args;

    const response = await client.marketplace.contributorRotateSecretForExtensionInstance({
      contributorId,
      extensionId,
      extensionInstanceId,
      data: {
        name: secretName,
        value: secretValue
      }
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to update secrets for this extension instance"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension instance with ID ${extensionInstanceId} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to update secret: ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      MITTWALD_EXTENSION_INSTANCE_UPDATE_SECRET_SUCCESS
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error updating secret: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for authenticating session token
 */
export const handleMittwaldExtensionInstanceAuthenticateSession: ToolHandler<{
  extensionInstanceId: string;
  sessionId: string;
  sessionToken: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { extensionInstanceId, sessionId, sessionToken } = args;

    const response = await client.marketplace.extensionAuthenticateInstance({
      extensionInstanceId,
      sessionId,
      data: { sessionToken }
    });

    if (response.status === 401) {
      return formatToolResponse(
        "error",
        "Invalid session token"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension instance or session not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to authenticate session: ${response.status}`
      );
    }

    return formatToolResponse<AuthenticateSessionTokenResponse>(
      "success",
      MITTWALD_EXTENSION_INSTANCE_AUTHENTICATE_SESSION_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error authenticating session: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};