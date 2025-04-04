/**
 * Type definitions for API operations
 */

// Transcription API
export interface TranscriptionRequest {
  audioBlob: Blob;
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
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Processing Status
export type ProcessingState = "idle" | "processing" | "done" | "error";

// Error types
export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}
