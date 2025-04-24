import { z } from "zod";

export const ImageToTextSchema = z.object({
  image: z.union([
    // Base64 encoded image
    z.string().refine((str) => str.startsWith("data:image/"), {
      message:
        "Image must be a base64 encoded string starting with data:image/",
    }),
    // Image URL
    z.string().url(),
  ]),
  prompt: z.string().default("What's in this image?"),
  modelId: z.string().optional(), // Optional model ID
});
