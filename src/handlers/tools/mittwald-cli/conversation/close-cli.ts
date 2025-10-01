import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationCloseArgs {
  conversationId: string;
}

export const handleConversationCloseCli: MittwaldCliToolHandler<MittwaldConversationCloseArgs> = async (args) => {
  try {
    const { conversationId } = args;
    
    // Build CLI command arguments
    const cliArgs: string[] = ['conversation', 'close', conversationId];
    
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
      
      if (errorMessage.includes('already closed')) {
        return formatToolResponse(
          "success",
          `Conversation ${conversationId} is already closed`,
          {
            conversationId: conversationId,
            status: 'already_closed'
          }
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to close conversation: ${errorMessage}`
      );
    }
    
    // Try to parse JSON output if available
    try {
      const data = parseJsonOutput(result.stdout);
      
      return formatToolResponse(
        "success",
        `Conversation closed successfully: ${conversationId}`,
        {
          conversationId: conversationId,
          status: 'closed',
          ...data
        }
      );
      
    } catch (parseError) {
      // If JSON parsing fails, check for successful closure indicators in the output
      if (result.stdout.toLowerCase().includes('closed') || result.stdout.toLowerCase().includes('success')) {
        return formatToolResponse(
          "success",
          `Conversation closed successfully: ${conversationId}`,
          {
            conversationId: conversationId,
            status: 'closed',
            rawOutput: result.stdout
          }
        );
      }
      
      return formatToolResponse(
        "success",
        `Close operation completed for conversation: ${conversationId}`,
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
