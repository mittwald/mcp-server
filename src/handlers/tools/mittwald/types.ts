import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { MittwaldClient } from "../../../services/mittwald/mittwald-client.js";
import type { MailErrorType } from "../../../types/mittwald/mail.js";

// Context passed to Mittwald tool handlers
export interface MittwaldToolHandlerContext {
  mittwaldClient: MittwaldClient;
  userId: string;
  sessionId?: string;
  progressToken?: string | number;
}

export type MittwaldToolHandler<T = any> = (
  args: T,
  context: MittwaldToolHandlerContext,
) => Promise<CallToolResult>;

// Standard response type for Mittwald tool handlers
export interface MittwaldToolResponse<T = any> {
  status: "success" | "error";
  message: string;
  result?: T;
  error?: {
    type: MailErrorType | string;
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