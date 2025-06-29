import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MittwaldDomainArgs {}

export const handleDomain: MittwaldToolHandler<MittwaldDomainArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpInfo = {
      command: "mw domain",
      description: "Manage domains, virtual hosts and DNS settings in your projects",
      availableCommands: [
        {
          command: "mittwald_domain_list",
          description: "List domains belonging to a project"
        },
        {
          command: "mittwald_domain_virtualhost",
          description: "Virtual host management commands"
        }
      ],
      topics: [
        {
          topic: "domain dnszone",
          description: "Gets a specific zone"
        },
        {
          topic: "domain virtualhost", 
          description: "Create a new ingress"
        }
      ]
    };

    return formatToolResponse(
      "success",
      "Available domain management commands",
      helpInfo
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get domain help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};