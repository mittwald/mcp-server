import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MittwaldDomainVirtualhostArgs {}

export const handleDomainVirtualhost: MittwaldToolHandler<MittwaldDomainVirtualhostArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpInfo = {
      command: "mw domain virtualhost",
      description: "Virtual host management commands",
      availableCommands: [
        {
          command: "mittwald_domain_virtualhost_create",
          description: "Create a new ingress"
        },
        {
          command: "mittwald_domain_virtualhost_delete", 
          description: "Delete a virtual host"
        },
        {
          command: "mittwald_domain_virtualhost_get",
          description: "Get a virtual host"
        },
        {
          command: "mittwald_domain_virtualhost_list",
          description: "List virtual hosts for a project"
        }
      ]
    };

    return formatToolResponse(
      "success",
      "Available virtual host commands",
      helpInfo
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get virtual host help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};