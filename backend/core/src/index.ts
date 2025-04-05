import { Hono } from "hono";
import { transcribeAudio, generateChatCompletion } from "./service";
import { TranscriptionSchema, ChatCompletionSchema } from "./service";
import { zValidator } from "@hono/zod-validator";
import { GROQ_API_KEY, GROQ_BASE_URL } from "./config";
import { cors } from "hono/cors";

const app = new Hono();
app.use("*", cors());

// Health check endpoint
app.get("/", (c) => {
  return c.text("AI Service API is running");
});

// Audio transcription endpoint
app.post("/transcribe", zValidator("form", TranscriptionSchema), async (c) => {
  try {
    const { audio } = c.req.valid("form");
    const transcription = await transcribeAudio(audio);
    return c.json({ text: transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    return c.json({ error: "Failed to transcribe audio" }, 500);
  }
});

// Chat completion endpoint (streaming)
app.post("/chat", zValidator("json", ChatCompletionSchema), async (c) => {
  try {
    const { text } = c.req.valid("json");
    const response = await generateChatCompletion(text);
    return c.json({ response });
  } catch (error) {
    console.error("Chat completion error:", error);
    return c.json(
      {
        error: "Failed to generate chat completion",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

console.log("API server is running");
export default app;
