import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { MittwaldClient } from "../../services/mittwald/index.js";

// Context passed to Mittwald tool handlers
export interface MittwaldToolHandlerContext {
  mittwaldClient: MittwaldClient;
  userId?: string;
  sessionId?: string;
  progressToken?: string | number;
  projectContext?: {
    projectId?: string;
  };
  appContext?: {
    installationId?: string;
  };
  orgContext?: {
    orgId?: string;
  };
}

export type MittwaldToolHandler<T = any> = (
  args: T,
  context: MittwaldToolHandlerContext,
) => Promise<CallToolResult>;

// CLI wrapper handler that doesn't need context
export type MittwaldCliToolHandler<T = any> = (
  args: T,
) => Promise<CallToolResult>;

// Conversation API Types
export interface ConversationListArgs {
  sort?: Array<"createdAt" | "lastMessage.createdAt" | "title" | "priority" | "shortId" | "conversationId">;
  order?: Array<"asc" | "desc">;
}

export interface ConversationCreateArgs {
  categoryId: string;
  mainUserId: string;
  notificationRoles: NotificationRole[];
  relatedTo: RelatedAggregateReference;
  sharedWith: ShareableAggregateReference;
  title: string;
}

export interface ConversationGetArgs {
  conversationId: string;
}

export interface ConversationUpdateArgs {
  conversationId: string;
  categoryId?: string;
  relatedTo?: RelatedAggregateReference;
  title?: string;
}

export interface ConversationMessageListArgs {
  conversationId: string;
}

export interface ConversationMessageCreateArgs {
  conversationId: string;
  fileIds?: string[];
  messageContent: string;
}

export interface ConversationMessageUpdateArgs {
  conversationId: string;
  messageId: string;
  messageContent: string;
}

export interface ConversationMembersGetArgs {
  conversationId: string;
}

export interface ConversationStatusSetArgs {
  conversationId: string;
  status: "open" | "answered" | "closed";
}

export interface ConversationFileUploadRequestArgs {
  conversationId: string;
}

export interface ConversationFileAccessTokenArgs {
  conversationId: string;
  fileId: string;
}

// Supporting Types
export interface NotificationRole {
  // Define based on API schema - placeholder for now
  [key: string]: any;
}

export interface RelatedAggregateReference {
  // Define based on API schema - placeholder for now
  [key: string]: any;
}

export interface ShareableAggregateReference {
  // Define based on API schema - placeholder for now
  [key: string]: any;
}

export interface MittwaldError extends Error {
  type: string;
  status?: number;
  code?: string;
}

export interface MittwaldToolResponse<T = any> {
  status: "success" | "error";
  message: string;
  result?: T;
  error?: {
    type: string;
    details?: any;
  };
}

// Helper function to format Mittwald tool responses
export function formatMittwaldToolResponse<T>(
  response: Partial<MittwaldToolResponse<T>> & Pick<MittwaldToolResponse<T>, "message">,
): CallToolResult {
  const standardResponse: MittwaldToolResponse<T> = {
    status: response.status || "success",
    message: response.message,
    ...(response.result && { result: response.result }),
    ...(response.error && { error: response.error }),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(standardResponse, null, 2),
      },
    ],
  };
}