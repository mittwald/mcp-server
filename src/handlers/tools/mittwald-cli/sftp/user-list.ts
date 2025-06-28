import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { z } from "zod";

const sftpUserListSchema = z.object({
  projectId: z.string().optional(),
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("txt"),
  extended: z.boolean().default(false),
  noHeader: z.boolean().default(false),
  noTruncate: z.boolean().default(false),
  noRelativeDates: z.boolean().default(false),
  csvSeparator: z.enum([",", ";"]).default(",")
});

export async function handleSftpUserList(
  args: unknown,
  apiClient: MittwaldAPIV2Client
): Promise<CallToolResult> {
  try {
    const { projectId, output, extended, noHeader, noTruncate, noRelativeDates, csvSeparator } = sftpUserListSchema.parse(args);

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

    // Get SFTP users for the project
    const response = await apiClient.sshsftpUser.sftpUserListSftpUsers({
      projectId
    });

    const sftpUsers = Array.isArray(response.data) ? response.data : [];

    if (output === "json") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sftpUsers, null, 2)
          }
        ]
      };
    }

    if (output === "yaml") {
      // Simple YAML-like output
      const yamlOutput = sftpUsers.map((user: any) => 
        `- id: ${user.id}\n  description: ${user.description || 'N/A'}\n  accessLevel: ${user.accessLevel || 'N/A'}\n  directories: ${JSON.stringify(user.directories || [])}`
      ).join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: yamlOutput || "No SFTP users found"
          }
        ]
      };
    }

    if (output === "csv" || output === "tsv") {
      const separator = output === "csv" ? csvSeparator : "\t";
      let csvOutput = "";
      
      if (!noHeader) {
        csvOutput += `ID${separator}Description${separator}Access Level${separator}Directories\n`;
      }
      
      for (const user of sftpUsers) {
        csvOutput += `${user.id}${separator}${user.description || 'N/A'}${separator}${user.accessLevel || 'N/A'}${separator}${JSON.stringify(user.directories || [])}\n`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: csvOutput || "No SFTP users found"
          }
        ]
      };
    }

    // Default txt output
    if (sftpUsers.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No SFTP users found for this project."
          }
        ]
      };
    }

    let textOutput = "";
    if (!noHeader) {
      textOutput += "ID\t\tDescription\t\tAccess Level\t\tDirectories\n";
      textOutput += "─".repeat(80) + "\n";
    }

    for (const user of sftpUsers) {
      const id = noTruncate ? user.id : (user.id.length > 12 ? user.id.substring(0, 12) + "..." : user.id);
      const description = user.description || 'N/A';
      const accessLevel = user.accessLevel || 'N/A';
      const directories = Array.isArray(user.directories) ? user.directories.join(', ') : 'N/A';
      
      textOutput += `${id}\t\t${description}\t\t${accessLevel}\t\t${directories}\n`;
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
          text: `Error listing SFTP users: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}