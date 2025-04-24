import OpenAI from "openai";
import {
  GROQ_API_KEY,
  DEFAULT_IMAGE_EXTRACT_SYSTEM_PROMPT,
  VISION_MODELS,
  GROQ_BASE_URL,
} from "../../config";

export const processImageToText = async (
  imageData: string,
  prompt: string = "What's in this image?",
  modelId?: string
): Promise<string> => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const groqClient = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
    });

    const isUrl = !imageData.startsWith("data:image/");

    const imageContent = isUrl ? { url: imageData } : { url: imageData }; // For base64, we still use the url field with the data URI

    const completion = await groqClient.chat.completions.create({
      model: modelId || VISION_MODELS.llama4Scout,
      messages: [
        {
          role: "system",
          content: DEFAULT_IMAGE_EXTRACT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: imageContent },
          ],
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(
      `Image processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
