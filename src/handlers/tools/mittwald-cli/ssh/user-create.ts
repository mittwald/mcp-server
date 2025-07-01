import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { z } from "zod";

const sshUserCreateSchema = z.object({
  projectId: z.string().optional(),
  description: z.string(),
  authenticationMethod: z.enum(["password", "publickey"]),
  quiet: z.boolean().default(false),
  expiresAt: z.string().optional(),
  publicKey: z.string().optional(),
  password: z.string().optional()
}).refine(data => {
  if (data.authenticationMethod === "publickey" && !data.publicKey) {
    return false;
  }
  if (data.authenticationMethod === "password" && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Must provide publicKey when authenticationMethod is 'publickey', or password when authenticationMethod is 'password'"
});

interface SshUserCreateArgs {
  projectId?: string;
  description: string;
  authenticationMethod: "password" | "publickey";
  quiet?: boolean;
  expiresAt?: string;
  publicKey?: string;
  password?: string;
}

export const handleSshUserCreate: MittwaldToolHandler<SshUserCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { projectId, description, authenticationMethod, quiet, expiresAt, publicKey, password } = sshUserCreateSchema.parse(args);

    if (!projectId) {
      return formatToolResponse(
        "error",
        "Project ID is required. Please provide a projectId parameter."
      );
    }

    // Build the create payload
    const createData: any = {
      description
    };

    if (expiresAt) {
      createData.expiresAt = expiresAt;
    }

    if (authenticationMethod === "publickey") {
      createData.publicKey = publicKey;
      createData.authMethod = "publicKey";
    } else if (authenticationMethod === "password") {
      createData.password = password;
      createData.authMethod = "password";
    }

    // Create the SSH user
    const response = await mittwaldClient.api.sshsftpUser.sshUserCreateSshUser({
      projectId,
      data: createData
    });

    const sshUserId = response.data?.id;

    if (quiet) {
      return formatToolResponse(
        "success",
        "SSH user created",
        {
          action: "created",
          sshUserId,
          projectId,
          status: "success"
        }
      );
    }

    let successMessage = `SSH user successfully created with ID: ${sshUserId}`;
    
    const details = [];
    details.push(`Description: ${description}`);
    if (expiresAt) details.push(`Expires: ${expiresAt}`);
    details.push(`Authentication: ${authenticationMethod}`);
    details.push(`Project ID: ${projectId}`);

    successMessage += `\n\nDetails:\n- ${details.join('\n- ')}`;

    return formatToolResponse(
      "success",
      successMessage
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating SSH user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};