import { 
  mittwald_app_listSuccessMessage, 
  mittwald_app_getSuccessMessage 
} from '../../../../constants/tool/mittwald/app/app-management.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type { App } from '../../../../types/mittwald/app.js';

export interface MittwaldAppListArgs {
  limit?: number;
  skip?: number;
}

export interface MittwaldAppGetArgs {
  appId: string;
}

export const handleMittwaldAppList: ToolHandler<MittwaldAppListArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    const { limit = 100, skip = 0 } = args;

    // Call the Mittwald API to list apps
    const response = await mittwaldClient.api.app.listApps({
      queryParameters: {
        limit,
        skip
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list apps: ${response.status}`);
    }

    const apps: App[] = Array.isArray(response.data) ? response.data : [];

    return formatToolResponse({
      message: mittwald_app_listSuccessMessage,
      result: {
        apps,
        pagination: {
          limit,
          skip,
          total: apps.length
        }
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list apps: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppGet: ToolHandler<MittwaldAppGetArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appId) {
      throw new Error("App ID is required");
    }

    // Call the Mittwald API to get app details
    const response = await mittwaldClient.api.app.getApp({
      appId: args.appId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get app details: ${response.status}`);
    }

    const app: App = response.data as App;

    return formatToolResponse({
      message: mittwald_app_getSuccessMessage,
      result: {
        app
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error", 
      message: `Failed to get app details: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};