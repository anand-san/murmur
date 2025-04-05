/**
 * API service for handling transcription and chat completion
 * Now calls our backend API instead of direct model calls
 */
import { invoke } from "@tauri-apps/api/core";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api";

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

// Define the expected message structure for the API
interface ApiChatMessage {
  role: "user" | "assistant" | "system"; // Add other roles if needed
  content: string;
}

/**
 * Calls the streaming chat backend API and returns the response stream.
 */
export const streamChatCompletionFrontend = async (
  messages: ApiChatMessage[]
): Promise<ReadableStream<Uint8Array>> => {
  // Point to the correct backend port
  const STREAMING_API_URL = "http://localhost:3000/api/chat"; // Changed port to 3000
  try {
    const response = await fetch(STREAMING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }), // Send the full message history
    });

    if (!response.ok) {
      // Attempt to read error details, but handle cases where it might not be JSON
      let errorDetails = `API request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetails = errorJson.error || errorJson.details || errorDetails;
      } catch (e) {
        // Ignore JSON parsing error if response body is not JSON
      }
      throw new Error(errorDetails);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Return the readable stream directly
    return response.body;
  } catch (error) {
    console.error("Streaming chat completion error:", error);
    // Re-throw the error to be handled by the calling hook
    throw error;
  }
};
