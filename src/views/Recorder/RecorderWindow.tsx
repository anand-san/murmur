import { useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { Button } from "../../components/ui/button";
import {
  IdleView,
  RecordingView,
  ProcessingView,
  ResultsView,
  ErrorView,
} from "./components/Views";
import { useAudioProcessingPipeline } from "./api";
import { ProcessingState } from "./types";

/**
 * RecorderWindow Component
 *
 * Handles voice recording, transcription, and AI response generation.
 * Uses shadcn/ui components and Tailwind CSS for styling.
 * Uses TanStack Query for API operations.
 */
const RecorderWindow = () => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  // Use TanStack Query hooks for API operations
  const {
    processAudio,
    isLoading,
    error,
    processingStatus,
    audioUrl,
    transcription,
    chatCompletion,
  } = useAudioProcessingPipeline();

  // Reset state to default
  const resetState = useCallback(() => {
    console.log("Resetting component state");
    setIsRecording(false);
    setRecordingDuration(0);
    setProcessingState("idle");
  }, []);

  // Process audio when ready
  const handleProcessAudio = useCallback(async () => {
    try {
      setProcessingState("processing");

      // Run the audio processing pipeline
      const result = await processAudio();

      if (result) {
        setProcessingState("done");
      }
    } catch (err) {
      console.error("Error in audio processing:", err);
      setProcessingState("error");
    }
  }, [processAudio]);

  // Listen for recording events from Rust backend
  useEffect(() => {
    const unlistenPromise = listen<any>("recording-event", (event) => {
      console.log("Recording event:", event.payload);
      const { type } = event.payload;

      switch (type) {
        case "started":
          setIsRecording(true);
          setRecordingDuration(0);
          setProcessingState("idle");
          break;
        case "stopped":
          setIsRecording(false);
          if (recordingDuration < 1) {
            console.log("Recording too short, resetting.");
            resetState();
          } else {
            setProcessingState("processing");
          }
          break;
        case "ready-to-fetch":
          console.log("Ready to fetch audio data from backend");
          handleProcessAudio();
          break;
        default:
          console.warn("Unknown recording event type:", type);
      }
    });

    return () => {
      unlistenPromise.then((unlistenFn) => unlistenFn());
    };
  }, [recordingDuration, handleProcessAudio, resetState]);

  // Timer for recording duration
  useEffect(() => {
    let intervalId: number | null = null;
    if (isRecording) {
      intervalId = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording]);

  // Play the recorded audio
  const playRecording = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.error("Error playing audio:", err));
    }
  }, [audioUrl]);

  // Handle closing the recorder window
  const closeWindow = useCallback(async () => {
    try {
      resetState();
      await invoke("request_close_recorder");
      console.log("Requested backend to close recorder.");
    } catch (err) {
      console.error("Error requesting recorder close:", err);
    }
  }, [resetState]);

  // Handle opening the main window (settings)
  const openSettings = useCallback(async () => {
    try {
      await invoke("show_window");
      console.log("Requested backend to show main window.");
    } catch (err) {
      console.error("Error requesting main window show:", err);
    }
  }, []);

  // Render the appropriate view based on state
  const renderContent = () => {
    if (isRecording) {
      return <RecordingView recordingDuration={recordingDuration} />;
    }

    switch (processingState) {
      case "processing":
        return (
          <ProcessingView
            processingStatus={processingStatus || "Processing..."}
          />
        );
      case "done":
        return (
          <ResultsView
            chatCompletion={chatCompletion || null}
            transcription={transcription || null}
            audioUrl={audioUrl || null}
            playRecording={playRecording}
          />
        );
      case "error":
        return <ErrorView error={error ? error.message : "Unknown error"} />;
      case "idle":
      default:
        return <IdleView />;
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);

  // Adjust window size to fit content
  const adjustWindowSize = useCallback(async () => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      const width = contentRef.current.scrollWidth;
      await getCurrentWindow().setSize(new LogicalSize(width, height));
    }
  }, []);

  // Set up resize observer for content div
  useEffect(() => {
    const observer = new ResizeObserver(adjustWindowSize);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }
    return () => observer.disconnect();
  }, [adjustWindowSize]);

  // Adjust window size when view changes
  useEffect(() => {
    adjustWindowSize();
  }, [processingState, adjustWindowSize]);

  return (
    <div
      ref={contentRef}
      className="flex flex-col rounded-lg bg-card text-card-foreground shadow-none overflow-hidden"
    >
      {processingState !== "idle" && (
        <div className="flex items-center justify-between p-2 bg-muted/40">
          <div className="text-sm font-medium"></div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={openSettings}
              title="Settings"
            >
              <span className="sr-only">Settings</span>
              ⚙️
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={closeWindow}
              title="Close"
            >
              <span className="sr-only">Close</span>✕
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default RecorderWindow;
