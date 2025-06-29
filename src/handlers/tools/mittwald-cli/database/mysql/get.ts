import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { z } from "zod";

export const MittwaldDatabaseMysqlGetSchema = z.object({
  databaseId: z.string(),
  output: z.enum(["txt", "json", "yaml"]).default("txt"),
});

type MittwaldDatabaseMysqlGetArgs = z.infer<typeof MittwaldDatabaseMysqlGetSchema>;

export const handleDatabaseMysqlGet: MittwaldToolHandler<MittwaldDatabaseMysqlGetArgs> = async (args, { mittwaldClient }) => {
  try {
    const { databaseId, output = "txt" } = args;

    // Get MySQL database details
    const response = await mittwaldClient.api.database.getMysqlDatabase({
      mysqlDatabaseId: databaseId
    });

    if (response.status !== 200) {
      return formatToolResponse(
        'error',
        `Failed to get MySQL database: API returned status ${response.status}`
      );
    }

    const database = response.data;

    // Format output based on requested format
    if (output === "json") {
      return formatToolResponse(
        'success',
        'MySQL database retrieved successfully',
        database
      );
    }

    if (output === "yaml") {
      // Simple YAML format
      const yamlOutput = `
id: ${database.id}
name: ${database.name || 'N/A'}
characterSettings: ${database.characterSettings || 'N/A'}
projectId: ${database.projectId}
version: ${database.version || 'N/A'}
createdAt: ${database.createdAt || 'N/A'}
`;
      return formatToolResponse(
        'success',
        'MySQL database retrieved in YAML format',
        yamlOutput.trim()
      );
    }

    // Default text format
    const textOutput = `
MySQL Database Details:
ID: ${database.id}
Name: ${database.name || 'N/A'}
Character Settings: ${database.characterSettings || 'N/A'}
Project ID: ${database.projectId}
Version: ${database.version || 'N/A'}
Created: ${database.createdAt || 'N/A'}
`;

    return formatToolResponse(
      'success',
      'MySQL database retrieved successfully',
      textOutput.trim()
    );

  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to get MySQL database information: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};