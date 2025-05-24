import React, { createContext, useContext, useState, useCallback } from "react";
import { loadRecentChats, Conversation } from "../api/chat";

interface ConversationContextType {
  conversations: Conversation[];
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
  addConversation: (conversation: Conversation) => void;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedConversations = await loadRecentChats();
      setConversations(loadedConversations);
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => [conversation, ...prev]);
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        isLoading,
        refreshConversations,
        addConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within ConversationProvider"
    );
  }
  return context;
}
