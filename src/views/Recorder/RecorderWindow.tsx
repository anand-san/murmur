import { useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { motion } from "framer-motion"; // Import motion
import { Button } from "../../components/ui/button";
import {
  IdleView,
  ProcessingView,
  // ResultsView, // Removed - integrating display here
  ErrorView,
} from "./components/Views";
import PulsingOrb from "./components/PulsingOrb"; // Import the new component
import { useAudioProcessingPipeline } from "./api";
import { CogIcon, XIcon, RotateCcwIcon } from "lucide-react"; // Add RotateCcwIcon
import { ScrollArea } from "../../components/ui/scroll-area"; // For scrollable chat
import { useChat } from "@ai-sdk/react"; // Import useChat
import { Input } from "../../components/ui/input"; // For chat input

/**
 * RecorderWindow Component
 *
 * Handles voice recording, transcription, and AI response generation using useChat.
 * Uses shadcn/ui components and Tailwind CSS for styling.
 */
const RecorderWindow = () => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  // REMOVED: Overall UI state (idle, processing audio, done/chatting, error)
  // const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  // State to hold the transcription result from the pipeline
  const [latestTranscription, setLatestTranscription] = useState<string | null>(
    null
  );
  // Ref to track if the current transcription has been appended
  const hasAppendedRef = useRef(false);
  // Ref for the element at the end of the messages list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook for initial audio processing (transcription)
  const {
    processAudio,
    error: processingError, // Renamed to avoid clash with chatError
    processingStatus, // Re-add status string for ProcessingView
    // transcription, // No longer needed from hook return
    // isSuccess: isTranscriptionSuccess, // No longer needed from hook return
    isLoading: isPipelineLoading, // Destructure loading state here
  } = useAudioProcessingPipeline();

  // Vercel AI SDK useChat hook for handling the conversation
  const {
    messages, // Array of chat messages from useChat
    input, // Current value of the input field
    handleInputChange, // Handler for input field changes
    handleSubmit, // Handler for form submission
    append, // Function to add messages programmatically
    isLoading: isChatLoading, // Renamed to avoid clash with other loading states
    error: chatError, // Error state from useChat
    stop, // Function to stop generation
    setMessages, // Function to manually set messages
  } = useChat({
    api: "http://localhost:3000/api/chat", // Changed port to 3000
    // initialMessages: [], // Start with empty messages, append initial transcription later
    // onError: (err) => { // Optional: Handle chat-specific errors
    //   console.error("Chat API error:", err);
    //   // Maybe set processingState to 'error' here as well?
    // }
    onError: (err) => {
      // Add explicit error logging for useChat
      console.error("useChat hook error:", err);
      // We'll rely on processingError or chatError directly in renderContent
    },
  });

  // Reset state to default
  const resetState = useCallback(() => {
    console.log("Resetting component state");
    hasAppendedRef.current = false; // Reset append tracker
    setIsRecording(false);
    setRecordingDuration(0);
    // REMOVED: setProcessingState("idle");
    setMessages([]); // Clear messages using useChat's setter
    setLatestTranscription(null); // Reset the stored transcription
  }, [setMessages]); // Dependency: useChat's setMessages (setLatestTranscription is stable)

  // Process audio when ready (Only handles the initial audio processing)
  const handleProcessAudio = useCallback(async () => {
    // Reset tracking refs and state before starting
    setLatestTranscription(null);
    hasAppendedRef.current = false; // Reset append tracker here too
    // REMOVED: setProcessingState("processing"); // Rely on isPipelineLoading from hook
    try {
      // Run the audio processing pipeline and get the result directly
      console.log("Awaiting processAudio()...");
      const result = await processAudio();
      console.log("processAudio() finished. Result:", result); // Log the result

      // Check specifically for a non-empty string transcription
      if (
        result?.transcription &&
        typeof result.transcription === "string" &&
        result.transcription.trim().length > 0
      ) {
        console.log(
          "handleProcessAudio received VALID transcription:",
          result.transcription
        );
        console.log("Setting latestTranscription...");
        setLatestTranscription(result.transcription); // Set the transcription state (triggers useEffect)
        console.log("Set latestTranscription in handleProcessAudio.");
      } else {
        // Log if transcription is missing or invalid
        console.error(
          "Transcription missing or invalid in processAudio result:",
          result
        );
        throw new Error(
          "Transcription missing or invalid in processAudio result"
        );
      }
      // Note: isPipelineLoading will become false, useEffect will trigger
    } catch (err) {
      // Log the specific error caught here
      console.error("Error caught in handleProcessAudio:", err);
      // Error state is handled by processingError from the hook
    }
  }, [processAudio]); // Removed setProcessingState dependency

  // Handle closing the recorder window
  const closeWindow = useCallback(async () => {
    try {
      resetState(); // Reset frontend state first
      await invoke("request_close_recorder"); // Ask backend to close/hide
      console.log("Requested backend to close recorder.");
    } catch (err) {
      console.error("Error requesting recorder close:", err);
    }
  }, [resetState]); // Dependency: resetState

  // Listen for recording events from Rust backend
  useEffect(() => {
    const unlistenPromise = listen<any>("recording-event", (event) => {
      console.log("Recording event:", event.payload);
      const { type } = event.payload;

      switch (type) {
        case "started":
          setIsRecording(true);
          setRecordingDuration(0);
          // REMOVED: setProcessingState("idle");
          // Don't clear messages automatically, rely on reset button
          // Clear transcription so previous one isn't used
          setLatestTranscription(null);
          break;
        case "stopped":
          setIsRecording(false);
          if (recordingDuration < 1) {
            console.log("Recording too short (< 1s), discarding and closing.");
            closeWindow();
          } else {
            console.log(
              "Recording duration sufficient, waiting for ready-to-fetch."
            );
            // Don't set processing state here, wait for ready-to-fetch
          }
          break;
        case "ready-to-fetch":
          // Only process if we were recording and duration was sufficient
          // Check isRecording is false and recordingDuration >= 1 (or rely on processingState not being idle)
          // Let's use a check that we are not recording and haven't started processing yet
          if (
            !isRecording &&
            !isPipelineLoading &&
            !latestTranscription &&
            recordingDuration >= 1
          ) {
            console.log("Ready to fetch audio data, initiating processing.");
            handleProcessAudio(); // Start the audio processing pipeline
          } else {
            console.log(
              `Ready-to-fetch received, but conditions not met. isRecording: ${isRecording}, isPipelineLoading: ${isPipelineLoading}, latestTranscription: ${!!latestTranscription}, duration: ${recordingDuration}. Ignoring.`
            );
          }
          break;
        default:
          console.warn("Unknown recording event type:", type);
      }
    });

    return () => {
      unlistenPromise.then((unlistenFn) => unlistenFn());
    };
    // Dependencies need careful review
  }, [
    recordingDuration, // Needed for the check in 'stopped'
    handleProcessAudio, // Needed for 'ready-to-fetch'
    resetState, // Indirectly used by closeWindow
    closeWindow, // Needed for 'stopped'
    // processingState, // Removed dependency
    isRecording, // Needed for check in 'ready-to-fetch'
    isPipelineLoading, // Added for check in 'ready-to-fetch'
    latestTranscription, // Added for check in 'ready-to-fetch'
    setMessages, // Needed for 'started'
    // setLatestTranscription is stable
  ]);

  // Effect to trigger the first chat message when transcription is ready
  // This now depends on the latestTranscription state variable
  useEffect(() => {
    // --- DEBUG LOGGING ---
    console.log("Checking transcription status effect:", {
      latestTranscription: latestTranscription
        ? `"${latestTranscription}" (length: ${latestTranscription.length})`
        : latestTranscription,
      messagesLength: messages.length,
      processingError: processingError?.message, // Still useful to log processing errors
    });
    // --- END DEBUG LOGGING ---

    // Only trigger if we have a new transcription AND haven't appended it yet
    if (latestTranscription && !hasAppendedRef.current) {
      console.log(
        "CONDITION MET: Attempting to append transcription message:",
        latestTranscription
      );
      // REMOVED: setProcessingState("done"); // No longer managing this state here

      try {
        // Append the message
        append({
          role: "user",
          content: latestTranscription, // Use the state variable
        });
        hasAppendedRef.current = true; // Mark as appended
        console.log("Transcription message appended via useChat.");
      } catch (appendError) {
        console.error("Error calling useChat append:", appendError);
        hasAppendedRef.current = false; // Reset if append failed? Or rely on overall error state? Let's reset for now.
        // Error state is handled by chatError or processingError
      }
    }
    // Removed error handling for processingError here, handled in renderContent
    // Dependencies: latestTranscription, append
  }, [
    latestTranscription, // Depend on the state variable holding the transcription
    append,
    // processingError, // Error is handled in renderContent
  ]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure scroll happens after DOM update
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll the marker into view
    }, 0); // Small delay to wait for render
  }, [messages]); // Dependency: messages array from useChat

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

  // Handle opening the main window (settings)
  const openSettings = useCallback(async () => {
    try {
      await invoke("show_window");
      console.log("Requested backend to show main window.");
    } catch (err) {
      console.error("Error requesting main window show:", err);
    }
  }, []);

  // --- Content Rendering Logic ---
  const renderContent = () => {
    // 1. Recording View
    if (isRecording) {
      return <PulsingOrb />;
    }

    // 2. Processing Audio View - Show only when pipeline is loading
    // Use isPipelineLoading and processingStatus from the top-level hook call
    if (isPipelineLoading) {
      return (
        <ProcessingView
          processingStatus={processingStatus || "Processing..."} // Use status from top-level call
        />
      );
    }

    // 3. Chat View - Show if NOT recording, NOT loading, and we HAVE a transcription (or existing messages)
    if (
      !isRecording &&
      !isPipelineLoading &&
      (latestTranscription || messages.length > 0)
    ) {
      // Check for errors first
      if (processingError || chatError) {
        const displayError =
          processingError?.message ||
          chatError?.message ||
          "An unknown error occurred";
        return <ErrorView error={displayError} />;
      }
      // Otherwise, show chat
      return (
        <div className="flex flex-col h-full">
          {/* Chat Messages Area - Remove ref from ScrollArea */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {/* Loading indicator while assistant responds */}
              {isChatLoading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted animate-pulse">
                      ...
                    </div>
                  </div>
                )}
              {/* Marker element at the end */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input Form */}
          <form onSubmit={handleSubmit} className="p-2 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a follow-up..."
                disabled={isChatLoading} // Disable input while chat is loading
              />
              <Button type="submit" disabled={isChatLoading || !input.trim()}>
                Send
              </Button>
              {/* Stop button */}
              {isChatLoading && (
                <Button type="button" variant="destructive" onClick={stop}>
                  Stop
                </Button>
              )}
            </div>
          </form>
        </div>
      );
    }

    // 4. Error View (handled within the condition above)

    // 5. Idle View (Default - if not recording, not loading, and no transcription/messages yet)
    return <IdleView />;
  };

  // --- Window Size Adjustment Logic ---
  const contentRef = useRef<HTMLDivElement>(null);

  const adjustWindowSize = useCallback(async () => {
    // Debounce or throttle this if it causes performance issues
    if (contentRef.current) {
      // Ensure calculation happens after rendering updates
      await new Promise((resolve) => setTimeout(resolve, 0)); // Small delay
      const height = contentRef.current.scrollHeight;
      const width = contentRef.current.scrollWidth;
      // Add min/max constraints if needed
      const clampedHeight = Math.max(150, Math.min(height, 600)); // Example constraints
      const clampedWidth = Math.max(300, Math.min(width, 500)); // Example constraints
      try {
        await getCurrentWindow().setSize(
          new LogicalSize(clampedWidth, clampedHeight)
        );
      } catch (e) {
        console.error("Failed to resize window:", e);
      }
    }
  }, []);

  // Adjust window size when relevant state changes
  useEffect(() => {
    adjustWindowSize();
    // Adjust when loading state changes OR when messages array length changes (indicating new message or reset)
  }, [isPipelineLoading, messages.length, adjustWindowSize]); // Use isPipelineLoading instead of processingState

  // --- Animation ---
  const windowVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  // --- Component Return ---
  return (
    <motion.div
      ref={contentRef}
      className="relative flex flex-col rounded-lg bg-card text-card-foreground shadow-none overflow-hidden min-h-[150px]" // Added min-h
      variants={windowVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Controls (Settings/Reset/Close) - Visible unless recording */}
      {!isRecording && (
        <div className="absolute top-1 left-1 z-10 flex items-center justify-end gap-1 p-1 bg-card/80 backdrop-blur-sm rounded-full">
          <div className="flex gap-1">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full hover:scale-110 transition-transform cursor-pointer"
              onClick={closeWindow}
              title="Close"
            >
              <XIcon className="h-4 w-4" />
            </Button>
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openSettings}
              className="h-4 w-4 rounded-full hover:scale-110 transition-transform cursor-pointer"
              title="Settings"
            >
              <CogIcon className="h-4 w-4" />
            </Button>
            {/* Reset Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={resetState} // Call resetState function
              className="h-4 w-4 rounded-full hover:scale-110 transition-transform cursor-pointer"
              title="Reset Chat"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {" "}
        {/* Ensure content area fills space */}
        {renderContent()}
      </div>
    </motion.div>
  );
};

export default RecorderWindow;
