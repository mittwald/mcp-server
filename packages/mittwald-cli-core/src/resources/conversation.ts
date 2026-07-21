/**
 * Support conversation operations
 */

import { executeApiCall } from './execute-api-call.js';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListConversationsOptions extends LibraryFunctionBase {}

export async function listConversations(options: ListConversationsOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.listConversations({}));
}

export interface GetConversationOptions extends LibraryFunctionBase {
  conversationId: string;
}

export async function getConversation(options: GetConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.getConversation({ conversationId: options.conversationId }));
}

export interface CreateConversationOptions extends LibraryFunctionBase {
  title: string;
  categoryId: string;
}

export async function createConversation(options: CreateConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.conversation.createConversation({
        data: { title: options.title, categoryId: options.categoryId },
      }),
    201
  );
}

export interface ReplyToConversationOptions extends LibraryFunctionBase {
  conversationId: string;
  message: string;
}

export async function replyToConversation(options: ReplyToConversationOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) =>
      client.conversation.createMessage({
        conversationId: options.conversationId,
        data: { messageContent: options.message },
      }),
    201
  );
}

export interface CloseConversationOptions extends LibraryFunctionBase {
  conversationId: string;
}

export async function closeConversation(options: CloseConversationOptions): Promise<LibraryResult<void>> {
  // Note: updateConversation does not have a status field in the API
  // Status changes may require a different API endpoint
  throw new LibraryError('closeConversation not implemented - updateConversation does not support status field', 501);
}

export interface ListConversationCategoriesOptions extends LibraryFunctionBase {}

export async function listConversationCategories(options: ListConversationCategoriesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.conversation.listCategories());
}
