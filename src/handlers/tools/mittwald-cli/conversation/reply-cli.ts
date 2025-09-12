import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationReplyArgs {
  conversationId: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
}

export const handleConversationReplyCli: MittwaldCliToolHandler<MittwaldConversationReplyArgs> = async (args) => {
  try {
    const { conversationId, message, messageFrom, editor } = args;
    
    // Build CLI command arguments
    const cliArgs: string[] = ['conversation', 'reply', conversationId];
    
    // Handle message options
    if (message) {
      cliArgs.push('--message', message);
    } else if (messageFrom) {
      if (messageFrom === '-') {
        return formatToolResponse(
          "error",
          "Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter."
        );
      }
      cliArgs.push('--message-from', messageFrom);
    } else {
      return formatToolResponse(
        "error",
        "No message provided. Please provide either a message or messageFrom parameter."
      );
    }
    
    // Optional editor
    if (editor) {
      cliArgs.push('--editor', editor);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('conversation')) {
        return formatToolResponse(
          "error",
          `Conversation not found with ID: ${conversationId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to reply to conversation: ${errorMessage}`
      );
    }
    
    // Try to parse JSON output if available
    try {
      const data = parseJsonOutput(result.stdout);
      
      return formatToolResponse(
        "success",
        `Reply sent to conversation: ${conversationId}`,
        {
          conversationId: conversationId,
          messageId: data.messageId || data.id,
          ...data
        }
      );
      
    } catch (parseError) {
      // If JSON parsing fails, check for successful reply indicators in the output
      if (result.stdout.toLowerCase().includes('sent') || result.stdout.toLowerCase().includes('success') || result.stdout.toLowerCase().includes('replied')) {
        return formatToolResponse(
          "success",
          `Reply sent to conversation: ${conversationId}`,
          {
            conversationId: conversationId,
            rawOutput: result.stdout
          }
        );
      }
      
      return formatToolResponse(
        "success",
        `Reply operation completed for conversation: ${conversationId}`,
        {
          conversationId: conversationId,
          rawOutput: result.stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        }
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
