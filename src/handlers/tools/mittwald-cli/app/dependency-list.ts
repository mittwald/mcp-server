import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldAppDependencyListArgs {
  output?: string;
  extended?: boolean;
  csvSeparator?: string;
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

export const handleAppDependencyList: MittwaldToolHandler<MittwaldAppDependencyListArgs> = async (args, { mittwaldClient }) => {
  try {
    const outputFormat = args.output || "txt";

    // Get system software dependencies from the API
    const response = await mittwaldClient.app.api.listSystemsoftwares({});
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch system software: ${response.status}`);
    }
    
    const dependencies = response.data.map(sw => ({
      id: sw.id,
      name: sw.name,
      tags: sw.tags?.join(", ") || "",
      description: `Available system software: ${sw.name}`
    }));

    // Format output based on requested format
    switch (outputFormat) {
      case "json":
        return formatToolResponse(
          "success",
          "Dependencies retrieved successfully",
          {
            format: "json",
            dependencies: dependencies
          }
        );

      case "yaml":
        return formatToolResponse(
          "success",
          "Dependencies retrieved successfully (YAML format)",
          { format: "yaml", data: dependencies }
        );

      case "csv":
      case "tsv":
        const separator = outputFormat === "csv" ? (args.csvSeparator || ",") : "\t";
        const headers = ["ID", "Name", "Tags", "Description"];
        
        const csvRows = dependencies.map(dep => 
          [dep.id, dep.name, dep.tags, dep.description].join(separator)
        );

        const csvContent = args.noHeader 
          ? csvRows.join("\n")
          : [headers.join(separator), ...csvRows].join("\n");

        return formatToolResponse(
          "success",
          `Dependencies retrieved successfully (${outputFormat.toUpperCase()} format)`,
          {
            format: outputFormat,
            content: csvContent,
            count: dependencies.length
          }
        );

      default: // txt format
        const textLines = dependencies.map(dep => 
          `${dep.name} [${dep.tags}] - ${dep.description}`
        );

        return formatToolResponse(
          "success",
          "Dependencies retrieved successfully",
          {
            format: "txt",
            dependencies: textLines,
            count: dependencies.length
          }
        );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};