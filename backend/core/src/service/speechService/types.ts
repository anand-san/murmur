import { z } from "zod";

export const TextToSpeechSchema = z.object({
  text: z.string(),
  voice: z.string().optional(), // Optional voice selection
});

// Schema for request validation
export const TranscriptionSchema = z.object({
  audio: z.instanceof(File),
});
