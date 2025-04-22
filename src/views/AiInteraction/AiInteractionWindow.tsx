import React from "react";

import {
  ModelSelectionProvider,
  useModelSelection,
} from "./context/ModelSelectionContext"; // Keep the provider
import { Assistant } from "./assistant";
import useAiInteraction from "./hooks/useAiInteraction";
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { API_BASE } from "./utils/constants";

const AiInteractionWindow: React.FC = () => {
  const { sendMessageRef, setTranscriptionStatusRef } = useAiInteraction();
  const { selectedModelId } = useModelSelection();
  const CHAT_API_URL = `${API_BASE}/chat`;

  const chat = useChatRuntime({
    api: CHAT_API_URL,
    body: {
      modelId: selectedModelId,
    },
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  });
  return (
    <div className="flex flex-col h-full text-foreground">
      <AssistantRuntimeProvider runtime={chat}>
        <Assistant
          sendMessageRef={sendMessageRef}
          setTranscriptionStatusRef={setTranscriptionStatusRef}
        />
      </AssistantRuntimeProvider>
    </div>
  );
};

const AiInteractionWindowWithContext: React.FC = () => {
  return (
    <ModelSelectionProvider>
      <AiInteractionWindow />
    </ModelSelectionProvider>
  );
};
export default AiInteractionWindowWithContext;
