import { useThreadRuntime } from "@assistant-ui/react"; // Import AssistantRuntime type
import { Thread } from "./components/assistant-ui/thread";
import { MutableRefObject, useEffect, useState } from "react"; // Import useRef
import {
  RecorderState,
  SendMessageFn,
  SetTranscriptionStatusFn,
} from "./hooks/useAiInteraction";
// Removed TTS API import, now handled by the hook
import { useTextToSpeech } from "./hooks/useTextToSpeech"; // Import the new hook

interface AssistantProps {
  sendMessageRef: MutableRefObject<SendMessageFn | null>;
  setTranscriptionStatusRef: MutableRefObject<SetTranscriptionStatusFn | null>;
}

export const Assistant = ({
  sendMessageRef,
  setTranscriptionStatusRef,
}: AssistantProps) => {
  const { append } = useThreadRuntime(); // Only need append here now
  // Get all returned values from the hook
  const { isPlayingAudio, stopAudioPlayback, playAudioForText } =
    useTextToSpeech();

  const [recorderState, setRecorderState] = useState<RecorderState>("idle");

  // TTS logic is now handled by useTextToSpeech hook

  useEffect(() => {
    if (sendMessageRef) {
      sendMessageRef.current = (text: string) => {
        append({
          role: "user",
          content: [
            {
              type: "text",
              text: text,
            },
          ],
        });
      };
    }

    return () => {
      if (sendMessageRef) {
        sendMessageRef.current = null;
      }
    };
  }, [append, sendMessageRef]);

  useEffect(() => {
    if (setTranscriptionStatusRef) {
      setTranscriptionStatusRef.current = (
        currentRecorderState: RecorderState
      ) => {
        setRecorderState(currentRecorderState);
      };
    }

    return () => {
      if (setTranscriptionStatusRef) {
        setTranscriptionStatusRef.current = null;
      }
    };
  }, [setTranscriptionStatusRef]);

  return (
    <div className="flex-1 w-full h-screen px-2 pt-2">
      <Thread
        recorderState={recorderState}
        isPlayingAudio={isPlayingAudio}
        stopAudioPlayback={stopAudioPlayback}
        playAudioForText={playAudioForText} // Pass down the new function
      />
    </div>
  );
};
