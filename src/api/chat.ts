import { CoreMessage } from "ai";
import { api } from "./client";
// AI SDK compatible Message type
export interface AiSdkMessage {
  id: string;
  content: CoreMessage[];
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
}

// Conversation type
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Load chat messages for a specific conversation
 * @param chatId - The UUID of the conversation to load
 * @returns A promise resolving to the chat messages
 */
export async function loadChatMessages(chatId: string) {
  const res = await api.api.chat.conversations[":id"].messages.$get({
    param: { id: chatId },
  });

  if (!res.ok) {
    let errorMessage = "Failed to load chat messages";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const messages = await res.json();
  return messages.messages;
}

/**
 * Load recent conversations for the current user
 * @returns A promise resolving to the list of conversations
 */
export async function loadRecentChats(): Promise<Conversation[]> {
  const res = await api.api.chat.conversations.$get();

  if (!res.ok) {
    let errorMessage = "Failed to load recent chats";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.conversations.map((conv) => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
  }));
}

/**
 * Create a new conversation
 * @param title - Optional title for the conversation
 * @returns A promise resolving to the new conversation ID
 */
export async function createNewChat(title?: string): Promise<string> {
  const res = await api.api.chat.conversations.$post({
    json: { title },
  });

  if (!res.ok) {
    let errorMessage = "Failed to create new chat";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.conversationId;
}

/**
 * Update conversation title
 * @param conversationId - The conversation ID to update
 * @param title - The new title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const res = await api.api.chat.conversations[":id"].$put({
    param: { id: conversationId },
    json: { title },
  });

  if (!res.ok) {
    let errorMessage = "Failed to update conversation title";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Delete a conversation
 * @param conversationId - The conversation ID to delete
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const res = await api.api.chat.conversations[":id"].$delete({
    param: { id: conversationId },
  });

  if (!res.ok) {
    let errorMessage = "Failed to delete conversation";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Get messages for a specific conversation
 * @param conversationId - The conversation ID
 * @returns A promise resolving to the conversation messages
 */
export async function getConversationMessages(conversationId: string) {
  const res = await api.api.chat.conversations[":id"].messages.$get({
    param: { id: conversationId },
  });

  if (!res.ok) {
    let errorMessage = "Failed to get conversation messages";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.messages;
}
