import { API_BASE } from "../utils/constants";

/**
 * Send audio file to transcription API
 * @param audioFile The WAV file to transcribe
 * @returns Promise with transcription text
 */
export const transcribeAudio = async (audioFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append("audio", audioFile);

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    headers: {
      Authorization: "INTERNAL",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.text) {
    return result.text;
  } else if (result.error) {
    throw new Error(result.error);
  } else {
    throw new Error("Unknown error in transcription response");
  }
};
