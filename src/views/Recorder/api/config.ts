/**
 * API Configuration for external services
 */

// Environment variables should be set in .env file with VITE_ prefix
// to make them accessible in client-side code
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// API endpoint paths
export const API_ENDPOINTS = {
  transcription: `${GROQ_BASE_URL}/audio/transcriptions`,
  chatCompletion: `${GROQ_BASE_URL}/chat/completions`,
};

// Chat models
export const CHAT_MODELS = {
  llama3: "llama-3.3-70b-versatile",
};

// Transcription models
export const TRANSCRIPTION_MODELS = {
  whisperLargeV3: "distil-whisper-large-v3-en",
};

// Default system prompt for chat
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Respond concisely.";
