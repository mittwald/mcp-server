import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { MittwaldAPIV2 } from '@mittwald/api-client';
import { Simplify } from '@mittwald/api-client-commons';

type ResponseItem = Simplify<
  MittwaldAPIV2.Paths.V2ExtensionInstances.Get.Responses.$200.Content.ApplicationJson[number]
>;

type Extension = MittwaldAPIV2.Components.Schemas.MarketplaceExtension;

interface MittwaldExtensionListInstalledArgs {
  projectId?: string;
  orgId?: string;
}

interface ExtendedResponseItem {
  id: string;
  extensionId: string;
  extension: Extension;
  state: 'installing' | 'removing' | 'disabled' | 'enabled';
  disabled?: boolean;
  consentedScopes?: string[];
}

export const handleExtensionListInstalled: MittwaldToolHandler<MittwaldExtensionListInstalledArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate that exactly one of projectId or orgId is provided
    if (!args.projectId && !args.orgId) {
      return formatToolResponse(
        "error",
        "Either projectId or orgId must be provided"
      );
    }

    if (args.projectId && args.orgId) {
      return formatToolResponse(
        "error",
        "Only one of projectId or orgId can be provided"
      );
    }

    // List extension instances
    const response = await mittwaldClient.marketplace.extensionListExtensionInstances({
      queryParameters: {
        context: args.orgId ? 'customer' : 'project',
        contextId: (args.orgId || args.projectId)!,
      },
    });

    const data = response.data as ResponseItem[];
    
    if (!data || data.length === 0) {
      return formatToolResponse(
        "success",
        "No installed extensions found",
        []
      );
    }

    // Fetch extension details for each instance
    const extendedItems: ExtendedResponseItem[] = await Promise.all(
      data.map(async (item) => {
        const extResponse = await mittwaldClient.marketplace.extensionGetExtension({
          extensionId: item.extensionId,
        });

        if (extResponse.status !== 200 || !extResponse.data) {
          throw new Error(`Failed to fetch extension details for ${item.extensionId}`);
        }

        const extension = extResponse.data as Extension;

        // Calculate state based on the item properties
        let state: ExtendedResponseItem['state'] = 'enabled';
        
        // Check for pending states (these might be in additional properties)
        const itemAny = item as any;
        if (itemAny.pendingInstallation) {
          state = 'installing';
        } else if (itemAny.pendingRemoval) {
          state = 'removing';
        } else if (item.disabled) {
          state = 'disabled';
        }

        return {
          id: item.id,
          extensionId: item.extensionId,
          extension,
          state,
          disabled: item.disabled,
          consentedScopes: item.consentedScopes,
        };
      })
    );

    // Format the response data
    const formattedData = extendedItems.map(item => ({
      id: item.id,
      extensionId: item.extensionId,
      extensionName: item.extension.name,
      state: item.state,
      context: args.orgId ? 'organization' : 'project',
      contextId: args.orgId || args.projectId,
      disabled: item.disabled,
      consentedScopes: item.consentedScopes,
    }));

    return formatToolResponse(
      "success",
      `Found ${extendedItems.length} installed extension(s)`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list installed extensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};