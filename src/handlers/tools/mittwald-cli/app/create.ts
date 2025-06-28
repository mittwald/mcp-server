import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldAppCreateArgs {
  help?: boolean;
}

export const handleAppCreate: MittwaldToolHandler<MittwaldAppCreateArgs> = async (args, context) => {
  try {
    const subcommands = [
      "node - Creates new custom Node.js installation",
      "php - Creates new custom PHP installation", 
      "php-worker - Creates new PHP worker installation",
      "python - Creates new custom python site installation",
      "static - Creates new custom static site installation"
    ];

    return formatToolResponse(
      "success",
      "Available app creation subcommands",
      {
        subcommands,
        usage: "Use specific subcommands like mittwald_app_create_node, mittwald_app_create_php, etc."
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};