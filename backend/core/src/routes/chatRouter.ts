import { zValidator } from "@hono/zod-validator";
import { CoreMessage } from "ai";
import { Hono } from "hono";
import {
  generateChatCompletion,
  streamChatCompletion,
} from "../service/chatService/chatService";
import { ChatMessageSchema } from "../service/chatService/types";

export const chatRouter = new Hono()
  .post("/nostream", zValidator("json", ChatMessageSchema), async (c) => {
    try {
      const { messages, modelId } = c.req.valid("json");
      const response = await generateChatCompletion(messages, modelId); // Uses the non-streaming service function
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
  })
  .post("/", zValidator("json", ChatMessageSchema), async (c) => {
    try {
      const { messages, system, modelId } = c.req.valid("json");

      const result = await streamChatCompletion(
        messages as CoreMessage[],
        system,
        undefined,
        modelId
      );

      return result.toDataStreamResponse();
    } catch (error) {
      return c.json(
        {
          error: "Failed to generate streaming chat completion",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
