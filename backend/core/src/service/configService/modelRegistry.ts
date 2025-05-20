import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { providers, providerModels } from "../../db/schema";
import { decrypt } from "../../utils/crypto";

interface FormattedModel {
  id: string;
  name: string;
}

interface FormattedProvider {
  id: string;
  image: string | null;
  providerName: string;
  providerSdkId: string;
  baseUrl: string | null;
  models: FormattedModel[];
}

export const getFormattedModelRegistry = async (): Promise<{
  availableModels: FormattedProvider[];
  defaultModelId: string | null;
  defaultProviderId: string | null;
}> => {
  const allProviders = await db.select().from(providers);

  let defaultModelId: string | null = null;
  let defaultProviderId: string | null = null;

  const formattedProviders: FormattedProvider[] = [];

  for (const provider of allProviders) {
    const enabledModelsForProvider = await db
      .select()
      .from(providerModels)
      .where(
        and(
          eq(providerModels.provider_id, provider.provider_id),
          eq(providerModels.is_enabled, true)
        )
      );

    if (enabledModelsForProvider.length > 0) {
      const formattedModels: FormattedModel[] = enabledModelsForProvider.map(
        (model) => {
          if (model.is_default) {
            defaultModelId = model.model_id;
            defaultProviderId = provider.provider_id;
          }
          return {
            id: model.model_id,
            name: model.name,
          };
        }
      );

      formattedProviders.push({
        id: provider.provider_id,
        image: provider.image_url,
        providerName: provider.name,
        providerSdkId: provider.provider_id,
        baseUrl: provider.base_url,
        models: formattedModels,
      });
    }
  }

  return {
    availableModels: formattedProviders,
    defaultModelId: defaultModelId,
    defaultProviderId: defaultProviderId,
  };
};
export interface RegistryProviderConfig {
  provider_id: string;
  api_key: string;
  base_url: string | null;
}

export const getRegistryProvidersConfig = async (): Promise<
  RegistryProviderConfig[]
> => {
  const activeProviders = await db
    .select({
      provider_id: providers.provider_id,
      api_key: providers.api_key,
      base_url: providers.base_url,
      iv: providers.iv,
    })
    .from(providers);

  return activeProviders.map((p) => ({
    provider_id: p.provider_id,
    api_key: decrypt(p.api_key, p.iv),
    base_url: p.base_url,
  }));
};
