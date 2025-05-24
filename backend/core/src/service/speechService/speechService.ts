import OpenAI from "openai";
import {
  GROQ_API_KEY,
  GROQ_BASE_URL,
  TRANSCRIPTION_MODELS,
} from "../../config";
import env from "../../../env";

export const transcribeAudio = async (audioFile: File): Promise<string> => {
  try {
    const groqClient = new OpenAI({
      apiKey: env.WHISPER_API_KEY,
      baseURL: env.WHISPER_API_URL,
    });
    const response = await groqClient.audio.transcriptions.create({
      file: audioFile,
      model: TRANSCRIPTION_MODELS.whisperLargeV3,
    });
    return response.text;
  } catch (error) {
    throw error;
  }
};

export const generateSpeech = async (
  text: string,
  voice: string = "Cheyenne-PlayAI" // Default voice
): Promise<ArrayBuffer> => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const groqClient = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
    });

    const response = await groqClient.audio.speech.create({
      model: "playai-tts",
      input: text,
      voice: voice,
      response_format: "wav",
    });

    const audioBuffer = await response.arrayBuffer();
    return audioBuffer;
  } catch (error) {
    throw new Error(
      `Speech generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
