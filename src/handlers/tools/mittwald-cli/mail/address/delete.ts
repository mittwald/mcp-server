/**
 * @file Handler for mittwald_mail_address_delete tool
 * @module handlers/tools/mittwald-cli/mail/address
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../../../types/tool-response.js';

/**
 * Delete a mail address
 * 
 * @param client - The Mittwald API client
 * @param args - Tool arguments
 * @returns Mail address deletion result
 */
export async function handleMittwaldMailAddressDelete(
  client: MittwaldAPIV2Client,
  args: {
    mailAddressId: string;
    force: boolean;
    quiet?: boolean;
  }
): Promise<ToolResponse> {
  try {
    // In MCP context, force is always required as there's no interactive confirmation
    if (!args.force) {
      return {
        success: false,
        error: 'Force flag is required in MCP context as interactive confirmation is not possible',
      };
    }

    // Get mail address details first for confirmation message
    let mailAddressDetails;
    try {
      const getResponse = await client.mail.getMailAddress({
        mailAddressId: args.mailAddressId,
      });
      
      if (getResponse.status === 200 && getResponse.data) {
        mailAddressDetails = getResponse.data;
      }
    } catch (error) {
      // Continue with deletion even if we can't get details
    }

    // Delete the mail address
    const response = await client.mail.deleteMailAddress({
      mailAddressId: args.mailAddressId,
    });

    if (response.status === 204) {
      if (args.quiet) {
        return {
          success: true,
          data: {
            mailAddressId: args.mailAddressId,
          },
        };
      }

      const result: any = {
        success: true,
        message: `Mail address ${args.mailAddressId} has been deleted`,
        mailAddressId: args.mailAddressId,
      };

      if (mailAddressDetails) {
        result.address = mailAddressDetails.address;
      }

      return {
        success: true,
        data: result,
      };
    }

    return {
      success: false,
      error: `Failed to delete mail address: HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle common error cases
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        success: false,
        error: `Mail address ${args.mailAddressId} not found`,
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return {
        success: false,
        error: `Access denied: You don't have permission to delete mail address ${args.mailAddressId}`,
      };
    }

    return {
      success: false,
      error: `Failed to delete mail address: ${errorMessage}`,
    };
  }
}