import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

interface AppDependencyListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleMittwaldAppDependencyList: MittwaldToolHandler<AppDependencyListArgs> = async (args, { mittwaldClient }) => {
  try {
    // List all available system software
    const response = await mittwaldClient.app.listSystemsoftwares({});
    assertStatus(response, 200);
    
    const systemSoftwares = response.data || [];
    const output = args.output || 'txt';
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${systemSoftwares.length} system software packages`,
        systemSoftwares
      );
    }
    
    // Format for text/table output
    const formattedData = systemSoftwares.map((sw: any) => ({
      ID: args.noTruncate ? sw.id : sw.id.substring(0, 8),
      Name: sw.name,
      Description: sw.description || 'N/A',
      Version: sw.version || 'Multiple'
    }));
    
    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${systemSoftwares.length} system software packages`,
        formattedData
      );
    }
    
    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Name${separator}Description${separator}Version\n`;
      const rows = formattedData.map(sw => 
        `${sw.ID}${separator}${sw.Name}${separator}${sw.Description}${separator}${sw.Version}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }
    
    // Default text format
    return formatToolResponse(
      "success",
      `Found ${systemSoftwares.length} system software packages`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get dependency list: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};