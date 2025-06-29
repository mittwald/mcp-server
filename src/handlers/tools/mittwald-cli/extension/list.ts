import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { MittwaldAPIV2 } from '@mittwald/api-client';
import { Simplify } from '@mittwald/api-client-commons';

type ResponseItem = Simplify<
  MittwaldAPIV2.Paths.V2Extensions.Get.Responses.$200.Content.ApplicationJson[number]
>;

interface MittwaldExtensionListArgs {
  // No specific arguments needed for listing all extensions
}

export const handleExtensionList: MittwaldToolHandler<MittwaldExtensionListArgs> = async (args, { mittwaldClient }) => {
  try {
    // List all available extensions from the marketplace
    const response = await mittwaldClient.marketplace.extensionListExtensions();

    const data = response.data as ResponseItem[];
    
    if (!data || data.length === 0) {
      return formatToolResponse(
        "success",
        "No extensions available in the marketplace",
        []
      );
    }

    // Format the extension data
    const formattedData = data.map((ext: ResponseItem) => ({
      id: ext.id,
      name: ext.name,
      context: ext.context,
      subTitle: typeof ext.subTitle === 'object' ? (ext.subTitle as any).en || (ext.subTitle as any).de || '' : ext.subTitle || '',
      description: typeof ext.description === 'object' ? (ext.description as any).en || (ext.description as any).de || '' : ext.description || '',
      scopes: ext.scopes || [],
      tags: ext.tags || [],
    }));

    return formatToolResponse(
      "success",
      `Found ${data.length} available extension(s) in the marketplace`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list extensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};