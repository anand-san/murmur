import { db } from "../../db";
import { providerModels } from "../../db/schema";
import { eq } from "drizzle-orm";

export const createModel = async (data: typeof providerModels.$inferInsert) => {
  const newModel = await db.insert(providerModels).values(data).returning({
    id: providerModels.model_id,
    name: providerModels.name,
    provider_id: providerModels.provider_id,
    is_default: providerModels.is_default,
    is_enabled: providerModels.is_enabled,
  });
  return newModel[0];
};

export const getModelsByProviderId = async (providerId: string) => {
  const models = await db
    .select({
      id: providerModels.model_id,
      name: providerModels.name,
      provider_id: providerModels.provider_id,
      is_default: providerModels.is_default,
      is_enabled: providerModels.is_enabled,
    })
    .from(providerModels)
    .where(eq(providerModels.provider_id, providerId));
  return models;
};

export const getModelById = async (modelId: string) => {
  const model = await db
    .select({
      id: providerModels.model_id,
      name: providerModels.name,
      provider_id: providerModels.provider_id,
      is_default: providerModels.is_default,
      is_enabled: providerModels.is_enabled,
    })
    .from(providerModels)
    .where(eq(providerModels.model_id, modelId));
  return model[0] || null;
};

export const updateModel = async (
  modelId: string,
  data: Partial<typeof providerModels.$inferInsert>
) => {
  const updatedModel = await db
    .update(providerModels)
    .set(data)
    .where(eq(providerModels.model_id, modelId))
    .returning({
      id: providerModels.model_id,
      name: providerModels.name,
      provider_id: providerModels.provider_id,
      is_default: providerModels.is_default,
      is_enabled: providerModels.is_enabled,
    });
  return updatedModel[0] || null;
};

export const deleteModel = async (modelId: string) => {
  const deletedModel = await db
    .delete(providerModels)
    .where(eq(providerModels.model_id, modelId))
    .returning({
      id: providerModels.model_id,
      name: providerModels.name,
      provider_id: providerModels.provider_id,
      is_default: providerModels.is_default,
      is_enabled: providerModels.is_enabled,
    });
  return deletedModel[0] || null;
};

export const setDefaultModel = async (modelId: string) => {
  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .update(providerModels)
        .set({ is_default: false })
        .where(eq(providerModels.is_default, true));

      const updatedModel = await tx
        .update(providerModels)
        .set({ is_default: true })
        .where(eq(providerModels.model_id, modelId))
        .returning({
          id: providerModels.model_id,
          name: providerModels.name,
          provider_id: providerModels.provider_id,
          is_default: providerModels.is_default,
          is_enabled: providerModels.is_enabled,
        });

      if (updatedModel.length === 0) {
        throw new Error(`Model with id ${modelId} not found.`);
      }
      return updatedModel[0];
    });
    return result;
  } catch (error) {
    console.error("Error setting default model:", error);
    // Depending on how you want to handle errors, you might re-throw or return null/error object
    throw error; // Re-throwing for now, can be adjusted
  }
};

export const getDefaultModel = async () => {
  const defaultModel = await db
    .select({
      id: providerModels.model_id,
    })
    .from(providerModels)
    .where(eq(providerModels.is_default, true));
  return defaultModel[0] || null;
};
