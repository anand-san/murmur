import { eq, and, desc, ne } from "drizzle-orm";
import { db } from "../../db";
import { userAgents, type UserAgent, type NewUserAgent } from "../../db/schema";

const createDefaultAgent = (userId: string, isDefault: boolean): UserAgent => {
  return {
    id: -1,
    userId,
    name: "Default",
    description: "This is your default agent with no custom system message.",
    systemMessage: "",
    isDefault: isDefault ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export class UserAgentsService {
  static async getUserAgents(userId: string): Promise<UserAgent[]> {
    try {
      const agents = await db
        .select()
        .from(userAgents)
        .where(eq(userAgents.userId, userId))
        .orderBy(desc(userAgents.updatedAt));

      return agents;
    } catch (error) {
      console.error("Error fetching user agents:", error);
      throw new Error("Failed to fetch user agents");
    }
  }

  static async createAgent(
    userId: string,
    agentData: Omit<NewUserAgent, "userId">
  ): Promise<UserAgent> {
    try {
      const existingAgents = await this.getUserAgents(userId);
      if (existingAgents.length === 0) {
        await db
          .insert(userAgents)
          .values(createDefaultAgent(userId, false))
          .returning();
      }

      if (agentData.isDefault) {
        await this.clearDefaultAgent(userId);
      }

      const [newAgent] = await db
        .insert(userAgents)
        .values({
          ...agentData,
          userId,
        })
        .returning();

      return newAgent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw new Error("Failed to create agent");
    }
  }

  static async updateAgent(
    userId: string,
    agentId: number,
    agentData: Partial<Omit<UserAgent, "id" | "userId" | "createdAt">>
  ): Promise<UserAgent> {
    try {
      if (agentData.isDefault) {
        await this.clearDefaultAgent(userId);
      }

      const [updatedAgent] = await db
        .update(userAgents)
        .set({
          ...agentData,
          updatedAt: new Date(),
        })
        .where(and(eq(userAgents.id, agentId), eq(userAgents.userId, userId)))
        .returning();

      if (!updatedAgent) {
        throw new Error("Agent not found or unauthorized");
      }

      return updatedAgent;
    } catch (error) {
      console.error("Error updating agent:", error);
      throw new Error("Failed to update agent");
    }
  }

  static async deleteAgent(userId: string, agentId: number): Promise<void> {
    try {
      const result = await db
        .delete(userAgents)
        .where(and(eq(userAgents.id, agentId), eq(userAgents.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new Error("Agent not found or unauthorized");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      throw new Error("Failed to delete agent");
    }
  }

  static async setDefaultAgent(userId: string, agentId: number): Promise<void> {
    try {
      await this.clearDefaultAgent(userId);

      const result = await db
        .update(userAgents)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(and(eq(userAgents.id, agentId), eq(userAgents.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new Error("Agent not found or unauthorized");
      }
    } catch (error) {
      console.error("Error setting default agent:", error);
      throw new Error("Failed to set default agent");
    }
  }

  static async getDefaultAgent(userId: string): Promise<UserAgent | null> {
    try {
      const [defaultAgent] = await db
        .select()
        .from(userAgents)
        .where(
          and(eq(userAgents.userId, userId), eq(userAgents.isDefault, true))
        )
        .limit(1);

      return defaultAgent || null;
    } catch (error) {
      console.error("Error fetching default agent:", error);
      return null;
    }
  }

  static async getAgentById(
    userId: string,
    agentId: number
  ): Promise<UserAgent | null> {
    try {
      const [agent] = await db
        .select()
        .from(userAgents)
        .where(and(eq(userAgents.id, agentId), eq(userAgents.userId, userId)))
        .limit(1);

      return agent || null;
    } catch (error) {
      console.error("Error fetching agent by ID:", error);
      return null;
    }
  }

  static async isNameTaken(
    userId: string,
    name: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      const conditions = [
        eq(userAgents.userId, userId),
        eq(userAgents.name, name),
      ];

      if (excludeId) {
        conditions.push(ne(userAgents.id, excludeId));
      }

      const [existing] = await db
        .select({ id: userAgents.id })
        .from(userAgents)
        .where(and(...conditions))
        .limit(1);

      return !!existing;
    } catch (error) {
      console.error("Error checking if name is taken:", error);
      return false;
    }
  }

  private static async clearDefaultAgent(userId: string): Promise<void> {
    await db
      .update(userAgents)
      .set({
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(eq(userAgents.userId, userId));
  }
}
