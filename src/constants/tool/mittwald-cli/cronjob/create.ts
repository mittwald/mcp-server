import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_create: Tool = {
  name: "mittwald_cronjob_create",
  description: "Create a new cron job for an app installation. Supports command execution or URL-based cron jobs with customizable intervals, timeouts, and error notifications.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; this flag is optional if a default app installation is set in the context"
      },
      description: {
        type: "string",
        description: "Set cron job description. This will be displayed as the cron job's 'name' in mStudio."
      },
      interval: {
        type: "string",
        description: "Set the interval for cron jobs to run. Must be specified as a cron schedule expression (e.g., '0 * * * *' for hourly, '*/5 * * * *' for every 5 minutes)."
      },
      command: {
        type: "string",
        description: "Specify the file and arguments to be executed when the cron job is run. Not required if a URL is given."
      },
      interpreter: {
        type: "string",
        enum: ["bash", "php"],
        description: "Set the interpreter to be used for execution. Must be either 'bash' or 'php'. Required when command is specified."
      },
      url: {
        type: "string",
        description: "Set the URL to use when running a cron job. Define a URL with protocol (e.g., 'https://my-website.com/cron-job'). Not required if a command and interpreter are defined."
      },
      email: {
        type: "string",
        description: "Set the target email to which error messages will be sent. If a cron job fails, a detailed error message will be sent to this email address."
      },
      disable: {
        type: "boolean",
        description: "Disable the cron job. When creating a cron job it is enabled by default. This flag can be used to set the status of the cron job to inactive."
      },
      timeout: {
        type: "string",
        description: "Timeout after which the process will be killed. Common duration formats are supported (e.g., '1h', '30m', '30s'). Default is '3600s'."
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary."
      }
    },
    required: ["description", "interval"]
  }
};