import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db";
import { conversations, messages } from "../../db/schema";

export class UserConversationService {
  static async createConversation(
    userId: string,
    title?: string
  ): Promise<number> {
    const [conversation] = await db
      .insert(conversations)
      .values({ userId, title: title || "New Conversation" })
      .returning({ id: conversations.id });

    return conversation.id;
  }

  static async getUserConversations(userId: string) {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  static async getConversationMessages(conversationId: number, userId: string) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  static async addMessage(
    conversationId: number,
    role: string,
    content: string,
    userId: string
  ) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    const [message] = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return message;
  }

  static async updateConversationTitle(
    conversationId: number,
    title: string,
    userId: string
  ) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  static async deleteConversation(conversationId: number, userId: string) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    await db.delete(conversations).where(eq(conversations.id, conversationId));
  }
}
