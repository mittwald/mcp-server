import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseDuration } from '../../../../utils/parse-duration.js';

interface Args {
  installationId?: string;
  description: string;
  interval: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  url?: string;
  email?: string;
  disable?: boolean;
  timeout?: string;
  quiet?: boolean;
}

export const handleCronjobCreate: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const {
      installationId,
      description,
      interval,
      command,
      interpreter,
      url,
      email,
      disable = false,
      timeout = '3600s',
      quiet = false
    } = args;

    // Validate that either command+interpreter or url is provided
    if (!url && (!command || !interpreter)) {
      return formatToolResponse(
        "error",
        "Either 'url' or both 'command' and 'interpreter' must be provided"
      );
    }

    if (url && (command || interpreter)) {
      return formatToolResponse(
        "error", 
        "Cannot specify both 'url' and 'command/interpreter' parameters"
      );
    }

    // Installation ID is required
    const appInstallationId = installationId;
    if (!appInstallationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide an 'installationId' parameter."
      );
    }

    // Parse timeout to milliseconds
    let timeoutMs: number;
    try {
      timeoutMs = parseDuration(timeout);
    } catch (error) {
      return formatToolResponse(
        "error",
        `Invalid timeout format: ${timeout}. Use formats like '1h', '30m', '30s'`
      );
    }

    // Create the cron job
    const createData: any = {
      active: !disable,
      appId: appInstallationId,
      description,
      interval,
      timeout: timeoutMs / 1000 // Convert to seconds
    };

    // Set destination based on URL or command
    if (url) {
      createData.destination = { url };
    } else if (command) {
      createData.destination = {
        path: command,
        interpreter: interpreter || 'bash'
      };
    } else {
      return formatToolResponse(
        "error",
        "Either 'url' or 'command' must be provided for cronjob destination"
      );
    }

    if (email) {
      createData.email = email;
    }

    // Need to get project ID from app installation
    const appResponse = await mittwaldClient.app.getAppinstallation({
      appInstallationId: appInstallationId
    });

    if (appResponse.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get app installation details: ${appResponse.status}`
      );
    }

    const projectId = appResponse.data.projectId;
    
    if (!projectId) {
      return formatToolResponse(
        "error",
        "Failed to get project ID from app installation"
      );
    }

    const response = await mittwaldClient.cronjob.createCronjob({
      projectId,
      data: createData
    });

    if (response.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to create cronjob: ${response.status}`
      );
    }

    const cronjobId = response.data.id;

    // Get the created cron job details for confirmation
    const cronjobResponse = await mittwaldClient.cronjob.getCronjob({
      cronjobId
    });

    if (cronjobResponse.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get created cronjob details: ${cronjobResponse.status}`
      );
    }

    const cronjob = cronjobResponse.data;

    if (quiet) {
      return formatToolResponse(
        "success",
        "Cronjob created successfully",
        { id: cronjobId }
      );
    }

    const details: any = {
      id: cronjobId,
      description: cronjob.description,
      interval: cronjob.interval,
      active: cronjob.active,
      appInstallationId: cronjob.appId
    };

    // Handle destination details
    if (cronjob.destination) {
      if ('url' in cronjob.destination) {
        details.url = cronjob.destination.url;
      } else if ('path' in cronjob.destination) {
        details.command = cronjob.destination.path;
        details.interpreter = cronjob.destination.interpreter;
      }
    }

    if (cronjob.email) {
      details.email = cronjob.email;
    }

    if (cronjob.timeout) {
      details.timeout = `${cronjob.timeout}ms`;
    }

    return formatToolResponse(
      "success",
      `Cron job created successfully with ID: ${cronjobId}`,
      details
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create cron job: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};