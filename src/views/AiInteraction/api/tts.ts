import { API_BASE } from "../utils/constants";

/**
 * Fetches Text-to-Speech audio data from the backend API.
 * @param text The text to synthesize.
 * @param voice Optional voice selection.
 * @returns Promise resolving to an ArrayBuffer containing the WAV audio data.
 */
export const fetchTTSAudio = async (
  text: string,
  voice?: string
): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if needed by your backend setup
        // Authorization: "INTERNAL",
      },
      body: JSON.stringify({ text, voice }), // Include optional voice
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Read error body for more details
      console.error("TTS API Error Response:", errorBody);
      throw new Error(
        `TTS API error: ${response.status} ${response.statusText}`
      );
    }

    // Expecting audio/wav response, return as ArrayBuffer
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Failed to fetch TTS audio:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
