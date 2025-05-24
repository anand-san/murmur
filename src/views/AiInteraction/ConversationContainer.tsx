import {
  ThreadMessageLike,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Assistant } from "./assistant";
import {
  SendMessageFn,
  SetTranscriptionStatusFn,
} from "./hooks/useAiInteraction";
import { API_BASE } from "./utils/constants";

export const ConversationContainer: React.FC<{
  chatId: string | undefined;
  effectiveConversationId: string;
  selectedModelId: string;
  initialMessages: ThreadMessageLike[] | undefined;
  isNewChat: boolean;
  sendMessageRef: React.MutableRefObject<SendMessageFn | null>;
  setTranscriptionStatusRef: React.MutableRefObject<SetTranscriptionStatusFn | null>;
  refreshConversations: () => Promise<void>;
  navigate: (path: string, options?: any) => void;
}> = ({
  effectiveConversationId,
  selectedModelId,
  initialMessages,
  isNewChat,
  sendMessageRef,
  setTranscriptionStatusRef,
  refreshConversations,
  navigate,
}) => {
  const CHAT_API_URL = `${API_BASE}/api/chat`;

  const chat = useChatRuntime({
    api: CHAT_API_URL,
    body: {
      conversationId: effectiveConversationId,
      modelId: selectedModelId,
    },
    credentials: "include",
    initialMessages,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
    onFinish: async (message) => {
      console.log("Message finished:", message);

      if (isNewChat) {
        try {
          await refreshConversations();
          navigate(`/chat/${effectiveConversationId}`, { replace: true });
        } catch (error) {
          console.error("Failed to refresh conversations:", error);
          navigate(`/chat/${effectiveConversationId}`, { replace: true });
        }
      }
    },
  });

  return (
    <AssistantRuntimeProvider runtime={chat}>
      <Assistant
        sendMessageRef={sendMessageRef}
        setTranscriptionStatusRef={setTranscriptionStatusRef}
      />
    </AssistantRuntimeProvider>
  );
};
