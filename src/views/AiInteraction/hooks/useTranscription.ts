import { transcribeAudio } from "../../../api/speech/speech";
import { useMutation } from "@tanstack/react-query";

/**
 * React Query hook for transcribing audio
 * @returns A mutation hook for transcribing audio files
 */
export function useTranscription() {
  return useMutation({
    mutationFn: (audioFile: File) => transcribeAudio(audioFile),
    onError: (error) => {
      console.error("Transcription error:", error);
    },
  });
}
