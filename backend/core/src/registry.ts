import { createProviderRegistry } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOllama } from "ollama-ai-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { providerService } from "./db/providerService";

export async function createDynamicProviderRegistry() {
  const providers = await providerService.getAll();
  const registryProviders: Record<string, any> = {};

  for (const provider of providers) {
    let providerKey = provider.providerName.toLowerCase();
    let createdProvider;

    switch (providerKey) {
      case "groq":
        createdProvider = createGroq({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      case "ollama":
        createdProvider = createOllama({
          baseURL: provider.baseUrl || "http://localhost:11434",
        });
        break;

      case "openai":
        createdProvider = createOpenAI({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      case "anthropic":
        createdProvider = createAnthropic({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      case "deepseek":
        createdProvider = createDeepSeek({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      case "mistral":
        createdProvider = createMistral({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      case "google":
        createdProvider = createGoogleGenerativeAI({
          apiKey: provider.apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        break;

      default:
        console.warn(`Unknown provider type: ${provider.providerName}`);
        continue;
    }

    if (createdProvider) {
      registryProviders[providerKey] = createdProvider;
    }
  }

  return createProviderRegistry(registryProviders);
}
