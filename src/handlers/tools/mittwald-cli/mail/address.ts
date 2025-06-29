import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldMailAddressArgs {
  help?: boolean;
}

export const handleMailAddress: MittwaldToolHandler<MittwaldMailAddressArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `Mail Address Management Commands:

Available Commands:
- mail address create     Create a new mail address
- mail address delete     Delete an existing mail address  
- mail address get        Get details of a mail address
- mail address list       List all mail addresses in a project
- mail address update     Update an existing mail address

Usage:
  Use the specific mittwald_mail_address_* tools for individual operations:
  - mittwald_mail_address_create
  - mittwald_mail_address_delete
  - mittwald_mail_address_get
  - mittwald_mail_address_list
  - mittwald_mail_address_update

Description:
  Manage mail addresses in your projects. Mail addresses can be either
  mailboxes (with storage and login) or forwarding addresses that redirect
  mail to other addresses.`;

    return formatToolResponse(
      "success",
      "Mail Address Management Help",
      {
        helpText: helpText,
        availableCommands: [
          "mail address create",
          "mail address delete", 
          "mail address get",
          "mail address list",
          "mail address update"
        ]
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get mail address help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};