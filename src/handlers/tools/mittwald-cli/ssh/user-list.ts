import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sshUserListSchema = z.object({
  projectId: z.string().optional(),
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("txt"),
  extended: z.boolean().default(false),
  noHeader: z.boolean().default(false),
  noTruncate: z.boolean().default(false),
  noRelativeDates: z.boolean().default(false),
  csvSeparator: z.enum([",", ";"]).default(",")
});

export async function handleSshUserList(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { projectId, output, extended, noHeader, noTruncate, noRelativeDates, csvSeparator } = sshUserListSchema.parse(args);

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

    // Get SSH users for the project
    const response = await apiClient.sshsftpUser.sshUserListSshUsers({
      projectId
    });

    const sshUsers = Array.isArray(response.data) ? response.data : [];

    if (output === "json") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sshUsers, null, 2)
          }
        ]
      };
    }

    if (output === "yaml") {
      // Simple YAML-like output
      const yamlOutput = sshUsers.map((user: any) => 
        `- id: ${user.id}\n  description: ${user.description || 'N/A'}\n  active: ${user.active || false}\n  authMethod: ${user.authentication?.type || 'N/A'}`
      ).join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: yamlOutput || "No SSH users found"
          }
        ]
      };
    }

    if (output === "csv" || output === "tsv") {
      const separator = output === "csv" ? csvSeparator : "\t";
      let csvOutput = "";
      
      if (!noHeader) {
        csvOutput += `ID${separator}Description${separator}Active${separator}Auth Method\n`;
      }
      
      for (const user of sshUsers) {
        csvOutput += `${user.id}${separator}${user.description || 'N/A'}${separator}${user.active || false}${separator}${(user as any).authentication?.type || 'N/A'}\n`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: csvOutput || "No SSH users found"
          }
        ]
      };
    }

    // Default txt output
    if (sshUsers.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No SSH users found for this project."
          }
        ]
      };
    }

    let textOutput = "";
    if (!noHeader) {
      textOutput += "ID\t\tDescription\t\tActive\t\tAuth Method\n";
      textOutput += "─".repeat(80) + "\n";
    }

    for (const user of sshUsers) {
      const id = noTruncate ? user.id : (user.id.length > 12 ? user.id.substring(0, 12) + "..." : user.id);
      const description = user.description || 'N/A';
      const active = user.active ? 'Yes' : 'No';
      const authMethod = (user as any).authentication?.type || 'N/A';
      
      textOutput += `${id}\t\t${description}\t\t${active}\t\t${authMethod}\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: textOutput
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing SSH users: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}