import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ConversationCategoriesArgs {
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: "," | ";";
}

export const handleConversationCategories: MittwaldToolHandler<ConversationCategoriesArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get conversation categories from the API
    const result = await mittwaldClient.api.conversation.listCategories();
    
    if (!result.data) {
      return formatToolResponse(
        "error",
        "Failed to fetch conversation categories"
      );
    }

    const categories = Array.isArray(result.data) ? result.data : [];
    const output = args.output || "json";
    
    if (output === "json") {
      return formatToolResponse(
        "success",
        "Successfully retrieved conversation categories",
        { categories, format: output }
      );
    }
    
    // Format categories for text output
    if (categories.length === 0) {
      return formatToolResponse(
        "success",
        "No conversation categories found"
      );
    }
    
    // For other output formats, return formatted data
    let formattedOutput = "";
    
    switch (output) {
      case "txt":
        formattedOutput = formatAsTable(categories, args);
        break;
      case "yaml":
        formattedOutput = formatAsYaml(categories);
        break;
      case "csv":
      case "tsv":
        formattedOutput = formatAsDelimited(categories, output, args.csvSeparator);
        break;
    }
    
    return formatToolResponse(
      "success",
      "Successfully retrieved conversation categories",
      { formattedOutput, format: output }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to fetch conversation categories: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

function formatAsTable(categories: any[], args: ConversationCategoriesArgs): string {
  const headers = args.extended 
    ? ["ID", "NAME", "DESCRIPTION", "CREATED"]
    : ["ID", "NAME"];
  
  let output = "";
  
  if (!args.noHeader) {
    output += headers.join("\t") + "\n";
  }
  
  for (const category of categories) {
    const row = args.extended
      ? [
          category.id || "",
          category.name || "",
          args.noTruncate ? (category.description || "") : truncate(category.description || "", 50),
          args.noRelativeDates ? category.createdAt : formatRelativeDate(category.createdAt)
        ]
      : [category.id || "", category.name || ""];
    
    output += row.join("\t") + "\n";
  }
  
  return output.trim();
}

function formatAsYaml(categories: any[]): string {
  // Simple YAML formatting
  let output = "";
  for (const category of categories) {
    output += `- id: ${category.id}\n`;
    output += `  name: ${category.name}\n`;
    if (category.description) {
      output += `  description: ${category.description}\n`;
    }
    if (category.createdAt) {
      output += `  createdAt: ${category.createdAt}\n`;
    }
    output += "\n";
  }
  return output.trim();
}

function formatAsDelimited(categories: any[], format: "csv" | "tsv", separator?: "," | ";"): string {
  const delimiter = format === "tsv" ? "\t" : (separator || ",");
  const headers = ["ID", "NAME", "DESCRIPTION", "CREATED"];
  
  let output = headers.join(delimiter) + "\n";
  
  for (const category of categories) {
    const row = [
      category.id || "",
      category.name || "",
      category.description || "",
      category.createdAt || ""
    ];
    output += row.map(field => escapeField(field, delimiter)).join(delimiter) + "\n";
  }
  
  return output.trim();
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

function escapeField(field: string, delimiter: string): string {
  if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}