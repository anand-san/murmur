import { CoreMessage, StreamTextResult, generateText, streamText } from "ai";
import { DEFAULT_SYSTEM_PROMPT } from "../../config";
import { createFreshProviderRegistry } from "../../registry"; // Import createFreshProviderRegistry

export const generateChatCompletion = async (
  messages: CoreMessage[],
  modelId?: string
): Promise<string> => {
  try {
    const defaultModelId = "groq:llama-3.3-70b-versatile";
    const selectedModelId = modelId || defaultModelId;

    const currentRegistry = await createFreshProviderRegistry(); // Create fresh registry for the request
    const result = generateText({
      model: currentRegistry.languageModel(selectedModelId as any),
      messages: messages,
      temperature: 0.5,
      maxTokens: 4000,
    });

    return (await result).text || "";
  } catch (error) {
    console.error("Chat completion error:", error);
    throw new Error(
      `Chat failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const streamChatCompletion = async (
  messages: CoreMessage[],
  system?: string,
  tools?: Record<string, { parameters: any }>,
  modelId?: string
): Promise<StreamTextResult<any, any>> => {
  try {
    const defaultModelId = "groq:llama-3.3-70b-versatile";
    const selectedModelId = modelId || defaultModelId;
    const currentRegistry = await createFreshProviderRegistry(); // Create fresh registry for the request

    const model = currentRegistry.languageModel(selectedModelId as any);

    const result = streamText({
      model,
      messages,
      system: system || DEFAULT_SYSTEM_PROMPT,
      tools,
      temperature: 0.5,
      maxTokens: 4000,
    });

    return result;
  } catch (error) {
    console.error("Streaming chat completion error:", error);
    throw new Error(
      `Streaming chat failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
