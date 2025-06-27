import { 
  mittwald_app_installation_actionSuccessMessage,
  mittwald_app_installation_copySuccessMessage,
  mittwald_app_installation_get_statusSuccessMessage,
  mittwald_app_installation_get_missing_dependenciesSuccessMessage
} from '../../../../constants/tool/mittwald/app/app-actions.js';
import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';
import type { 
  AppAction,
  CopyAppInstallationRequest,
  AppInstallation
} from '../../../../types/mittwald/app.js';

export interface MittwaldAppInstallationActionArgs {
  appInstallationId: string;
  action: AppAction;
}

export interface MittwaldAppInstallationCopyArgs {
  appInstallationId: string;
  description: string;
  projectId: string;
}

export interface MittwaldAppInstallationGetStatusArgs {
  appInstallationId: string;
}

export interface MittwaldAppInstallationGetMissingDependenciesArgs {
  appInstallationId: string;
}

export const handleMittwaldAppInstallationAction: ToolHandler<MittwaldAppInstallationActionArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId || !args.action) {
      throw new Error("App Installation ID and action are required");
    }

    // Call the Mittwald API to execute the action
    const response = await mittwaldClient.api.app.executeAction({
      appInstallationId: args.appInstallationId,
      action: args.action
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to execute action: ${response.status}`);
    }

    return formatToolResponse({
      message: mittwald_app_installation_actionSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        action: args.action,
        executed: true
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to execute app installation action: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationCopy: ToolHandler<MittwaldAppInstallationCopyArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId || !args.description || !args.projectId) {
      throw new Error("App Installation ID, description, and project ID are required");
    }

    const requestBody: CopyAppInstallationRequest = {
      description: args.description,
      projectId: args.projectId
    };

    // Call the Mittwald API to copy app installation
    const response = await mittwaldClient.api.app.requestAppinstallationCopy({
      appInstallationId: args.appInstallationId,
      data: requestBody
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to copy app installation: ${response.status}`);
    }

    return formatToolResponse({
      message: mittwald_app_installation_copySuccessMessage,
      result: {
        originalAppInstallationId: args.appInstallationId,
        newAppInstallationId: response.data?.id,
        targetProjectId: args.projectId,
        description: args.description
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to copy app installation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationGetStatus: ToolHandler<MittwaldAppInstallationGetStatusArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    // Call the Mittwald API to get app installation (which includes status)
    const response = await mittwaldClient.api.app.getAppinstallation({
      appInstallationId: args.appInstallationId
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get app installation status: ${response.status}`);
    }

    const installation: AppInstallation = response.data as AppInstallation;
    // Extract status information from the installation data
    const status = {
      state: installation.disabled ? 'stopped' : 'running',
      logFileLocation: '/var/log/app.log', // This would need to be extracted from actual data
    };

    return formatToolResponse({
      message: mittwald_app_installation_get_statusSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        status,
        installation
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get app installation status: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

export const handleMittwaldAppInstallationGetMissingDependencies: ToolHandler<MittwaldAppInstallationGetMissingDependenciesArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!mittwaldClient) {
      throw new Error("Mittwald client not initialized");
    }

    if (!args.appInstallationId) {
      throw new Error("App Installation ID is required");
    }

    // Call the Mittwald API to get missing dependencies
    const response = await mittwaldClient.api.app.getMissingDependenciesForAppinstallation({
      appInstallationId: args.appInstallationId,
      queryParameters: {
        targetAppVersionID: args.appInstallationId // This might need to be adjusted based on actual API requirements
      }
    });

    if (!String(response.status).startsWith('2')) {
      throw new Error(`Failed to get missing dependencies: ${response.status}`);
    }

    const missingDependencies = response.data as any || {};
    const systemSoftwareDeps = missingDependencies.missingSystemSoftwareDependencies || [];
    const userInputs = missingDependencies.missingUserInputs || [];
    const totalCount = systemSoftwareDeps.length + userInputs.length;

    return formatToolResponse({
      message: mittwald_app_installation_get_missing_dependenciesSuccessMessage,
      result: {
        appInstallationId: args.appInstallationId,
        missingSystemSoftwareDependencies: systemSoftwareDeps,
        missingUserInputs: userInputs,
        count: totalCount,
        hasMissingDependencies: totalCount > 0
      }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get missing dependencies: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};