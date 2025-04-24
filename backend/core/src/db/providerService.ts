import { db } from "./db";
import { providers, ProviderModelsType } from "./schema";
import { generateUUID, safeParseJSON, safeStringifyJSON } from "./utils";
import { eq } from "drizzle-orm";

// Re-export for easier usage
export type ProviderModel = { label: string; value: string };

export interface Provider {
  id: string;
  providerName: string;
  apiKey: string;
  baseUrl?: string;
  availableModels?: ProviderModelsType;
  default: boolean;
  modelType: "chat" | "speech" | "image";
}

export interface CreateProviderInput {
  providerName: string;
  apiKey: string;
  baseUrl?: string;
  availableModels?: ProviderModelsType;
  modelType: "chat" | "speech" | "image";
  default?: boolean;
}

export interface UpdateProviderInput {
  apiKey?: string;
  baseUrl?: string;
  availableModels?: ProviderModelsType;
  default?: boolean;
}

export class ProviderService {
  async create(input: CreateProviderInput): Promise<Provider> {
    const id = generateUUID();
    const now = Math.floor(Date.now() / 1000);

    await db.insert(providers).values({
      id,
      providerName: input.providerName,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl || null,
      availableModels: input.availableModels
        ? safeStringifyJSON(input.availableModels)
        : null,
      createdAt: now,
      updatedAt: now,
      modelType: input.modelType,
      default: input.default ? 1 : 0,
    });

    return {
      id,
      providerName: input.providerName,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      availableModels: input.availableModels,
      modelType: input.modelType,
      default: input.default || false,
    };
  }

  async getAll(): Promise<Provider[]> {
    const results = await db.select().from(providers);

    return results.map((row) => ({
      id: row.id,
      providerName: row.providerName,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl || undefined,
      availableModels: row.availableModels
        ? safeParseJSON<ProviderModelsType>(row.availableModels, [])
        : undefined,
      default: row.default === 1,
      modelType: row.modelType as "chat" | "speech" | "image",
    }));
  }

  async getById(id: string): Promise<Provider | null> {
    const result = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      providerName: row.providerName,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl || undefined,
      availableModels: row.availableModels
        ? safeParseJSON<ProviderModelsType>(row.availableModels, [])
        : undefined,
      default: row.default === 1,
      modelType: row.modelType as "chat" | "speech" | "image",
    };
  }

  async getByName(name: string): Promise<Provider | null> {
    const result = await db
      .select()
      .from(providers)
      .where(eq(providers.providerName, name))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      providerName: row.providerName,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl || undefined,
      availableModels: row.availableModels
        ? safeParseJSON<ProviderModelsType>(row.availableModels, [])
        : undefined,
      default: row.default === 1,
      modelType: row.modelType as "chat" | "speech" | "image",
    };
  }

  async getByType(type: "chat" | "speech" | "image"): Promise<Provider[]> {
    const result = await db
      .select()
      .from(providers)
      .where(eq(providers.modelType, type));

    if (result.length === 0) {
      return [];
    }

    return result.map((row) => ({
      id: row.id,
      providerName: row.providerName,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl || undefined,
      availableModels: row.availableModels
        ? safeParseJSON<ProviderModelsType>(row.availableModels, [])
        : undefined,
      default: row.default === 1,
      modelType: row.modelType as "chat" | "speech" | "image",
    }));
  }

  async update(
    id: string,
    input: UpdateProviderInput
  ): Promise<Provider | null> {
    const provider = await this.getById(id);
    if (!provider) {
      return null;
    }

    const updateData: Record<string, any> = {
      updatedAt: Math.floor(Date.now() / 1000),
    };

    if (input.apiKey !== undefined) {
      updateData.apiKey = input.apiKey;
    }

    if (input.baseUrl !== undefined) {
      updateData.baseUrl = input.baseUrl || null;
    }

    if (input.availableModels !== undefined) {
      updateData.availableModels = safeStringifyJSON(input.availableModels);
    }

    if (input.default !== undefined) {
      updateData.default = input.default ? 1 : 0;
    }

    await db.update(providers).set(updateData).where(eq(providers.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(providers).where(eq(providers.id, id));
    return true;
  }
}

// Export a singleton instance
export const providerService = new ProviderService();
