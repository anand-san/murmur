import { UserConversationService } from "./../../service/user/conversations";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getCurrentUser } from "../../middleware/authMiddleware";
import { coreMessageSchema } from "ai";

const CreateConversationSchema = z.object({
  title: z.string().optional(),
});

export const conversationsRouter = new Hono()
  .get("/", async (c) => {
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

  .post("/", zValidator("json", CreateConversationSchema), async (c) => {
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
  })

  .get("/:id/messages", async (c) => {
    try {
      const user = getCurrentUser(c);
      const conversationId = c.req.param("id");

      if (!conversationId) {
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
    "/:id/messages",
    zValidator("json", z.array(coreMessageSchema)),
    async (c) => {
      try {
        const user = getCurrentUser(c);
        const conversationId = c.req.param("id");
        const coreMessage = c.req.valid("json");

        if (!conversationId) {
          return c.json({ error: "Invalid conversation ID" }, 400);
        }

        const newMessage = await UserConversationService.addMessage(
          conversationId,
          coreMessage,
          user.id
        );

        return c.json({ message: newMessage });
      } catch (error) {
        console.error("Error sending message:", error);
        return c.json({ error: "Failed to send message" }, 500);
      }
    }
  )

  .put(
    "/:id",
    zValidator("json", z.object({ title: z.string() })),
    async (c) => {
      try {
        const user = getCurrentUser(c);
        const conversationId = c.req.param("id");
        const { title } = c.req.valid("json");

        if (!conversationId) {
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

  .delete("/:id", async (c) => {
    try {
      const user = getCurrentUser(c);
      const conversationId = c.req.param("id");

      if (!conversationId) {
        return c.json({ error: "Invalid conversation ID" }, 400);
      }

      await UserConversationService.deleteConversation(conversationId, user.id);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return c.json({ error: "Failed to delete conversation" }, 500);
    }
  });
