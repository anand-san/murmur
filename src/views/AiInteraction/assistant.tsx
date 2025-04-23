import { useThreadRuntime } from "@assistant-ui/react"; // Import AssistantRuntime type
import { Thread } from "./components/assistant-ui/thread";
import { ThreadList } from "./components/assistant-ui/thread-list";
import { MutableRefObject, useEffect, useState, useRef } from "react"; // Import useRef
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from "../../components/ui/sidebar";
import { MessagesSquare } from "lucide-react";
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
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-dvh w-full">
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between">
            <h2 className="text-md font-semibold px-2">Vaiced</h2>
          </SidebarHeader>
          <SidebarContent>
            <ThreadList />
          </SidebarContent>
        </Sidebar>
        <div className="absolute mt-6 ml-2 left-0 top-0 flex items-center">
          <SidebarTrigger className="mr-2 text-white">
            <MessagesSquare className="h-5 w-5" />
          </SidebarTrigger>
        </div>
        <div className="flex-1 w-full h-full px-4 pt-4">
          {/* Pass down audio state and control function */}
          <Thread
            recorderState={recorderState}
            isPlayingAudio={isPlayingAudio}
            stopAudioPlayback={stopAudioPlayback}
            playAudioForText={playAudioForText} // Pass down the new function
          />
        </div>
      </div>
    </SidebarProvider>
  );
};
