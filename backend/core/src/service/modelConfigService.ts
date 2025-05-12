import { db } from "../db";
import { providers, providerModels } from "../db/schema";
import { eq, and, not, sql } from "drizzle-orm";

// TODO: Define or import a type similar to the frontend's ModelProvider for getFormattedModelRegistry
// For now, we'll assume an implicit structure.
// import { ModelProvider } from '../../../../src/views/AiInteraction/utils/types'; // Path might need adjustment or backend-specific type

// Provider CRUD operations
export const createProvider = async (data: typeof providers.$inferInsert) => {
  const newProvider = await db.insert(providers).values(data).returning();
  return newProvider[0];
};

export const getProviders = async () => {
  const allProviders = await db.select().from(providers);
  return allProviders;
};

export const getProviderById = async (id: number) => {
  const provider = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id));
  return provider[0] || null;
};

export const updateProvider = async (
  id: number,
  data: Partial<typeof providers.$inferInsert>
) => {
  const updatedProvider = await db
    .update(providers)
    .set(data)
    .where(eq(providers.id, id))
    .returning();
  return updatedProvider[0] || null;
};

export const deleteProvider = async (id: number) => {
  const deletedProvider = await db
    .delete(providers)
    .where(eq(providers.id, id))
    .returning();
  return deletedProvider[0] || null;
};

// Model CRUD operations
export const createModel = async (data: typeof providerModels.$inferInsert) => {
  const newModel = await db.insert(providerModels).values(data).returning();
  return newModel[0];
};

export const getModelsByProviderId = async (providerId: number) => {
  const models = await db
    .select()
    .from(providerModels)
    .where(eq(providerModels.provider_id, providerId));
  return models;
};

export const getModelById = async (id: number) => {
  const model = await db
    .select()
    .from(providerModels)
    .where(eq(providerModels.id, id));
  return model[0] || null;
};

export const updateModel = async (
  id: number,
  data: Partial<typeof providerModels.$inferInsert>
) => {
  const updatedModel = await db
    .update(providerModels)
    .set(data)
    .where(eq(providerModels.id, id))
    .returning();
  return updatedModel[0] || null;
};

export const deleteModel = async (id: number) => {
  const deletedModel = await db
    .delete(providerModels)
    .where(eq(providerModels.id, id))
    .returning();
  return deletedModel[0] || null;
};

export const setDefaultModel = async (modelId: number) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Set all models to is_default = false
      await tx
        .update(providerModels)
        .set({ is_default: false })
        .where(eq(providerModels.is_default, true));

      // Set the specified model to is_default = true
      const updatedModel = await tx
        .update(providerModels)
        .set({ is_default: true })
        .where(eq(providerModels.id, modelId))
        .returning();

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

// Formatter for frontend
interface FormattedModel {
  id: string; // This corresponds to model_sdk_id
  name: string;
}

interface FormattedProvider {
  id: number; // Added provider's database ID
  image: string | null; // from providers.image_url
  providerName: string; // from providers.name (user-friendly name)
  providerSdkId: string; // from providers.provider_sdk_id
  baseUrl: string | null; // from providers.base_url
  models: FormattedModel[];
}

export const getFormattedModelRegistry = async (): Promise<{
  availableModels: FormattedProvider[];
  defaultModelId: string | null;
}> => {
  const allProviders = await db.select().from(providers);
  // If providers table had an is_enabled flag, we'd filter here.
  // For now, we assume all providers fetched are considered "active".

  let defaultModelSdkId: string | null = null;
  const formattedProviders: FormattedProvider[] = [];

  for (const provider of allProviders) {
    const enabledModelsForProvider = await db
      .select()
      .from(providerModels)
      .where(
        and(
          eq(providerModels.provider_id, provider.id),
          eq(providerModels.is_enabled, true) // Only fetch enabled models
        )
      );

    if (enabledModelsForProvider.length > 0) {
      const formattedModels: FormattedModel[] = enabledModelsForProvider.map(
        (model) => {
          if (model.is_default) {
            // Check if this model is the global default
            defaultModelSdkId = model.model_sdk_id;
          }
          return {
            id: model.model_sdk_id, // This is the model_sdk_id from the DB
            name: model.name,
          };
        }
      );

      formattedProviders.push({
        id: provider.id,
        image: provider.image_url,
        providerName: provider.name,
        providerSdkId: provider.provider_sdk_id,
        baseUrl: provider.base_url,
        models: formattedModels,
      });
    }
  }

  return {
    availableModels: formattedProviders,
    defaultModelId: defaultModelSdkId,
  };
};
export interface RegistryProviderConfig {
  provider_sdk_id: string;
  api_key: string;
  base_url: string | null;
}

/**
 * Fetches configurations for providers that should be included in the AI SDK registry.
 * This typically means providers that have an API key configured.
 * @returns A promise resolving to an array of provider configurations.
 */
export const getRegistryProvidersConfig = async (): Promise<
  RegistryProviderConfig[]
> => {
  const activeProviders = await db
    .select({
      provider_sdk_id: providers.provider_sdk_id,
      api_key: providers.api_key,
      base_url: providers.base_url,
    })
    .from(providers)
    .where(
      sql`${providers.api_key} IS NOT NULL AND ${providers.api_key} != ''`
    ); // Ensure API key is present

  // Ensure that the selected fields match RegistryProviderConfig
  return activeProviders.map((p) => ({
    provider_sdk_id: p.provider_sdk_id,
    api_key: p.api_key as string, // api_key is not null due to WHERE clause
    base_url: p.base_url,
  }));
};
