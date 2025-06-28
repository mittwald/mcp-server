import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldMailDeliveryboxArgs {
  help?: boolean;
}

export const handleMailDeliverybox: MittwaldToolHandler<MittwaldMailDeliveryboxArgs> = async (args) => {
  try {
    const helpText = `
Mail Delivery Box Commands:

USAGE
  $ mw mail deliverybox COMMAND

COMMANDS
  mail deliverybox create  Create a new mail delivery box
  mail deliverybox delete  Delete a mail delivery box
  mail deliverybox get     Get a specific delivery box
  mail deliverybox list    Get all delivery boxes by project ID
  mail deliverybox update  Update a mail delivery box

Use specific subcommand tools like mittwald_mail_deliverybox_create to perform actions.
`;

    return formatToolResponse(
      "success",
      helpText.trim()
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};