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

    // Get installation ID from context if not provided
    let appInstallationId = installationId;
    if (!appInstallationId) {
      const contextData = await mittwaldClient.conversation.getContext();
      appInstallationId = contextData.appInstallation?.appInstallationId;
      
      if (!appInstallationId) {
        return formatToolResponse(
          "error",
          "No installation ID provided and no default app installation set in context. Use 'mittwald_context_set' to set a default or provide an installation ID."
        );
      }
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
      interval
    };

    if (url) {
      createData.url = url;
    } else {
      createData.command = command;
      createData.interpreter = interpreter;
    }

    if (email) {
      createData.email = email;
    }

    if (timeout !== '3600s') {
      createData.timeout = timeoutMs;
    }

    const response = await mittwaldClient.cronjob.createCronjob({
      data: createData
    });

    const cronjobId = response.id;

    // Get the created cron job details for confirmation
    const cronjob = await mittwaldClient.cronjob.getCronjob({
      cronjobId
    });

    if (quiet) {
      return formatToolResponse(
        "success",
        cronjobId
      );
    }

    const details: any = {
      id: cronjob.id,
      description: cronjob.description,
      interval: cronjob.interval,
      active: cronjob.active,
      appInstallationId: cronjob.appId
    };

    if (cronjob.url) {
      details.url = cronjob.url;
    } else {
      details.command = cronjob.command;
      details.interpreter = cronjob.interpreter;
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