import { 
  mittwald_app_list_versionsSuccessMessage,
  mittwald_app_get_versionSuccessMessage,
  mittwald_app_get_version_update_candidatesSuccessMessage
} from '../../../../constants/tool/mittwald/app/app-versions.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type { AppVersion } from '../../../../types/mittwald/app.js';

export interface MittwaldAppListVersionsArgs {
  appId: string;
  recommended?: boolean;
}

export interface MittwaldAppGetVersionArgs {
  appId: string;
  appVersionId: string;
}

export interface MittwaldAppGetVersionUpdateCandidatesArgs {
  appId: string;
  baseAppVersionId: string;
}

export const handleMittwaldAppListVersions: ToolHandler<MittwaldAppListVersionsArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appId) {
      throw new Error("App ID is required");
    }

    // Call the Mittwald API to list app versions
    const response = await mittwaldClient.api.app.listAppversions({
      appId: args.appId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list app versions: ${response.status}`);
    }

    let versions: AppVersion[] = Array.isArray(response.data) ? response.data : [];

    // Filter by recommended if requested
    if (args.recommended) {
      versions = versions.filter(v => v.recommended === true);
    }

    return formatToolResponse({
      message: mittwald_app_list_versionsSuccessMessage,
      result: {
        appId: args.appId,
        versions,
        totalCount: versions.length
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list app versions: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppGetVersion: ToolHandler<MittwaldAppGetVersionArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appId || !args.appVersionId) {
      throw new Error("App ID and App Version ID are required");
    }

    // Call the Mittwald API to get app version details
    const response = await mittwaldClient.api.app.getAppversion({
      appId: args.appId,
      appVersionId: args.appVersionId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get app version details: ${response.status}`);
    }

    const version: AppVersion = response.data as AppVersion;

    return formatToolResponse({
      message: mittwald_app_get_versionSuccessMessage,
      result: {
        version
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get app version details: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppGetVersionUpdateCandidates: ToolHandler<MittwaldAppGetVersionUpdateCandidatesArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appId || !args.baseAppVersionId) {
      throw new Error("App ID and Base App Version ID are required");
    }

    // Call the Mittwald API to get update candidates
    const response = await mittwaldClient.api.app.listUpdateCandidatesForAppversion({
      appId: args.appId,
      baseAppVersionId: args.baseAppVersionId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get update candidates: ${response.status}`);
    }

    const candidates: AppVersion[] = Array.isArray(response.data) ? response.data : [];

    return formatToolResponse({
      message: mittwald_app_get_version_update_candidatesSuccessMessage,
      result: {
        baseAppVersionId: args.baseAppVersionId,
        updateCandidates: candidates,
        totalCount: candidates.length
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get update candidates: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};