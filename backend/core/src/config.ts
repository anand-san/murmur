export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// API endpoint paths
export const API_ENDPOINTS = {
  transcription: `${GROQ_BASE_URL}/audio/transcriptions`,
  chatCompletion: `${GROQ_BASE_URL}/chat/completions`,
};

// Chat models
export const CHAT_MODELS = {
  llama3: "deepseek-r1-distill-llama-70b",
};

// Transcription models
export const TRANSCRIPTION_MODELS = {
  whisperLargeV3: "distil-whisper-large-v3-en",
};

// Default system prompt for chat
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Respond concisely.";
