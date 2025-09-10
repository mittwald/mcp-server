import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationShowArgs {
  conversationId: string;
}

export const handleConversationShowCli: MittwaldCliToolHandler<MittwaldConversationShowArgs> = async (args) => {
  try {
    const { conversationId } = args;
    
    // Build CLI command arguments
    const cliArgs: string[] = ['conversation', 'show', conversationId];
    
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
        `Failed to show conversation: ${errorMessage}`
      );
    }
    
    // Try to parse JSON output if available
    try {
      const data = parseJsonOutput(result.stdout);
      
      return formatToolResponse(
        "success",
        `Retrieved conversation: ${conversationId}`,
        {
          conversationId: conversationId,
          ...data
        }
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output which might be formatted text
      return formatToolResponse(
        "success",
        `Conversation details for: ${conversationId}`,
        {
          conversationId: conversationId,
          content: result.stdout,
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
