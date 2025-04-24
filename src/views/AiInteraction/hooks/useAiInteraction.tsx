import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { getCurrentWindow, CloseRequestedEvent } from "@tauri-apps/api/window";
import { useRef, useEffect, useState } from "react";
import { useTranscription } from "./useTranscription";
import { useClipboardPaste } from "./useClipboard";

// Interface for the audio data payload from backend
interface AudioDataPayload {
  data: number[];
  isClipboardMode: boolean;
}

export type RecorderState = "idle" | "recording" | "transcribing";

export type SendMessageFn = (text: string) => void;
export type SetTranscriptionStatusFn = (isTranscribing: RecorderState) => void;

export default function useAiInteraction() {
  const unlistenStateRef = useRef<UnlistenFn | null>(null); // Ref for state listener
  const unlistenAudioDataRef = useRef<UnlistenFn | null>(null); // Ref for audio data listener
  const sendMessageRef = useRef<SendMessageFn | null>(null);
  const setTranscriptionStatusRef = useRef<SetTranscriptionStatusFn | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<"normal" | "clipboard" | null>(
    null
  );

  // Use the React Query hooks
  const transcriptionMutation = useTranscription();
  const clipboardPasteMutation = useClipboardPaste();

  // Triggered when backend sends the audio data
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const setupAudioDataListener = async () => {
      unlistenAudioDataRef.current = await listen<AudioDataPayload>(
        "audio_data_available",
        async (event) => {
          // Extract the data and metadata early so it's available in both try and catch blocks
          const isClipboardMode = event.payload.isClipboardMode || false;

          try {
            // Update the current mode
            setCurrentMode(isClipboardMode ? "clipboard" : "normal");

            // Convert the array to Uint8Array
            const wavData = new Uint8Array(event.payload.data || event.payload);

            // Create a Blob and File object from the audio data
            const wavBlob = new Blob([wavData], { type: "audio/wav" });
            const wavFile = new File([wavBlob], "recording.wav", {
              type: "audio/wav",
            });

            // Only update UI status for normal mode, not clipboard mode
            if (!isClipboardMode && setTranscriptionStatusRef.current) {
              setTranscriptionStatusRef.current("transcribing");
            }

            // Send to transcription API using the mutation
            try {
              const transcriptionText = await transcriptionMutation.mutateAsync(
                wavFile
              );
              if (!("text" in transcriptionText)) {
              } else {
                if (isClipboardMode) {
                  // Clipboard mode - call backend to handle paste operation
                  try {
                    await clipboardPasteMutation.mutateAsync(
                      transcriptionText.text
                    );
                  } catch (error) {
                    setErrorMessage(
                      `Clipboard operation failed: ${
                        error instanceof Error ? error.message : String(error)
                      }`
                    );
                  }
                } else {
                  if (sendMessageRef.current && transcriptionText) {
                    appWindow.setFocus();
                    sendMessageRef.current(transcriptionText.text);
                  }
                }
              }
              // Process based on mode
            } catch (error) {
              setErrorMessage(
                `Transcription failed: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
            } finally {
              // Reset transcription status (only for normal mode)
              if (!isClipboardMode && setTranscriptionStatusRef.current) {
                setTranscriptionStatusRef.current("idle");
              }
              // Always reset the current mode when done
              setCurrentMode(null);
            }
          } catch (error) {
            console.error("Error processing audio data:", error);
            setErrorMessage(
              `Error processing audio: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
            // Reset transcription status on error (only for normal mode)
            if (!isClipboardMode && setTranscriptionStatusRef.current) {
              setTranscriptionStatusRef.current("idle");
            }
            // Always reset the current mode when done
            setCurrentMode(null);
          }
        }
      );
    };

    setupAudioDataListener();

    return () => {
      if (unlistenAudioDataRef.current) {
        unlistenAudioDataRef.current();
        unlistenAudioDataRef.current = null;
      }
    };
  }, []);

  // Triggered when the state of the recorder changes
  useEffect(() => {
    const setupStateListener = async () => {
      unlistenStateRef.current = await listen<RecorderState>(
        "state_changed",
        (event) => {
          if (setTranscriptionStatusRef.current) {
            setTranscriptionStatusRef.current(event.payload);
          }
        }
      );
    };

    setupStateListener();

    return () => {
      if (unlistenStateRef.current) {
        unlistenStateRef.current();
        unlistenStateRef.current = null;
      }
    };
  }, []);

  // Triggered when user closes the window manually
  // We prevent window close and just hide it so that user can use the shortcut next time
  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlistenClose: (() => void) | null = null;

    const setupCloseListener = async () => {
      unlistenClose = await appWindow.onCloseRequested(
        async (event: CloseRequestedEvent) => {
          console.log(
            "Close requested for AI Interaction window, hiding instead."
          );
          event.preventDefault();
          await appWindow.hide();
        }
      );
    };

    setupCloseListener();

    return () => {
      if (unlistenClose) {
        console.log(
          "Cleaning up close request listener for AI Interaction window."
        );
        unlistenClose();
      }
    };
  }, []);

  return {
    sendMessageRef,
    setTranscriptionStatusRef,
    errorMessage,
    // Only show transcription UI indicator for normal mode operations
    isTranscribing:
      (currentMode === "normal" || currentMode === null) &&
      transcriptionMutation.isPending,
  };
}
