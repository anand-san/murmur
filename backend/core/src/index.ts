import { Hono } from "hono";
// Removed: import { serve } from "@hono/node-server";
// Removed: import { streamText as honoStreamText } from "hono/streaming"; // No longer needed
import {
  transcribeAudio,
  streamChatCompletion, // Use the streaming function
  TranscriptionSchema,
  StreamChatSchema, // Use the streaming schema
  generateChatCompletion,
  ChatCompletionSchema,
} from "./service";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { CoreMessage, jsonSchema } from "ai"; // Import CoreMessage and jsonSchema for AI SDK

const app = new Hono();

// Configure CORS - Allow requests from the Tauri app's origin
app.use(
  "/api/*", // Apply CORS only to API routes
  cors({
    // Allow requests from the Tauri app's origin and the dev server
    origin: "*", // Added API server origin itself for potential direct testing
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"], // Add any other headers your frontend might send
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.text("AI Service API is running");
});

// Audio transcription endpoint (moved to /api/transcribe)
app.post(
  "/api/transcribe",
  zValidator("form", TranscriptionSchema),
  async (c) => {
    try {
      const { audio } = c.req.valid("form");
      const transcription = await transcribeAudio(audio);
      return c.json({ text: transcription });
    } catch (error) {
      console.error("Transcription error:", error);
      return c.json({ error: "Failed to transcribe audio" }, 500);
    }
  }
);

// Chat completion endpoint (non-streaming - kept at /api/chat/nostream)
app.post(
  "/api/chat/nostream",
  zValidator("json", ChatCompletionSchema),
  async (c) => {
    try {
      const { text } = c.req.valid("json");
      const response = await generateChatCompletion(text); // Uses the non-streaming service function
      return c.json({ response });
    } catch (error) {
      console.error("Non-streaming chat completion error:", error);
      return c.json(
        {
          error: "Failed to generate non-streaming chat completion",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

// --- Streaming Chat Endpoint ---
app.post(
  "/api/chat", // Primary endpoint for useChat
  zValidator("json", StreamChatSchema), // Validate using the streaming schema
  async (c) => {
    try {
      const { messages, system } = c.req.valid("json"); // Get messages and system prompt

      // Call the streaming service function without tools for now
      const result = await streamChatCompletion(
        messages as CoreMessage[],
        system
      );

      // Convert the result to the AI SDK RSC format
      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Streaming chat error:", error);
      // Return error in a format useChat might understand or a generic server error
      return c.json(
        {
          error: "Failed to generate streaming chat completion",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

// --- Server Export for Bun ---
const port = 3000; // Define a port for the API server
console.log(`Hono server ready on http://localhost:${port}`);
console.log("Run with: bun run backend/core/src/index.ts");

// Bun automatically uses the default export with a fetch method.
// We can optionally export the port.
export default {
  port: port,
  fetch: app.fetch,
};
