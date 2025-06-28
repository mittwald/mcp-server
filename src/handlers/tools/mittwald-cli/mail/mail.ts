import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldMailArgs {
  help?: boolean;
}

export const handleMail: MittwaldToolHandler<MittwaldMailArgs> = async (args) => {
  try {
    const helpText = `
Manage mailboxes and mail addresses in your projects

USAGE
  $ mw mail COMMAND

TOPICS
  mail address      Create a new mail address
  mail deliverybox  Create a new mail delivery box

Use specific topic tools like mittwald_mail_address_* or mittwald_mail_deliverybox_* to perform actions.
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