import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ConversationListArgs {
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: "," | ";";
}

export const handleConversationList: MittwaldToolHandler<ConversationListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get conversations from the API
    const result = await mittwaldClient.api.conversation.listConversations();
    
    if (!result.data) {
      return formatToolResponse(
        "error",
        "Failed to fetch conversations"
      );
    }

    const conversations = Array.isArray(result.data) ? result.data : [];
    const output = args.output || "json";
    
    if (output === "json") {
      return formatToolResponse(
        "success",
        "Successfully retrieved conversations",
        { conversations, format: output }
      );
    }
    
    if (conversations.length === 0) {
      return formatToolResponse(
        "success",
        "No conversations found"
      );
    }
    
    // Format conversations for other output formats
    let formattedOutput = "";
    
    switch (output) {
      case "txt":
        formattedOutput = formatAsTable(conversations, args);
        break;
      case "yaml":
        formattedOutput = formatAsYaml(conversations);
        break;
      case "csv":
      case "tsv":
        formattedOutput = formatAsDelimited(conversations, output, args.csvSeparator);
        break;
    }
    
    return formatToolResponse(
      "success",
      "Successfully retrieved conversations",
      { formattedOutput, format: output }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error fetching conversations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

function formatAsTable(conversations: any[], args: ConversationListArgs): string {
  const headers = args.extended 
    ? ["ID", "TITLE", "STATUS", "CATEGORY", "CREATED", "UPDATED"]
    : ["ID", "TITLE", "STATUS"];
  
  let output = "";
  
  if (!args.noHeader) {
    output += headers.join("\t") + "\n";
  }
  
  for (const conversation of conversations) {
    const row = args.extended
      ? [
          conversation.id || "",
          args.noTruncate ? (conversation.title || "") : truncate(conversation.title || "", 30),
          conversation.status || "",
          conversation.category || "",
          args.noRelativeDates ? conversation.createdAt : formatRelativeDate(conversation.createdAt),
          args.noRelativeDates ? conversation.updatedAt : formatRelativeDate(conversation.updatedAt)
        ]
      : [
          conversation.id || "", 
          args.noTruncate ? (conversation.title || "") : truncate(conversation.title || "", 50),
          conversation.status || ""
        ];
    
    output += row.join("\t") + "\n";
  }
  
  return output.trim();
}

function formatAsYaml(conversations: any[]): string {
  let output = "";
  for (const conversation of conversations) {
    output += `- id: ${conversation.id}\n`;
    output += `  title: ${conversation.title}\n`;
    if (conversation.status) {
      output += `  status: ${conversation.status}\n`;
    }
    if (conversation.category) {
      output += `  category: ${conversation.category}\n`;
    }
    if (conversation.createdAt) {
      output += `  createdAt: ${conversation.createdAt}\n`;
    }
    if (conversation.updatedAt) {
      output += `  updatedAt: ${conversation.updatedAt}\n`;
    }
    output += "\n";
  }
  return output.trim();
}

function formatAsDelimited(conversations: any[], format: "csv" | "tsv", separator?: "," | ";"): string {
  const delimiter = format === "tsv" ? "\t" : (separator || ",");
  const headers = ["ID", "TITLE", "STATUS", "CATEGORY", "CREATED", "UPDATED"];
  
  let output = headers.join(delimiter) + "\n";
  
  for (const conversation of conversations) {
    const row = [
      conversation.id || "",
      conversation.title || "",
      conversation.status || "",
      conversation.category || "",
      conversation.createdAt || "",
      conversation.updatedAt || ""
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