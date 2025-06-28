import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldAppArgs {
  help?: boolean;
}

export const handleApp: MittwaldToolHandler<MittwaldAppArgs> = async (args) => {
  // This is a parent command that shows available subcommands
  const subcommands = [
    {
      command: "app create",
      description: "Creates new custom Node.js installation"
    },
    {
      command: "app dependency",
      description: "Manage the system dependencies of your apps"
    },
    {
      command: "app install",
      description: "Install apps in your projects"
    },
    {
      command: "app copy",
      description: "Copy an app within a project"
    },
    {
      command: "app download",
      description: "Download the filesystem of an app within a project to your local machine"
    },
    {
      command: "app get",
      description: "Get details about an app installation"
    },
    {
      command: "app list",
      description: "List installed apps in a project"
    },
    {
      command: "app list-upgrade-candidates",
      description: "List upgrade candidates for an app installation"
    },
    {
      command: "app open",
      description: "Open an app installation in the browser"
    },
    {
      command: "app ssh",
      description: "Connect to an app via SSH"
    },
    {
      command: "app uninstall",
      description: "Uninstall an app"
    },
    {
      command: "app update",
      description: "Update properties of an app installation (use 'upgrade' to update the app version)"
    },
    {
      command: "app upgrade",
      description: "Upgrade app installation to target version"
    },
    {
      command: "app upload",
      description: "Upload the filesystem of an app to a project"
    },
    {
      command: "app versions",
      description: "List supported Apps and Versions"
    }
  ];

  return formatToolResponse(
    "success",
    "Manage apps, and app installations in your projects",
    {
      usage: "mw app COMMAND",
      topics: [
        "app create - Creates new custom Node.js installation",
        "app dependency - Manage the system dependencies of your apps",
        "app install - Install apps in your projects"
      ],
      commands: subcommands
    }
  );
};