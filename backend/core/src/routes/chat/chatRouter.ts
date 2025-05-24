import { UserConversationService } from "./../../service/user/conversations";
import { zValidator } from "@hono/zod-validator";
import { CoreMessage } from "ai";
import { Hono } from "hono";
import {
  authMiddleware,
  getCurrentUser,
} from "../../middleware/authMiddleware";
import {
  generateChatCompletion,
  streamChatCompletion,
} from "../../service/chatService/chatService";
import { ChatMessageSchema } from "../../service/chatService/types";
import { conversationsRouter } from "./conversationsRouter";

export const chatRouter = new Hono()
  .use("/*", authMiddleware)
  .route("/conversations", conversationsRouter)

  .post("/nostream", zValidator("json", ChatMessageSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const { messages, modelId, conversationId } = c.req.valid("json");

      let existingConversationId = conversationId;

      if (!existingConversationId) {
        existingConversationId =
          await UserConversationService.createConversation(user.id);
      }

      // Add messages to conversation
      for (const msg of messages) {
        await UserConversationService.addMessage(
          existingConversationId,
          msg.role,
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
          user.id
        );
      }

      const response = await generateChatCompletion(messages, modelId);
      await UserConversationService.addMessage(
        existingConversationId,
        "assistant",
        response,
        user.id
      );

      return c.json({ response, existingConversationId });
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
      const user = getCurrentUser(c);
      const { messages, system, modelId, conversationId } = c.req.valid("json");

      let existingConversationId = conversationId;
      if (!existingConversationId) {
        existingConversationId =
          await UserConversationService.createConversation(user.id);
      }

      for (const msg of messages) {
        await UserConversationService.addMessage(
          existingConversationId,
          msg.role,
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
          user.id
        );
      }

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
