/**
 * API service for handling transcription and chat completion
 * Using OpenAI SDK with Groq compatibility
 */
import { invoke } from "@tauri-apps/api/core";
import OpenAI from "openai";
import {
  GROQ_API_KEY,
  GROQ_BASE_URL,
  CHAT_MODELS,
  TRANSCRIPTION_MODELS,
  DEFAULT_SYSTEM_PROMPT,
} from "./config";

// Configure OpenAI client to use Groq API
const openai = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: GROQ_BASE_URL,
  dangerouslyAllowBrowser: true,
});

// Check if API key is available
if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. API calls will fail.");
}

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
 * Transcribes audio using OpenAI/Groq API
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Create a File object from the Blob with a filename
    const audioFile = new File([audioBlob], "recording.wav", {
      type: "audio/wav",
    });

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: TRANSCRIPTION_MODELS.whisperLargeV3,
    });

    return response.text;
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
 * Generates chat completion from transcription
 */
export const generateChatCompletion = async (
  transcription: string
): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODELS.llama3,
      messages: [
        {
          role: "system",
          content: DEFAULT_SYSTEM_PROMPT,
        },
        { role: "user", content: transcription },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Chat completion error:", error);
    throw new Error(
      `Chat completion error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
