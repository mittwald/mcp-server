import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MittwaldExtensionArgs {}

export const handleExtension: MittwaldToolHandler<MittwaldExtensionArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpInfo = {
      command: "mw extension",
      description: "Install and manage extensions in your organisations and projects",
      availableCommands: [
        {
          command: "mittwald_extension_install",
          description: "Install an extension in a project or organization"
        },
        {
          command: "mittwald_extension_list",
          description: "Get all available extensions"
        },
        {
          command: "mittwald_extension_list_installed",
          description: "List installed extensions in an organization or project"
        },
        {
          command: "mittwald_extension_uninstall",
          description: "Remove an extension from an organization"
        }
      ]
    };

    return formatToolResponse(
      "success",
      "Available extension management commands",
      helpInfo
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get extension help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};