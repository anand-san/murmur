// @ts-nocheck
import { api } from "../client";
/**
 * Transcribe audio to text using the backend API
 * @param audio - The audio file to transcribe
 * @returns A promise resolving to the transcription response
 */
export async function transcribeAudio(audio: File) {
  const res = await api.api.speech.speechtotext.$post({
    form: {
      audio,
    },
  });

  if (!res.ok) {
    let errorMessage = "Failed to transcribe audio";
    try {
      return await res.json();
    } catch {
      throw new Error(errorMessage);
    }
  }
  return await res.json();
}

/**
 * Generate speech from text using the backend API
 * @param text - The text to convert to speech
 * @param voice - Optional voice identifier
 * @returns A promise resolving to an ArrayBuffer containing the audio data
 */
export async function generateSpeech(text: string, voice?: string) {
  const res = await api.api.speech.texttospeech.$post({
    json: { text, voice },
  });

  if (!res.ok) {
    let errorMessage = "Failed to generate speech";

    throw new Error(errorMessage);
  }

  // Return audio buffer directly for successful response
  return await res.arrayBuffer();
}
