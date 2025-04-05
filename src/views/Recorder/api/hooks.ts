// Removed useState import
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAudioData,
  transcribeAudio,
  // Removed streamChatCompletionFrontend import
  // We also don't need generateChatCompletion here anymore as chat is handled by useChat
} from "./service";

/**
 * Custom hook to fetch audio data
 */
export const useFetchAudioData = () => {
  return useMutation({
    mutationFn: fetchAudioData,
    onError: (error) => {
      console.error("Error fetching audio data:", error);
    },
  });
};

/**
 * Custom hook to transcribe audio
 */
export const useTranscribeAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transcribeAudio,
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["transcription"] });
    },
    onError: (error) => {
      console.error("Error transcribing audio:", error);
    },
  });
};

/**
 * Main hook for the audio processing pipeline
 * Handles the entire flow: fetch audio → transcribe → generate chat completion
 */
// This hook now ONLY handles fetching audio and transcribing it.
// The chat part is handled by useChat in the component.
export const useAudioProcessingPipeline = () => {
  const fetchAudioMutation = useFetchAudioData();
  const transcribeAudioMutation = useTranscribeAudio();
  // Removed chat-related state and mutations

  // Combined loading state for audio processing only
  const isLoading =
    fetchAudioMutation.isPending || transcribeAudioMutation.isPending;

  // Combined error state for audio processing only
  const error = fetchAudioMutation.error || transcribeAudioMutation.error;

  // Current processing status message for audio processing only
  const getProcessingStatus = () => {
    if (fetchAudioMutation.isPending) return "Getting audio data...";
    if (transcribeAudioMutation.isPending) return "Transcribing...";
    if (error) return `Error: ${error.message}`;
    // 'Done' status is now determined by transcription success in the component
    // We can indicate transcription success here.
    if (transcribeAudioMutation.isSuccess) return "Transcription Complete";
    return null;
  };

  // Start the audio processing pipeline (fetch and transcribe)
  const processAudio = async () => {
    try {
      console.log("Starting audio processing pipeline...");
      // Step 1: Fetch audio data
      const { audioBlob, audioUrl } = await fetchAudioMutation.mutateAsync();

      console.log("Fetched audio data.");
      // Step 2: Transcribe audio
      const transcription = await transcribeAudioMutation.mutateAsync(
        audioBlob
      );
      console.log("Transcribed audio:", transcription);

      // Return results needed by the component (URL and transcription)
      // The component will use the transcription to trigger useChat.append
      return {
        audioUrl,
        transcription,
      };
    } catch (pipelineError) {
      console.error("Error in audio processing pipeline:", pipelineError);
      // Error state is set by individual mutations
      throw pipelineError; // Re-throw to signal failure to the component
    }
  };

  return {
    processAudio,
    isLoading,
    error,
    processingStatus: getProcessingStatus(), // Keep status string
    audioUrl: fetchAudioMutation.data?.audioUrl, // Keep URL if needed elsewhere
    // Remove transcription and isSuccess from return, component gets it from processAudio result
  };
};
