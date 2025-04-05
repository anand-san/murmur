/**
 * API service for handling transcription and chat completion
 * Now calls our backend API instead of direct model calls
 */
import { invoke } from "@tauri-apps/api/core";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * Creates a Blob from a base64 encoded string
 */
export const base64ToBlob = (base64Data: string): Blob => {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: "audio/wav" });
};

/**
 * Fetches audio data from Tauri backend
 */
export const fetchAudioData = async (): Promise<{
  audioBlob: Blob;
  audioUrl: string;
}> => {
  try {
    const base64Data = await invoke<string>("get_audio_data");

    if (!base64Data || base64Data.length === 0) {
      throw new Error("Received empty audio data from backend.");
    }

    const audioBlob = base64ToBlob(base64Data);
    const audioUrl = URL.createObjectURL(audioBlob);

    return { audioBlob, audioUrl };
  } catch (error) {
    throw new Error(
      `Error fetching audio data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Transcribes audio using our backend API
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    const response = await fetch(`${BACKEND_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Transcription failed");
    }

    const { text } = await response.json();
    return text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error(
      `Transcription error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Generates chat completion using our backend API
 */
export const generateChatCompletion = async (text: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Chat completion failed");
    }

    const { response: completion } = await response.json();
    return completion;
  } catch (error) {
    console.error("Chat completion error:", error);
    throw new Error(
      `Chat completion error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
