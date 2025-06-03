import { useState, useRef } from "react";
import { useThreadRuntime } from "@assistant-ui/react";
import { generateSpeech } from "../../../api/speech/speech";

type TextContentPart = { type: "text"; text: string };

export const useTextToSpeech = () => {
  const runtime = useThreadRuntime();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Function to stop audio playback
  const stopAudioPlayback = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        console.warn("Error stopping audio source:", e);
      }
      currentAudioSourceRef.current.disconnect();
      currentAudioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  // Core function to fetch and play audio for given text
  const playAudioForText = async (text: string) => {
    if (!text) {
      console.warn("TTS hook: playAudioForText called with empty text.");
      return;
    }

    stopAudioPlayback();

    console.log(
      "TTS hook: Attempting to play audio for text:",
      text.substring(0, 100) + "..."
    );

    try {
      const arrayBuffer = await generateSpeech(text);

      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        // Re-initialize AudioContext if needed (e.g., after being closed)
        console.log("TTS hook: Initializing or re-initializing AudioContext.");
        audioContextRef.current = new window.AudioContext();
      }
      const context = audioContextRef.current;

      // Decode audio data
      const buffer = await context.decodeAudioData(arrayBuffer);

      // Ensure context is still valid before proceeding (might have closed during decode)
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        console.warn(
          "TTS hook: AudioContext closed before playback could start."
        );
        setIsPlayingAudio(false); // Ensure state is correct
        return;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => {
        console.log("TTS hook: Audio playback finished");
        // Check ref before calling stop, as it might be nullified by a rapid stop call
        if (currentAudioSourceRef.current === source) {
          stopAudioPlayback();
        }
      };
      source.start(0);
      currentAudioSourceRef.current = source;
      setIsPlayingAudio(true);
      console.log("TTS hook: Audio playback started");
    } catch (error) {
      console.error("TTS hook: Error in playAudioForText:", error);
      setIsPlayingAudio(false); // Ensure state is correct on error
      // Optionally close context on error? Depends on desired behavior.
      // if (audioContextRef.current) {
      //   audioContextRef.current.close().catch(e => console.warn("Error closing context after error:", e));
      //   audioContextRef.current = null;
      // }
    }
  };

  const handleRunEnd = () => {
    console.log("TTS hook: run-end event triggered");
    // Don't call stopAudioPlayback here, playAudioForText will handle it.

    const currentState = runtime.getState();
    const currentMessages = currentState.messages || [];
    const lastMessage = currentMessages[currentMessages.length - 1];

    if (lastMessage?.role === "assistant" && lastMessage.content.length > 0) {
      const textContent = lastMessage.content
        .filter(
          (c): c is TextContentPart =>
            c.type === "text" && typeof (c as any)?.text === "string"
        )
        .map((c) => c.text)
        .join("\n");

      if (textContent) {
        console.log(
          "TTS hook: Assistant message text:",
          textContent.substring(0, 100) + "..."
        );
        // Call the extracted function to handle playback
        playAudioForText(textContent);
      } else {
        console.log(
          "TTS hook: No text content found in the last assistant message."
        );
      }
    } else {
      console.log(
        "TTS hook: Last message not from assistant or has no content."
      );
    }
  };

  // // Plays the audio when message is received
  // useEffect(() => {
  //   // Subscribe directly when the hook mounts or runtime changes
  //   const cleanupSubscription = runtime.unstable_on("run-end", handleRunEnd);

  //   // Cleanup function for the effect
  //   return () => {
  //     cleanupSubscription(); // Unsubscribe from the event
  //     stopAudioPlayback(); // Stop audio if component unmounts
  //     // Close the audio context on unmount
  //     if (audioContextRef.current) {
  //       audioContextRef.current
  //         .close()
  //         .catch((e) =>
  //           console.warn("TTS hook: Error closing AudioContext:", e)
  //         );
  //       audioContextRef.current = null;
  //     }
  //   };
  // }, [runtime]); // Re-run effect if runtime changes

  // Return the state and control functions
  return { isPlayingAudio, stopAudioPlayback, playAudioForText, handleRunEnd };
};
