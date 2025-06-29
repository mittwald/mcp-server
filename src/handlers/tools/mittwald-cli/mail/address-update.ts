import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { generatePassword } from '../../../../utils/password-generator.js';

interface MittwaldMailAddressUpdateArgs {
  mailaddressId: string;
  address?: string;
  catchAll?: boolean;
  quota?: number;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
  quiet?: boolean;
}

export const handleMailAddressUpdate: MittwaldToolHandler<MittwaldMailAddressUpdateArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Get mail address details first
    const mailAddressResponse = await mittwaldClient.api.mail.getMailAddress({
      mailAddressId: args.mailaddressId
    });

    if (mailAddressResponse.status !== 200 || !mailAddressResponse.data) {
      return formatToolResponse(
        "error",
        `Failed to get mail address: Mail address ${args.mailaddressId} not found`
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (args.address !== undefined) {
      updateData.address = args.address;
    }
    
    if (args.catchAll !== undefined) {
      updateData.catchAll = args.catchAll;
    }
    
    if (args.quota !== undefined) {
      updateData.quotaInMB = args.quota;
    }
    
    // Handle password update
    let generatedPassword: string | undefined;
    if (args.randomPassword) {
      generatedPassword = generatePassword(32);
      updateData.password = generatedPassword;
    } else if (args.password !== undefined) {
      updateData.password = args.password;
    }
    
    // Handle forwarding addresses
    if (args.forwardTo !== undefined) {
      if (args.forwardTo.length > 0) {
        updateData.forwardAddresses = args.forwardTo;
        // Clear mailbox settings when setting forwarding
        updateData.password = undefined;
        updateData.quotaInMB = undefined;
      } else {
        updateData.forwardAddresses = [];
      }
    }
    
    // Update the mail address using individual API methods
    const updatePromises: Promise<any>[] = [];
    
    if (updateData.address !== undefined) {
      updatePromises.push(mittwaldClient.api.mail.updateMailAddressAddress({
        mailAddressId: args.mailaddressId,
        data: { address: updateData.address }
      }));
    }
    
    if (updateData.catchAll !== undefined) {
      updatePromises.push(mittwaldClient.api.mail.updateMailAddressCatchAll({
        mailAddressId: args.mailaddressId,
        data: { active: updateData.catchAll }
      }));
    }
    
    if (updateData.quotaInMB !== undefined) {
      updatePromises.push(mittwaldClient.api.mail.updateMailAddressQuota({
        mailAddressId: args.mailaddressId,
        data: { quotaInBytes: updateData.quotaInMB * 1024 * 1024 }
      }));
    }
    
    if (updateData.password !== undefined) {
      updatePromises.push(mittwaldClient.api.mail.updateMailAddressPassword({
        mailAddressId: args.mailaddressId,
        data: { password: updateData.password }
      }));
    }
    
    if (updateData.forwardAddresses !== undefined) {
      updatePromises.push(mittwaldClient.api.mail.updateMailAddressForwardAddresses({
        mailAddressId: args.mailaddressId,
        data: { forwardAddresses: updateData.forwardAddresses }
      }));
    }
    
    // Execute all updates
    try {
      await Promise.all(updatePromises);
    } catch (updateError) {
      return formatToolResponse(
        "error",
        `Failed to update mail address: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }

    // Prepare response
    const result: any = {
      mailAddressId: args.mailaddressId,
      success: true,
      message: "Mail address updated successfully"
    };

    // If quiet mode and random password was generated, return only the password
    if (args.quiet && generatedPassword) {
      return formatToolResponse("success", generatedPassword);
    }

    // If random password was generated, include it in response
    if (generatedPassword) {
      result.generatedPassword = generatedPassword;
      result.message += ` (Generated password: ${generatedPassword})`;
    }

    return formatToolResponse("success", result.message, result);
  } catch (error) {
    return formatToolResponse("error", `Error updating mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
}