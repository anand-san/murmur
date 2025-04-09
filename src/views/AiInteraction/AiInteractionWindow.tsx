import React, { useEffect, useRef, MutableRefObject } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  getCurrentWindow,
  type CloseRequestedEvent,
} from "@tauri-apps/api/window";
import { Assistant } from "./assistant";
interface TranscriptionPayload {
  text: string;
}

// Function type for sending messages
type SendMessageFn = (text: string) => void;

const AiInteractionWindow: React.FC = () => {
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const sendMessageRef = useRef<SendMessageFn | null>(null);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    // Listen for the transcription data passed when the window is created
    const setupListener = async () => {
      unlistenRef.current = await listen<TranscriptionPayload>(
        "trigger_ai_interaction",
        (event) => {
          console.log("Received trigger_ai_interaction event:", event.payload);
          // Optional: Bring window to front if needed
          appWindow.setFocus();

          // Automatically send the message if text is provided
          if (sendMessageRef.current && event.payload.text) {
            sendMessageRef.current(event.payload.text);
          }
        }
      );
    };

    setupListener();

    // Cleanup listener on component unmount
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // Effect to handle window close requests
  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlistenClose: (() => void) | null = null;

    const setupCloseListener = async () => {
      unlistenClose = await appWindow.onCloseRequested(
        async (event: CloseRequestedEvent) => {
          console.log(
            "Close requested for AI Interaction window, hiding instead."
          );
          event.preventDefault(); // Prevent the window from closing
          await appWindow.hide(); // Hide the window (needs capability)
        }
      );
    };

    setupCloseListener();

    return () => {
      if (unlistenClose) {
        console.log(
          "Cleaning up close request listener for AI Interaction window."
        );
        unlistenClose(); // Important: Unlisten on component unmount
      }
    };
  }, []); // Empty dependency array ensures this runs once

  return (
    <div className="flex flex-col h-screen text-foreground">
      <Assistant sendMessageRef={sendMessageRef} />
    </div>
  );
};

export default AiInteractionWindow;
