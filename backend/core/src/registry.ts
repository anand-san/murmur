import { createProviderRegistry, Provider } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { db } from "./db";
import { getRegistryProvidersConfig } from "./service/configService/modelRegistry";
import { ALLOWED_PROVIDERS } from "./service/configService/constants";

type ProviderFactory = (config: {
  apiKey?: string;
  baseURL?: string;
  [key: string]: any;
}) => Provider;

const providerFactories: Record<string, ProviderFactory> =
  ALLOWED_PROVIDERS.reduce(
    (acc, provider) => {
      if (provider === "openai") {
        acc[provider] = createOpenAI as ProviderFactory;
      } else if (provider === "groq") {
        acc[provider] = createGroq as ProviderFactory;
      } else if (provider === "anthropic") {
        acc[provider] = createAnthropic as ProviderFactory;
      } else if (provider === "deepseek") {
        acc[provider] = createDeepSeek as ProviderFactory;
      } else if (provider === "mistral") {
        acc[provider] = createMistral as ProviderFactory;
      } else if (provider === "google") {
        acc[provider] = createGoogleGenerativeAI as ProviderFactory;
      }
      return acc;
    },
    {} as Record<string, ProviderFactory>
  );

export async function createFreshProviderRegistry(): Promise<Provider> {
  console.log(
    "Creating fresh provider registry from DB for current request..."
  );
  const providerConfigs = await getRegistryProvidersConfig();

  const configuredProviders: Record<string, Provider> = {};

  for (const config of providerConfigs) {
    const factory = providerFactories[config.provider_id];

    if (factory) {
      try {
        const factoryConfig: { apiKey?: string; baseURL?: string } = {
          apiKey: config.api_key,
        };
        if (config.base_url) {
          factoryConfig.baseURL = config.base_url;
        }

        const providerInstance = factory(factoryConfig);

        configuredProviders[config.provider_id] = providerInstance;

        console.log(
          `Dynamically configured provider for request: ${config.provider_id}`
        );
      } catch (error) {
        console.error(
          `Error configuring provider ${config.provider_id} for request:`,
          error
        );
      }
    } else {
      console.warn(
        `No factory found for provider SDK ID during request: ${config.provider_id}`
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
