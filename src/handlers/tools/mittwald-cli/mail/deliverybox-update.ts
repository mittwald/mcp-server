import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { generatePassword } from '../../../../utils/password-generator.js';

interface MittwaldMailDeliveryboxUpdateArgs {
  maildeliveryboxId: string;
  description?: string;
  password?: string;
  randomPassword?: boolean;
  quiet?: boolean;
}

export const handleMailDeliveryboxUpdate: MittwaldToolHandler<MittwaldMailDeliveryboxUpdateArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Prepare update data
    const updateData: any = {};
    
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    
    // Handle password update
    let generatedPassword: string | undefined;
    if (args.randomPassword) {
      generatedPassword = generatePassword(32);
      updateData.password = generatedPassword;
    } else if (args.password !== undefined) {
      updateData.password = args.password;
    }
    
    // Update the delivery box using individual API methods
    const updatePromises: Promise<any>[] = [];
    
    if (updateData.description !== undefined) {
      updatePromises.push(mittwaldClient.mail.updateDeliveryBoxDescription({
        deliveryBoxId: args.maildeliveryboxId,
        data: { description: updateData.description }
      }));
    }
    
    if (updateData.password !== undefined) {
      updatePromises.push(mittwaldClient.mail.updateDeliveryBoxPassword({
        deliveryBoxId: args.maildeliveryboxId,
        data: { password: updateData.password }
      }));
    }
    
    // Execute all updates
    try {
      await Promise.all(updatePromises);
    } catch (updateError) {
      return formatToolResponse(
        "error",
        `Failed to update delivery box: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }

    // Prepare response
    const result: any = {
      deliveryBoxId: args.maildeliveryboxId,
      success: true,
      message: "Mail delivery box updated successfully"
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
    return formatToolResponse("error", `Error updating delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};