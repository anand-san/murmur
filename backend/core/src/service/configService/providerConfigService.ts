import { db } from "../../db";
import { providers, providerModels } from "../../db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "../../utils/crypto";

export const createProvider = async (data: typeof providers.$inferInsert) => {
  const existingProvider = await db
    .select()
    .from(providers)
    .where(eq(providers.provider_id, data.provider_id));
  if (existingProvider.length > 0) {
    throw new Error(`Provider ${data.provider_id} already exists.`);
  }

  const newProvider = await db.insert(providers).values(data).returning({
    id: providers.provider_id,
    name: providers.name,
    base_url: providers.base_url,
    image_url: providers.image_url,
    created_at: providers.created_at,
    updated_at: providers.updated_at,
  });
  return newProvider[0];
};

export const getProviders = async () => {
  return await db
    .select({
      name: providers.name,
      provider_id: providers.provider_id,
      base_url: providers.base_url,
      image_url: providers.image_url,
    })
    .from(providers);
};

export const getProviderBySdkId = async (id: string) => {
  const provider = await db
    .select({
      name: providers.name,
      provider_id: providers.provider_id,
      base_url: providers.base_url,
      image_url: providers.image_url,
    })
    .from(providers)
    .where(eq(providers.provider_id, id));
  return provider[0] || null;
};

export const updateProvider = async (
  id: string,
  data: Partial<typeof providers.$inferInsert>
) => {
  if (data.api_key) {
    const { encryptedData, iv } = encrypt(data.api_key);
    data = {
      ...data,
      api_key: encryptedData,
      iv,
    };
  }
  const updatedProvider = await db
    .update(providers)
    .set(data)
    .where(eq(providers.provider_id, id))
    .returning({
      name: providers.name,
      provider_id: providers.provider_id,
      base_url: providers.base_url,
      image_url: providers.image_url,
    });
  return updatedProvider[0] || null;
};

export const deleteProvider = async (provider_id: string) => {
  // Also delete all models associated with this provider
  await db
    .delete(providerModels)
    .where(eq(providerModels.provider_id, provider_id));
  const deletedProvider = await db
    .delete(providers)
    .where(eq(providers.provider_id, provider_id))
    .returning({
      id: providers.provider_id,
      name: providers.name,
      base_url: providers.base_url,
      image_url: providers.image_url,
      created_at: providers.created_at,
      updated_at: providers.updated_at,
    });
  return deletedProvider[0] || null;
};
