import React, { useEffect, useState } from "react";

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
  const { sendMessageRef, setTranscriptionStatusRef, errorMessage } =
    useAiInteraction();
  const { selectedModelId } = useModelSelection();
  const CHAT_API_URL = `${API_BASE}/chat`;
  const [showError, setShowError] = useState(false);

  // Show error message when errorMessage changes
  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      // Hide error after 5 seconds
      const timeout = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

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
    <div className="flex flex-col h-full text-foreground relative">
      {/* Error notification */}
      {showError && errorMessage && (
        <div className="absolute top-2 right-2 left-2 bg-red-100/90 border text-red-700 px-4 py-3 rounded-lg z-50">
          <span className="block sm:inline">{errorMessage}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setShowError(false)}
          >
            <span className="text-red-500">×</span>
          </button>
        </div>
      )}

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
