import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { z } from "zod";

export const MittwaldDatabaseMysqlListSchema = z.object({
  projectId: z.string().optional(),
  output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).default("txt"),
  extended: z.boolean().optional(),
  noHeader: z.boolean().optional(),
  noTruncate: z.boolean().optional(),
  noRelativeDates: z.boolean().optional(),
  csvSeparator: z.enum([",", ";"]).optional(),
});

type MittwaldDatabaseMysqlListArgs = z.infer<typeof MittwaldDatabaseMysqlListSchema>;

export const handleDatabaseMysqlList: MittwaldToolHandler<MittwaldDatabaseMysqlListArgs> = async (args, { mittwaldClient }) => {
  try {
    const { projectId, output = "txt", extended, noHeader, noTruncate, noRelativeDates, csvSeparator } = args;

    // List MySQL databases
    const response = await mittwaldClient.api.database.listMysqlDatabases({
      queryParameters: projectId ? { projectId } : {}
    });

    if (response.status !== 200) {
      return formatToolResponse(
        'error',
        `Failed to list MySQL databases: API returned status ${response.status}`
      );
    }

    const databases = response.data || [];

    // Format output based on requested format
    if (output === "json") {
      return formatToolResponse(
        'success',
        'MySQL databases retrieved successfully',
        databases
      );
    }

    if (output === "yaml") {
      // Simple YAML format
      const yamlOutput = databases.map(db => `
- id: ${db.id}
  name: ${db.name || 'N/A'}
  characterSettings: ${db.characterSettings || 'N/A'}
  projectId: ${db.projectId}
  version: ${db.version || 'N/A'}
  createdAt: ${db.createdAt || 'N/A'}${extended ? `
  isReady: ${db.isReady ?? 'N/A'}
  storageUsage: ${db.storageUsage?.total || 'N/A'}` : ''}`).join('\n');

      return formatToolResponse(
        'success',
        'MySQL databases retrieved in YAML format',
        yamlOutput.trim() || 'No databases found'
      );
    }

    if (output === "csv" || output === "tsv") {
      const separator = output === 'csv' ? (csvSeparator || ',') : '\t';
      const headers = extended 
        ? ['ID', 'Name', 'Character Settings', 'Project ID', 'Version', 'Created', 'Ready', 'Storage']
        : ['ID', 'Name', 'Character Settings', 'Project ID', 'Version', 'Created'];
      
      const headerRow = noHeader ? '' : headers.join(separator) + '\n';
      const dataRows = databases.map(db => {
        const basicData = [
          db.id,
          db.name || '',
          db.characterSettings || '',
          db.projectId,
          db.version || '',
          db.createdAt || ''
        ];
        
        if (extended) {
          basicData.push(
            String(db.isReady ?? ''),
            String(db.storageUsage?.total || '')
          );
        }
        
        return basicData.join(separator);
      }).join('\n');

      return formatToolResponse(
        'success',
        'MySQL databases retrieved in CSV/TSV format',
        headerRow + dataRows
      );
    }

    // Default text format
    if (databases.length === 0) {
      return formatToolResponse(
        'success',
        'No MySQL databases found',
        'No MySQL databases found.'
      );
    }

    const formatDate = (dateStr: string | undefined) => {
      if (!dateStr) return 'N/A';
      if (noRelativeDates) return dateStr;
      
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return dateStr;
    };

    const truncate = (str: string, maxLength: number = 50) => {
      if (noTruncate || !str || str.length <= maxLength) return str;
      return str.substring(0, maxLength - 3) + '...';
    };

    let output_text = '';
    
    if (!noHeader) {
      const headers = extended 
        ? ['ID', 'Name', 'Character Settings', 'Version', 'Created', 'Ready']
        : ['ID', 'Name', 'Character Settings', 'Version', 'Created'];
      output_text += headers.join('\t') + '\n';
    }

    databases.forEach(db => {
      const row = [
        truncate(db.id),
        truncate(db.name || 'N/A'),
        truncate(db.characterSettings || 'N/A'),
        db.version || 'N/A',
        formatDate(db.createdAt)
      ];

      if (extended) {
        row.push(String(db.isReady ?? 'N/A'));
      }

      output_text += row.join('\t') + '\n';
    });

    return formatToolResponse(
      'success',
      'MySQL databases retrieved successfully',
      output_text.trim()
    );

  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to list MySQL databases: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};