import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldMailDeliveryboxCreateArgs {
  description: string;
  projectId?: string;
  password?: string;
  randomPassword?: boolean;
  quiet?: boolean;
}

export const handleMailDeliveryboxCreate: MittwaldToolHandler<MittwaldMailDeliveryboxCreateArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Handle password
    let password = args.password;
    let generatedPassword: string | undefined;
    
    if (args.randomPassword) {
      generatedPassword = PasswordGenerator.generate(32);
      password = generatedPassword;
    }
    
    if (!password) {
      return formatToolResponse(
        "error",
        "Password is required. Provide either --password or use --random-password flag."
      );
    }

    // Prepare create data
    const createData = {
      description: args.description,
      password: password
    };
    
    // Create the delivery box
    const createResponse = await mittwaldClient.api.mail.createDeliveryBox({
      projectId: args.projectId!,
      data: createData
    });

    if (createResponse.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to create delivery box: ${createResponse.status}`
      );
    }

    const deliveryBoxId = createResponse.data;

    // If quiet mode, return just the ID (and password if generated)
    if (args.quiet) {
      if (generatedPassword) {
        return formatToolResponse("success", `${deliveryBoxId}\t${generatedPassword}`);
      } else {
        return formatToolResponse("success", deliveryBoxId);
      }
    }

    // Prepare response
    const result: any = {
      deliveryBoxId: deliveryBoxId,
      description: args.description,
      success: true,
      message: "Mail delivery box created successfully"
    };

    if (generatedPassword) {
      result.generatedPassword = generatedPassword;
      result.message += ` (Generated password: ${generatedPassword})`;
    }

    return formatToolResponse("success", result);
  } catch (error) {
    return formatToolResponse("error", `Error creating delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};