import React from "react";

import { ModelSelectionProvider } from "./context/ModelSelectionContext"; // Keep the provider
import { Assistant } from "./assistant";
import useAiInteraction from "./hooks/useAiInteraction";

const AiInteractionWindow: React.FC = () => {
  const { sendMessageRef, setTranscriptionStatusRef } = useAiInteraction();

  return (
    <div className="flex flex-col h-full text-foreground">
      <Assistant
        sendMessageRef={sendMessageRef}
        setTranscriptionStatusRef={setTranscriptionStatusRef}
      />
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
