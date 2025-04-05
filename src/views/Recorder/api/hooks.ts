import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAudioData,
  transcribeAudio,
  generateChatCompletion,
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
 * Custom hook to generate chat completion from transcription
 */
export const useGenerateChatCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateChatCompletion,
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["chatCompletion"] });
    },
    onError: (error) => {
      console.error("Error generating chat completion:", error);
    },
  });
};

/**
 * Main hook for the audio processing pipeline
 * Handles the entire flow: fetch audio → transcribe → generate chat completion
 */
export const useAudioProcessingPipeline = () => {
  const fetchAudioMutation = useFetchAudioData();
  const transcribeAudioMutation = useTranscribeAudio();
  const generateChatMutation = useGenerateChatCompletion();

  // Combined loading state
  const isLoading =
    fetchAudioMutation.isPending ||
    transcribeAudioMutation.isPending ||
    generateChatMutation.isPending;

  // Combined error state
  const error =
    fetchAudioMutation.error ||
    transcribeAudioMutation.error ||
    generateChatMutation.error;

  // Current processing status message
  const getProcessingStatus = () => {
    if (fetchAudioMutation.isPending) return "Getting audio data...";
    if (transcribeAudioMutation.isPending) return "Transcribing...";
    if (generateChatMutation.isPending) return "Generating AI response...";
    if (error) return `Error: ${error.message}`;
    if (generateChatMutation.data) return "Done!";
    return null;
  };

  // Start the audio processing pipeline
  const processAudio = async () => {
    try {
      console.log("Starting audio processing pipeline...");
      // Step 1: Fetch audio data
      const { audioBlob, audioUrl } = await fetchAudioMutation.mutateAsync();

      console.log("Fetched audio data:", audioBlob, audioUrl);
      // Step 2: Transcribe audio
      const transcription = await transcribeAudioMutation.mutateAsync(
        audioBlob
      );

      console.log("Transcribed audio:", transcription);
      // Step 3: Generate chat completion
      const chatCompletion = await generateChatMutation.mutateAsync(
        transcription
      );

      return {
        audioUrl,
        transcription,
        chatCompletion,
      };
    } catch (error) {
      console.error("Error in audio processing pipeline:", error);
      throw error;
    }
  };

  return {
    processAudio,
    isLoading,
    error,
    processingStatus: getProcessingStatus(),
    audioUrl: fetchAudioMutation.data?.audioUrl,
    transcription: transcribeAudioMutation.data,
    chatCompletion: generateChatMutation.data,
  };
};
