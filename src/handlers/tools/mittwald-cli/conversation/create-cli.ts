import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationCreateArgs {
  title: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
  category?: string;
}

export const handleConversationCreateCli: MittwaldToolHandler<MittwaldConversationCreateArgs> = async (args) => {
  try {
    const { title, message, messageFrom, editor, category } = args;
    
    // Build CLI command arguments
    const cliArgs: string[] = ['conversation', 'create'];
    
    // Required title
    cliArgs.push('--title', title);
    
    // Optional category
    if (category) {
      cliArgs.push('--category', category);
    }
    
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
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('category') && errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Category not found: ${category}. Use conversation categories command to list available categories.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create conversation: ${errorMessage}`
      );
    }
    
    // Try to parse JSON output if available, otherwise return success with raw output
    try {
      const data = parseJsonOutput(result.stdout);
      
      return formatToolResponse(
        "success",
        "Conversation created successfully",
        {
          conversationId: data.conversationId || data.id,
          title: title,
          category: category,
          ...data
        }
      );
      
    } catch (parseError) {
      // If JSON parsing fails, check for successful creation indicators in the output
      if (result.stdout.toLowerCase().includes('created') || result.stdout.toLowerCase().includes('success')) {
        return formatToolResponse(
          "success",
          "Conversation created successfully",
          {
            title: title,
            category: category,
            rawOutput: result.stdout
          }
        );
      }
      
      return formatToolResponse(
        "success",
        "Conversation creation completed (raw output)",
        {
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