import { useThreadRuntime } from "@assistant-ui/react";
import { Thread } from "./components/assistant-ui/thread";
import { ThreadList } from "./components/assistant-ui/thread-list";
import { MutableRefObject, useEffect, useState } from "react";
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

interface AssistantProps {
  sendMessageRef: MutableRefObject<SendMessageFn | null>;
  setTranscriptionStatusRef: MutableRefObject<SetTranscriptionStatusFn | null>;
}

export const Assistant = ({
  sendMessageRef,
  setTranscriptionStatusRef,
}: AssistantProps) => {
  const { append } = useThreadRuntime();

  const [recorderState, setRecorderState] = useState<RecorderState>("idle");

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
          <Thread recorderState={recorderState} />
        </div>
      </div>
    </SidebarProvider>
  );
};
