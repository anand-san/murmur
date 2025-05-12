import { createProviderRegistry, Provider } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { db } from "./db"; // Assuming db is exported from db/index.ts
import { getRegistryProvidersConfig } from "./service/modelConfigService";

type ProviderFactory = (config: {
  apiKey?: string;
  baseURL?: string;
  [key: string]: any;
}) => Provider;

// Map SDK IDs to their factory functions
const providerFactories: Record<string, ProviderFactory> = {
  openai: createOpenAI as ProviderFactory,
  groq: createGroq as ProviderFactory,
  anthropic: createAnthropic as ProviderFactory,
  deepseek: createDeepSeek as ProviderFactory,
  mistral: createMistral as ProviderFactory,
  google: createGoogleGenerativeAI as ProviderFactory,
};

/**
 * Creates a fresh provider registry by fetching current configurations
 * from the database and instantiating AI SDK providers.
 * This function is intended to be called per request if the latest
 * configuration is always needed.
 * @param dbInstance - Optional database instance, defaults to the imported `db`.
 * @returns A promise resolving to a newly created ProviderRegistry instance.
 */
export async function createFreshProviderRegistry(
  dbInstance?: typeof db
): Promise<Provider> {
  // Use the provided dbInstance or the default imported one
  const currentDb = dbInstance || db;
  // getRegistryProvidersConfig uses the db instance imported within modelConfigService.ts,
  // so passing currentDb to it isn't directly needed unless modelConfigService is refactored.
  // For clarity, we acknowledge it relies on the shared db connection.

  console.log(
    "Creating fresh provider registry from DB for current request..."
  );
  const providerConfigs = await getRegistryProvidersConfig();

  const configuredProviders: Record<string, Provider> = {};

  for (const config of providerConfigs) {
    console.log({
      config,
    });
    const factory = providerFactories[config.provider_sdk_id];
    if (factory) {
      try {
        const factoryConfig: { apiKey?: string; baseURL?: string } = {
          apiKey: config.api_key,
        };
        if (config.base_url) {
          // Only add baseURL if it's provided and not empty
          factoryConfig.baseURL = config.base_url;
        }
        const providerInstance = factory(factoryConfig);
        configuredProviders[config.provider_sdk_id] = providerInstance;
        console.log(
          `Dynamically configured provider for request: ${config.provider_sdk_id}`
        );
      } catch (error) {
        console.error(
          `Error configuring provider ${config.provider_sdk_id} for request:`,
          error
        );
      }
    } else {
      console.warn(
        `No factory found for provider SDK ID during request: ${config.provider_sdk_id}`
      );
    }
  }

  if (Object.keys(configuredProviders).length === 0) {
    console.warn(
      "No providers were configured for the registry for this request. Chat functionality might be limited."
    );
    return createProviderRegistry({});
  }

  console.log("Fresh provider registry created for the request.");
  return createProviderRegistry(configuredProviders);
}
