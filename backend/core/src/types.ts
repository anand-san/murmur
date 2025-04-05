/**
 * Type definitions for API operations
 */

// Transcription API
export interface TranscriptionRequest {
  audio: File;
  model?: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
}

// Chat Completion API
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  text: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  stream: ReadableStream;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}
