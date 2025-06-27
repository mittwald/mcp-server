import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolHandler } from "../../types.js";
import { formatToolResponse } from "../../../../utils/format-tool-response.js";
import { getMittwaldClient } from "../../../../services/mittwald/index.js";
import { 
  MITTWALD_MARKETPLACE_LIST_SCOPES_SUCCESS,
  MITTWALD_MARKETPLACE_GET_PUBLIC_KEY_SUCCESS,
  MITTWALD_MARKETPLACE_GET_WEBHOOK_PUBLIC_KEY_SUCCESS,
  MITTWALD_MARKETPLACE_GET_CUSTOMER_EXTENSION_SUCCESS,
  MITTWALD_MARKETPLACE_GET_PROJECT_EXTENSION_SUCCESS,
  MITTWALD_MARKETPLACE_DRY_RUN_WEBHOOK_SUCCESS
} from "../../../../constants/tool/mittwald/marketplace/marketplace-utilities.js";
import type { 
  ScopeListResponse,
  PublicKey,
  Extension,
  DryRunWebhookResponse,
  WebhookKind
} from "../../../../types/mittwald/marketplace.js";

/**
 * Handler for listing available scopes
 */
export const handleMittwaldMarketplaceListScopes: ToolHandler<{}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);

    const response = await client.marketplace.extensionListScopes({});

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to list scopes: ${response.status}`
      );
    }

    return formatToolResponse<ScopeListResponse>(
      "success",
      MITTWALD_MARKETPLACE_LIST_SCOPES_SUCCESS,
      {
        scopes: response.data
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error listing scopes: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting public key
 */
export const handleMittwaldMarketplaceGetPublicKey: ToolHandler<{
  serial: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { serial } = args;

    const response = await client.marketplace.extensionGetPublicKey({
      serial
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Public key with serial ${serial} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to get public key: ${response.status}`
      );
    }

    return formatToolResponse<PublicKey>(
      "success",
      MITTWALD_MARKETPLACE_GET_PUBLIC_KEY_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting public key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting webhook public key
 */
export const handleMittwaldMarketplaceGetWebhookPublicKey: ToolHandler<{
  serial: string;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { serial } = args;

    const response = await client.marketplace.extensionGetPublicKey({
      serial
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Webhook public key with serial ${serial} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to get webhook public key: ${response.status}`
      );
    }

    return formatToolResponse<PublicKey>(
      "success",
      MITTWALD_MARKETPLACE_GET_WEBHOOK_PUBLIC_KEY_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting webhook public key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting customer extension
 */
export const handleMittwaldMarketplaceGetCustomerExtension: ToolHandler<{
  customerId: string;
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
    const { customerId, extensionId } = args;

    const response = await client.marketplace.extensionGetExtensionInstanceForCustomer({
      customerId,
      extensionId
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension ${extensionId} not found for customer ${customerId}`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to get customer extension: ${response.status}`
      );
    }

    return formatToolResponse<Extension>(
      "success",
      MITTWALD_MARKETPLACE_GET_CUSTOMER_EXTENSION_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting customer extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for getting project extension
 */
export const handleMittwaldMarketplaceGetProjectExtension: ToolHandler<{
  projectId: string;
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
    const { projectId, extensionId } = args;

    const response = await client.marketplace.extensionGetExtensionInstanceForProject({
      projectId,
      extensionId
    });

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension ${extensionId} not found for project ${projectId}`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to get project extension: ${response.status}`
      );
    }

    return formatToolResponse<Extension>(
      "success",
      MITTWALD_MARKETPLACE_GET_PROJECT_EXTENSION_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error getting project extension: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Handler for dry run webhook test
 */
export const handleMittwaldMarketplaceDryRunWebhook: ToolHandler<{
  contributorId: string;
  extensionId: string;
  extensionInstanceId: string;
  webhookKind: WebhookKind;
}> = async (args, context) => {
  try {
    if (!context.authInfo?.mittwald?.apiToken) {
      return formatToolResponse(
        "error",
        "Mittwald API token is required for this operation"
      );
    }

    const client = getMittwaldClient(context.authInfo.mittwald.apiToken);
    const { contributorId, extensionId, extensionInstanceId, webhookKind } = args;

    const response = await client.marketplace.extensionDryRunWebhook({
      contributorId,
      extensionId,
      extensionInstanceId,
      webhookKind
    });

    if (response.status === 403) {
      return formatToolResponse(
        "error",
        "You don't have permission to test webhooks for this extension"
      );
    }

    if (response.status === 404) {
      return formatToolResponse(
        "error",
        `Extension instance ${extensionInstanceId} not found`
      );
    }

    if (!String(response.status).startsWith('2')) {
      return formatToolResponse(
        "error",
        `Failed to run webhook test: ${response.status}`
      );
    }

    return formatToolResponse<DryRunWebhookResponse>(
      "success",
      MITTWALD_MARKETPLACE_DRY_RUN_WEBHOOK_SUCCESS,
      response.data
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error running webhook test: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};