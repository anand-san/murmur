import { UserConversationService } from "./../../service/user/conversations";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getCurrentUser } from "../../middleware/authMiddleware";
import { generateChatCompletion } from "../../service/chatService/chatService";

const CreateConversationSchema = z.object({
  title: z.string().optional(),
});

const ConversationMessageSchema = z.object({
  message: z.string(),
  modelId: z.string().optional(),
});

export const conversationsRouter = new Hono()
  .get("/conversations", async (c) => {
    try {
      const user = getCurrentUser(c);
      const conversations = await UserConversationService.getUserConversations(
        user.id
      );
      return c.json({ conversations });
    } catch (error) {
      console.error("Error getting conversations:", error);
      return c.json({ error: "Failed to get conversations" }, 500);
    }
  })

  .post(
    "/conversations",
    zValidator("json", CreateConversationSchema),
    async (c) => {
      try {
        const user = getCurrentUser(c);
        const { title } = c.req.valid("json");
        const conversationId = await UserConversationService.createConversation(
          user.id,
          title
        );
        return c.json({ conversationId });
      } catch (error) {
        console.error("Error creating conversation:", error);
        return c.json({ error: "Failed to create conversation" }, 500);
      }
    }
  )

  .get("/conversations/:id/messages", async (c) => {
    try {
      const user = getCurrentUser(c);
      const conversationId = parseInt(c.req.param("id"));

      if (isNaN(conversationId)) {
        return c.json({ error: "Invalid conversation ID" }, 400);
      }

      const messages = await UserConversationService.getConversationMessages(
        conversationId,
        user.id
      );
      return c.json({ messages });
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      return c.json({ error: "Conversation not found" }, 404);
    }
  })

  .post(
    "/conversations/:id/messages",
    zValidator("json", ConversationMessageSchema),
    async (c) => {
      try {
        const user = getCurrentUser(c);
        const conversationId = parseInt(c.req.param("id"));
        const { message, modelId } = c.req.valid("json");

        if (isNaN(conversationId)) {
          return c.json({ error: "Invalid conversation ID" }, 400);
        }

        await UserConversationService.addMessage(
          conversationId,
          "user",
          message,
          user.id
        );

        const messages = await UserConversationService.getConversationMessages(
          conversationId,
          user.id
        );

        const aiResponse = await generateChatCompletion(
          messages.map((m) => ({ role: m.role as any, content: m.content })),
          modelId
        );

        const aiMessage = await UserConversationService.addMessage(
          conversationId,
          "assistant",
          aiResponse,
          user.id
        );

        return c.json({ message: aiMessage });
      } catch (error) {
        console.error("Error sending message:", error);
        return c.json({ error: "Failed to send message" }, 500);
      }
    }
  )

  .put(
    "/conversations/:id",
    zValidator("json", z.object({ title: z.string() })),
    async (c) => {
      try {
        const user = getCurrentUser(c);
        const conversationId = parseInt(c.req.param("id") as string);
        const { title } = c.req.valid("json");

        if (isNaN(conversationId)) {
          return c.json({ error: "Invalid conversation ID" }, 400);
        }

        await UserConversationService.updateConversationTitle(
          conversationId,
          title,
          user.id
        );
        return c.json({ success: true });
      } catch (error) {
        console.error("Error updating conversation title:", error);
        return c.json({ error: "Failed to update conversation title" }, 500);
      }
    }
  )

  .delete("/conversations/:id", async (c) => {
    try {
      const user = getCurrentUser(c);
      const conversationId = parseInt(c.req.param("id") as string);

      if (isNaN(conversationId)) {
        return c.json({ error: "Invalid conversation ID" }, 400);
      }

      await UserConversationService.deleteConversation(conversationId, user.id);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return c.json({ error: "Failed to delete conversation" }, 500);
    }
  });
