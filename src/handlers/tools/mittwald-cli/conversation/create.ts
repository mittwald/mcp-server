import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import * as fs from 'fs';

interface ConversationCreateArgs {
  title: string;
  message?: string;
  messageFrom?: string;
  category?: string;
  editor?: string;
}

export const handleConversationCreate: MittwaldToolHandler<ConversationCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { title, category = "general" } = args;
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
    
    // First, let's get the category ID if a category name was provided
    let categoryId = category;
    if (category && category !== "general") {
      try {
        const categoriesResult = await mittwaldClient.conversation.listCategories();
        if (categoriesResult.data && Array.isArray(categoriesResult.data)) {
          const foundCategory = categoriesResult.data.find((cat: any) => 
            cat.name?.toLowerCase() === category.toLowerCase()
          );
          if (foundCategory) {
            categoryId = (foundCategory as any).categoryId;
          }
        }
      } catch (error) {
        // Continue with the original category value if lookup fails
      }
    }
    
    // Create the conversation using the API
    const result = await mittwaldClient.conversation.createConversation({
      data: {
        title: title,
        categoryId: categoryId
      }
    });
    
    if (!result.data || result.status !== 201) {
      return formatToolResponse(
        "error",
        "Failed to create conversation"
      );
    }
    
    const conversationId = result.data.conversationId;
    
    // Add the initial message to the conversation
    const messageResult = await mittwaldClient.conversation.createMessage({
      conversationId: conversationId,
      data: {
        messageContent: message
      }
    });
    
    if (messageResult.status !== 201) {
      return formatToolResponse(
        "error",
        `Conversation created but failed to add initial message. Conversation ID: ${conversationId}`
      );
    }
    
    return formatToolResponse(
      "success",
      `Conversation created successfully!`,
      { 
        conversationId, 
        title, 
        category: categoryId,
        messageAdded: true
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error creating conversation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};