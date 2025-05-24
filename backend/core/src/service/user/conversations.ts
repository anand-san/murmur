import { messages } from "./../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { CoreMessage, generateId } from "ai";
import { db } from "../../db";
import { conversations } from "../../db/schema";

export interface AiSdkMessage {
  id: string;
  content: CoreMessage[];
  createdAt: Date;
}

export class UserConversationService {
  static async createConversation(
    userId: string,
    title?: string,
    externalId?: string
  ): Promise<string> {
    const conversationId = externalId || generateId(); // Use provided ID or generate new one
    await db
      .insert(conversations)
      .values({
        externalId: conversationId,
        userId,
        title: title || "New Conversation",
      });

    return conversationId;
  }

  static async getUserConversations(userId: string) {
    return await db
      .select({
        id: conversations.externalId,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  static async getConversationMessages(conversationId: string, userId: string) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.externalId, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    return await db
      .select({
        id: messages.externalId,
        content: messages.content,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        conversationId: messages.conversationId,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  static async getChatMessages(
    conversationId: string,
    userId: string
  ): Promise<AiSdkMessage[]> {
    const dbMessages = await this.getConversationMessages(
      conversationId,
      userId
    );

    return dbMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }

  static async addMessage(
    conversationId: string,
    content: CoreMessage[],
    userId: string
  ) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.externalId, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    const existingMessage = await db
      .select({
        id: messages.externalId,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .limit(1);

    if (existingMessage.length > 0) {
      await db
        .update(messages)
        .set({ content, updatedAt: new Date() })
        .where(eq(messages.externalId, existingMessage[0].id));
    } else {
      await db
        .insert(messages)
        .values({ conversationId, content, externalId: generateId() })
        .returning();
    }

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.externalId, conversationId));

    return {
      id: conversationId,
      updatedAt: new Date(),
    };
  }

  static async updateConversationTitle(
    conversationId: string,
    title: string,
    userId: string
  ) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.externalId, conversationId),
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
      .where(eq(conversations.externalId, conversationId));
  }

  static async deleteConversation(conversationId: string, userId: string) {
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.externalId, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation.length) {
      throw new Error("Conversation not found or access denied");
    }

    await db
      .delete(conversations)
      .where(eq(conversations.externalId, conversationId));
  }

  // Auto-generate title from first user message
  static async autoGenerateTitle(conversationId: string, userId: string) {
    const firstMessage = await db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId)))
      .orderBy(messages.createdAt)
      .limit(1);

    if (firstMessage.length > 0) {
      const content = firstMessage[0].content[0].content as string;
      const title =
        content.length > 50 ? content.slice(0, 47) + "..." : content;
      await this.updateConversationTitle(conversationId, title, userId);
    }
  }

  static async saveConversationTitle(
    conversationId: string,
    userId: string,
    title: string
  ) {
    await this.updateConversationTitle(conversationId, title, userId);
  }
}
