import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  getCurrentWindow,
  type CloseRequestedEvent,
} from "@tauri-apps/api/window"; // Import CloseRequestedEvent
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Loader2, SendIcon } from "lucide-react";

interface TranscriptionPayload {
  text: string;
}

const AiInteractionWindow: React.FC = () => {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    // Listen for the transcription data passed when the window is created
    const setupListener = async () => {
      unlistenRef.current = await listen<TranscriptionPayload>(
        "trigger_ai_interaction",
        (event) => {
          console.log("Received trigger_ai_interaction event:", event.payload);
          // setAiResponse(null); // Clear previous response
          // setError(null); // Clear previous error
          // setIsLoading(false); // Ensure loading is off initially
          // Optional: Bring window to front if needed
          appWindow.setFocus();
          if (inputRef.current) {
            inputRef.current.value = event.payload.text; // Set input value from event
          }
          handleSend(event.payload.text); // Automatically send the transcription to AI
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

  const handleManualSend = useCallback(async () => {
    console.log("Manual send triggered with input:", inputRef.current?.value);
    if (!inputRef?.current?.value || inputRef.current?.value.trim() === "") {
      setError("Input text cannot be empty.");
      return;
    }
    const textToSend = inputRef.current.value;
    handleSend(textToSend);
    // Clear input after manual send is initiated
    // inputRef.current.value = ""; // Clearing is now handled within handleSend on success
  }, []); // Added handleSend dependency

  const handleSend = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: string = await invoke("get_ai_response", {
        transcription: text,
      });
      setAiResponse(response);
      // Clear input field on successful send
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error getting AI response:", err);
      setError(typeof err === "string" ? err : "Failed to get AI response.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full mt-4 p-4 bg-background text-foreground">
      <ScrollArea className="flex-grow mb-4 p-2">
        {aiResponse && <p className="whitespace-pre-wrap">{aiResponse}</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!aiResponse && !isLoading && !error && (
          <p className="text-muted-foreground">
            Your response will appear here.
          </p>
        )}
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Your transcribed text..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button
          onClick={handleManualSend}
          disabled={isLoading} // Disable only when loading, allow sending empty if desired (or add trim check back if needed)
          // Or keep the trim check: disabled={isLoading || !inputRef.current?.value?.trim()}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <SendIcon />}
        </Button>
      </div>
    </div>
  );
};

export default AiInteractionWindow;
