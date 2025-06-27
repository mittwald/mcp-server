import { 
  mittwald_system_software_listSuccessMessage,
  mittwald_system_software_getSuccessMessage,
  mittwald_system_software_list_versionsSuccessMessage,
  mittwald_system_software_get_versionSuccessMessage,
  mittwald_app_installation_get_system_softwareSuccessMessage
} from '../../../../constants/tool/mittwald/app/system-software.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type { 
  SystemSoftware, 
  SystemSoftwareVersion,
  SystemSoftwareUpdatePolicy 
} from '../../../../types/mittwald/app.js';

export interface MittwaldSystemSoftwareListArgs {
  limit?: number;
  skip?: number;
}

export interface MittwaldSystemSoftwareGetArgs {
  systemSoftwareId: string;
}

export interface MittwaldSystemSoftwareListVersionsArgs {
  systemSoftwareId: string;
  recommended?: boolean;
}

export interface MittwaldSystemSoftwareGetVersionArgs {
  systemSoftwareId: string;
  systemSoftwareVersionId: string;
}

export interface MittwaldAppInstallationGetSystemSoftwareArgs {
  appInstallationId: string;
}

export interface MittwaldAppInstallationUpdateSystemSoftwareArgs {
  appInstallationId: string;
  systemSoftware: {
    systemSoftwareId: string;
    systemSoftwareVersionId: string;
    updatePolicy: SystemSoftwareUpdatePolicy;
  }[];
}

export const handleMittwaldSystemSoftwareList: ToolHandler<MittwaldSystemSoftwareListArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    const { limit = 100, skip = 0 } = args;

    // Call the Mittwald API to list system software
    const response = await mittwaldClient.api.app.listSystemsoftwares({
      queryParameters: {
        limit,
        skip
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list system software: ${response.status}`);
    }

    const systemSoftware: SystemSoftware[] = response.data || [];

    return formatToolResponse({
      message: mittwald_system_software_listSuccessMessage,
      result: {
        systemSoftware,
        pagination: {
          limit,
          skip,
          total: systemSoftware.length
        }
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list system software: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldSystemSoftwareGet: ToolHandler<MittwaldSystemSoftwareGetArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.systemSoftwareId) {
      throw new Error("System Software ID is required");
    }

    // Call the Mittwald API to get system software details
    const response = await mittwaldClient.api.app.getSystemsoftware({
      systemSoftwareId: args.systemSoftwareId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get system software details: ${response.status}`);
    }

    const systemSoftware: SystemSoftware = response.data;

    return formatToolResponse({
      message: mittwald_system_software_getSuccessMessage,
      result: {
        systemSoftware
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get system software details: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldSystemSoftwareListVersions: ToolHandler<MittwaldSystemSoftwareListVersionsArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.systemSoftwareId) {
      throw new Error("System Software ID is required");
    }

    // Call the Mittwald API to list system software versions
    const response = await mittwaldClient.api.app.listSystemsoftwareversions({
      systemSoftwareId: args.systemSoftwareId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list system software versions: ${response.status}`);
    }

    let versions: SystemSoftwareVersion[] = response.data || [];

    // Filter by recommended if requested
    if (args.recommended) {
      versions = versions.filter(v => v.recommended === true);
    }

    return formatToolResponse({
      message: mittwald_system_software_list_versionsSuccessMessage,
      result: {
        systemSoftwareId: args.systemSoftwareId,
        versions,
        totalCount: versions.length
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list system software versions: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldSystemSoftwareGetVersion: ToolHandler<MittwaldSystemSoftwareGetVersionArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.systemSoftwareId || !args.systemSoftwareVersionId) {
      throw new Error("System Software ID and Version ID are required");
    }

    // Call the Mittwald API to get system software version details
    const response = await mittwaldClient.api.app.getSystemsoftwareversion({
      systemSoftwareId: args.systemSoftwareId,
      systemSoftwareVersionId: args.systemSoftwareVersionId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get system software version details: ${response.status}`);
    }

    const version: SystemSoftwareVersion = response.data;

    return formatToolResponse({
      message: mittwald_system_software_get_versionSuccessMessage,
      result: {
        version
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get system software version details: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationGetSystemSoftware: ToolHandler<MittwaldAppInstallationGetSystemSoftwareArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    // Call the Mittwald API to get app installation system software
    const response = await mittwaldClient.api.app.getInstalledSystemsoftwareForAppinstallation({
      appInstallationId: args.appInstallationId
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get app installation system software: ${response.status}`);
    }

    const systemSoftware: any[] = response.data || [];  // API returns different type than expected

    return formatToolResponse({
      message: mittwald_app_installation_get_system_softwareSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        systemSoftware,
        count: systemSoftware.length
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get app installation system software: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationUpdateSystemSoftware: ToolHandler<MittwaldAppInstallationUpdateSystemSoftwareArgs> = async (_args, _context) => {
  try {
    // This functionality is not available in the current Mittwald API
    return formatToolResponse({
      status: "error",
      message: "System software update functionality is not available in the current API version",
      error: {
        type: "NOT_IMPLEMENTED",
        details: "The Mittwald API does not currently provide a method to update system software for app installations"
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update app installation system software: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};