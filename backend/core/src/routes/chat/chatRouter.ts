import { UserConversationService } from "./../../service/user/conversations";
import { zValidator } from "@hono/zod-validator";
import { coreMessageSchema, streamText } from "ai";
import { Hono } from "hono";
import { z } from "zod";
import {
  authMiddleware,
  getCurrentUser,
} from "../../middleware/authMiddleware";
import { conversationsRouter } from "./conversationsRouter";
import { DEFAULT_SYSTEM_PROMPT } from "../../config";
import { registry } from "../../registry";

const AiSdkChatSchema = z.object({
  messages: z.array(coreMessageSchema),
  conversationId: z.string().optional(),
  modelId: z.string(),
  unstable_assistantMessageId: z.string().optional(),
});

export const chatRouter = new Hono()
  .use("/*", authMiddleware)
  .route("/conversations", conversationsRouter)

  .post("/", zValidator("json", AiSdkChatSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const { messages, conversationId: chatId, modelId } = c.req.valid("json");

      let conversationId = chatId;

      if (!conversationId) {
        conversationId = await UserConversationService.createConversation(
          user.id
        );
      }

      const result = streamText({
        model: registry.languageModel(modelId as any),
        messages,
        system: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.5,
        maxTokens: 4000,
        onFinish: async (output) => {
          try {
            const responseoutput = output.response.messages;

            const allMessages = [...messages, ...responseoutput];

            await UserConversationService.addMessage(
              conversationId,
              allMessages,
              user.id
            );
            if (messages.length === 1 && messages[0].role === "user") {
              console.log(
                "Saving conversation title for new conversation",
                messages
              );

              let title = "New Conversation";
              const content = messages[0].content[0];
              if (typeof content === "string") {
                title = content;
              } else if (typeof content === "object" && "text" in content) {
                title = content.text;
              }
              title = title.length > 50 ? title.slice(0, 15) + "..." : title;
              await UserConversationService.saveConversationTitle(
                conversationId,
                user.id,
                title
              );
            }
          } catch (saveError) {
            console.error("Error saving messages:", saveError);
          }
        },
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Streaming chat completion error:", error);
      return c.json(
        {
          error: "Failed to generate streaming chat completion",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
