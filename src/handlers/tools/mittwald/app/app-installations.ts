import { 
  mittwald_app_installation_listSuccessMessage,
  mittwald_app_installation_getSuccessMessage,
  mittwald_app_installation_createSuccessMessage,
  mittwald_app_installation_updateSuccessMessage,
  mittwald_app_installation_deleteSuccessMessage
} from '../../../../constants/tool/mittwald/app/app-installations.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type { 
  AppInstallation, 
  UpdateAppInstallationRequest,
  SavedUserInput 
} from '../../../../types/mittwald/app.js';

export interface MittwaldAppInstallationListArgs {
  projectId: string;
  limit?: number;
  skip?: number;
}

export interface MittwaldAppInstallationGetArgs {
  appInstallationId: string;
}

export interface MittwaldAppInstallationCreateArgs {
  appId: string;
  projectId: string;
  description: string;
  appVersionId?: string;
  updatePolicy?: 'none' | 'patchLevel' | 'all';
  userInputs?: SavedUserInput[];
}

export interface MittwaldAppInstallationUpdateArgs {
  appInstallationId: string;
  description?: string;
  appVersionId?: string;
  updatePolicy?: 'none' | 'patchLevel' | 'all';
  customDocumentRoot?: string;
  userInputs?: SavedUserInput[];
}

export interface MittwaldAppInstallationDeleteArgs {
  appInstallationId: string;
}

export const handleMittwaldAppInstallationList: ToolHandler<MittwaldAppInstallationListArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.projectId) {
      throw new Error("Project ID is required");
    }

    const { limit = 100, skip = 0 } = args;

    // Call the Mittwald API to list app installations
    const response = await mittwaldClient.api.app.listAppinstallations({
      projectId: args.projectId,
      queryParameters: {
        limit,
        skip
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to list app installations: ${response.status}`);
    }

    const installations: AppInstallation[] = Array.isArray(response.data) ? response.data : [];

    return formatToolResponse({
      message: mittwald_app_installation_listSuccessMessage,
      result: {
        projectId: args.projectId,
        installations,
        pagination: {
          limit,
          skip,
          total: installations.length
        }
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list app installations: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationGet: ToolHandler<MittwaldAppInstallationGetArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    // Call the Mittwald API to get app installation details
    const response = await mittwaldClient.api.app.getAppinstallation({
      appInstallationId: args.appInstallationId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get app installation details: ${response.status}`);
    }

    const installation: AppInstallation = response.data as AppInstallation;

    return formatToolResponse({
      message: mittwald_app_installation_getSuccessMessage,
      result: {
        installation
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get app installation details: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationCreate: ToolHandler<MittwaldAppInstallationCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appId || !args.projectId || !args.description) {
      throw new Error("App ID, Project ID, and description are required");
    }

    const requestBody: any = {
      appId: args.appId,
      description: args.description,
      ...(args.appVersionId && { appVersionId: args.appVersionId }),
      ...(args.updatePolicy && { updatePolicy: args.updatePolicy }),
      ...(args.userInputs && { userInputs: args.userInputs })
    };

    // Call the Mittwald API to create app installation
    const response = await mittwaldClient.api.app.requestAppinstallation({
      projectId: args.projectId,
      data: requestBody
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to create app installation: ${response.status}`);
    }

    return formatToolResponse({
      message: mittwald_app_installation_createSuccessMessage,
      result: {
        appInstallationId: response.data?.id,
        ...args
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create app installation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationUpdate: ToolHandler<MittwaldAppInstallationUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    const requestBody: UpdateAppInstallationRequest = {};
    
    if (args.description !== undefined) requestBody.description = args.description;
    if (args.appVersionId !== undefined) requestBody.appVersionId = args.appVersionId;
    if (args.updatePolicy !== undefined) requestBody.updatePolicy = args.updatePolicy;
    if (args.customDocumentRoot !== undefined) requestBody.customDocumentRoot = args.customDocumentRoot;
    if (args.userInputs !== undefined) requestBody.userInputs = args.userInputs;

    // Call the Mittwald API to update app installation
    const response = await mittwaldClient.api.app.patchAppinstallation({
      appInstallationId: args.appInstallationId,
      data: requestBody
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to update app installation: ${response.status}`);
    }

    return formatToolResponse({
      message: mittwald_app_installation_updateSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        updatedFields: Object.keys(requestBody)
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update app installation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationDelete: ToolHandler<MittwaldAppInstallationDeleteArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    // Call the Mittwald API to delete app installation
    const response = await mittwaldClient.api.app.uninstallAppinstallation({
      appInstallationId: args.appInstallationId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to delete app installation: ${response.status}`);
    }

    return formatToolResponse({
      message: mittwald_app_installation_deleteSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        deleted: true
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete app installation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};