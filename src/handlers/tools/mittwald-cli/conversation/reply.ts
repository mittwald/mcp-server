import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import * as fs from 'fs';

interface ConversationReplyArgs {
  conversationId?: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
}

export const handleConversationReply: MittwaldToolHandler<ConversationReplyArgs> = async (args, { mittwaldClient }) => {
  try {
    const conversationId = args.conversationId;
    
    if (!conversationId) {
      return formatToolResponse(
        "error",
        "No conversation ID provided and no default conversation set in context. Please provide a conversation ID."
      );
    }
    
    let message = args.message;
    
    // Handle message input options
    if (!message && args.messageFrom) {
      try {
        if (args.messageFrom === '-') {
          return formatToolResponse(
            "error",
            "Reading from stdin is not supported in the MCP context. Please provide the message directly using the --message parameter."
          );
        } else {
          message = fs.readFileSync(args.messageFrom, 'utf8');
        }
      } catch (error) {
        return formatToolResponse(
          "error",
          `Error reading message from file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    if (!message) {
      return formatToolResponse(
        "error",
        "No message provided. In the MCP context, please provide the message using the --message parameter or --message-from parameter with a file path."
      );
    }
    
    // Reply to the conversation using the API
    const result = await mittwaldClient.api.conversation.createMessage({
      conversationId: conversationId,
      data: {
        messageContent: message
      }
    });
    
    if (result.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to send reply to conversation ${conversationId}`
      );
    }
    
    return formatToolResponse(
      "success",
      `Reply sent successfully to conversation ${conversationId}.`,
      { 
        conversationId, 
        messageId: result.data?.messageId,
        message 
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error sending reply: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};