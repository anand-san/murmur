import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateId } from "ai";

import { useModelSelection } from "./context/ModelSelectionContext";
import useAiInteraction from "./hooks/useAiInteraction";
import { ThreadMessageLike } from "@assistant-ui/react";
import { loadChatMessages } from "../../api/chat";
import {
  transformBackendMessages,
  validateBackendMessages,
} from "./utils/messageTransform";
import { useConversations } from "../../contexts/ConversationContext";
import { toast } from "react-hot-toast";
import { ConversationContainer } from "./ConversationContainer";
import MurmurLoader from "@/components/ui/MurmurLoader";

const AiInteractionWindow: React.FC = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sendMessageRef, setTranscriptionStatusRef, errorMessage } =
    useAiInteraction();

  if (errorMessage) {
    toast.error(errorMessage, {
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  }
  const { selectedModelId } = useModelSelection();
  const { refreshConversations } = useConversations();
  const [initialMessages, setInitialMessages] = useState<
    ThreadMessageLike[] | undefined
  >(undefined);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const isNewChat = !chatId;

  const effectiveConversationId = useMemo(() => {
    return isNewChat ? generateId() : chatId;
  }, [isNewChat, chatId]);

  useEffect(() => {
    setIsLoadingMessages(true);
    setInitialMessages(undefined);

    if (chatId) {
      loadChatMessages(chatId)
        .then((backendMessages) => {
          const validatedMessages = validateBackendMessages(backendMessages);
          const threadMessages = transformBackendMessages(validatedMessages);
          setInitialMessages(threadMessages);
        })
        .catch((error) => {
          console.error("Failed to load chat messages:", error);
          toast.error("Failed to load chat messages");
        })
        .finally(() => setIsLoadingMessages(false));
    } else {
      setInitialMessages(undefined);
      setIsLoadingMessages(false);
    }
  }, [chatId]);

  if (isLoadingMessages) {
    return <MurmurLoader />;
  }

  const chatKey = `chat-${chatId || "new"}-${effectiveConversationId}`;

  return (
    <ConversationContainer
      key={chatKey}
      chatId={chatId}
      effectiveConversationId={effectiveConversationId}
      selectedModelId={selectedModelId}
      initialMessages={chatId ? initialMessages : undefined}
      isNewChat={isNewChat}
      sendMessageRef={sendMessageRef}
      setTranscriptionStatusRef={setTranscriptionStatusRef}
      refreshConversations={refreshConversations}
      navigate={navigate}
    />
  );
};

// Separate wrapper component that gets completely remounted for each chat

export default AiInteractionWindow;
