import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ConversationShowArgs {
  conversationId?: string;
}

export const handleConversationShow: MittwaldToolHandler<ConversationShowArgs> = async (args, { mittwaldClient }) => {
  try {
    const conversationId = args.conversationId;
    
    if (!conversationId) {
      return formatToolResponse(
        "error",
        "No conversation ID provided and no default conversation set in context. Please provide a conversation ID."
      );
    }
    
    // Get conversation details and messages from the API
    const conversationResult = await mittwaldClient.conversation.getConversation({
      conversationId: conversationId
    });
    
    if (!conversationResult.data) {
      return formatToolResponse(
        "error",
        `Conversation not found: ${conversationId}`
      );
    }
    
    const conversation = conversationResult.data;
    
    const messagesResult = await mittwaldClient.conversation.listMessagesByConversation({
      conversationId: conversationId
    });
    
    const messages = messagesResult.data || [];
    
    // Format the output with conversation details and message history
    let output = `Conversation: ${conversation.title || 'Untitled'}\n`;
    output += `ID: ${conversation.conversationId}\n`;
    output += `Short ID: ${conversation.shortId || 'N/A'}\n`;
    output += `Status: ${conversation.status || 'N/A'}\n`;
    output += `Category: ${(conversation.category as any)?.name || 'N/A'}\n`;
    output += `Created: ${conversation.createdAt || 'N/A'}\n`;
    output += `Last Message: ${conversation.lastMessageAt || 'N/A'}\n`;
    output += `Visibility: ${conversation.visibility || 'N/A'}\n\n`;
    
    const messageArray = Array.isArray(messages) ? messages : [];
    if (messageArray.length > 0) {
      output += "Messages:\n";
      output += "=========\n\n";
      
      for (const message of messageArray) {
        output += `From: ${(message as any).createdBy?.displayName || 'Unknown'}\n`;
        output += `Date: ${(message as any).createdAt || 'N/A'}\n`;
        output += `Type: ${(message as any).type || 'MESSAGE'}\n`;
        if ((message as any).internal) {
          output += `Internal: Yes\n`;
        }
        output += `Message:\n${(message as any).messageContent || 'No content'}\n`;
        if ((message as any).files && (message as any).files.length > 0) {
          output += `Files: ${(message as any).files.length} attachment(s)\n`;
        }
        output += "---\n\n";
      }
    } else {
      output += "No messages found in this conversation.\n";
    }
    
    return formatToolResponse(
      "success",
      "Successfully retrieved conversation details",
      { 
        conversation,
        messages: messageArray,
        formattedOutput: output.trim()
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error fetching conversation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};