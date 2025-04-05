export type ProcessingState = "idle" | "processing" | "done" | "error";

// Define a structure for chat messages
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
