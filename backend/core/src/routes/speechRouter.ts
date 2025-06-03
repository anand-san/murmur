import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  transcribeAudio,
  generateSpeech,
} from "../service/speechService/speechService";
import {
  TextToSpeechSchema,
  TranscriptionSchema,
} from "../service/speechService/types";

export const speechRouter = new Hono()
  .use("/*", authMiddleware)
  .post("/speechtotext", zValidator("form", TranscriptionSchema), async (c) => {
    try {
      const { audio } = c.req.valid("form");
      const transcription = await transcribeAudio(audio);
      return c.json({ text: transcription });
    } catch (error) {
      console.error("Transcription error:", error);
      return c.json({ error: "Failed to transcribe audio" }, 500);
    }
  })
  .post("/texttospeech", zValidator("json", TextToSpeechSchema), async (c) => {
    try {
      const { text } = c.req.valid("json");
      const audioBuffer = await generateSpeech(text);

      c.header("Content-Type", "audio/wav");
      c.header("Content-Length", audioBuffer.byteLength.toString());

      return c.body(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      return c.json(
        {
          error: "Failed to generate speech",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
