import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export async function handleConversation() {
  return formatToolResponse(
    "success",
    "The conversation command is a parent command for managing support cases. Please use one of the subcommands: categories, close, create, list, reply, or show."
  );
}