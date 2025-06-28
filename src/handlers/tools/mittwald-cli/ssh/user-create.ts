import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sshUserCreateSchema = z.object({
  projectId: z.string().optional(),
  description: z.string(),
  quiet: z.boolean().default(false),
  expires: z.string().optional(),
  publicKey: z.string().optional(),
  password: z.string().optional()
}).refine(data => !(data.publicKey && data.password), {
  message: "Cannot specify both publicKey and password - choose one authentication method"
});

export async function handleSshUserCreate(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { projectId, description, quiet, expires, publicKey, password } = sshUserCreateSchema.parse(args);

    if (!projectId) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Project ID is required. Please provide a projectId parameter."
          }
        ],
        isError: true
      };
    }

    // Build the create payload
    const createData: any = {
      description
    };

    if (expires) {
      createData.expiresAt = expires; // The API might expect a specific format
    }

    if (publicKey) {
      createData.publicKey = publicKey;
      createData.authMethod = "publicKey";
    } else if (password) {
      createData.password = password;
      createData.authMethod = "password";
    }

    // Create the SSH user
    const response = await apiClient.sshsftpUser.sshUserCreateSshUser({
      projectId,
      data: createData
    });

    const sshUserId = response.data?.id;

    if (quiet) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action: "created",
              sshUserId,
              projectId,
              status: "success"
            })
          }
        ]
      };
    }

    let successMessage = `SSH user successfully created with ID: ${sshUserId}`;
    
    const details = [];
    details.push(`Description: ${description}`);
    if (expires) details.push(`Expires: ${expires}`);
    if (publicKey) details.push(`Authentication: public key`);
    if (password) details.push(`Authentication: password`);
    details.push(`Project ID: ${projectId}`);

    successMessage += `\n\nDetails:\n- ${details.join('\n- ')}`;

    return {
      content: [
        {
          type: "text",
          text: successMessage
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating SSH user: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}