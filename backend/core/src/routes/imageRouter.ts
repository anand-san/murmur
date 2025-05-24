import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import { processImageToText } from "../service/imageService/imageService";
import { ImageToTextSchema } from "../service/imageService/types";

export const imageRouter = new Hono()
  .use("/*", authMiddleware)
  .post("/", zValidator("json", ImageToTextSchema), async (c) => {
    try {
      const { image, prompt, modelId } = c.req.valid("json");
      console.log(
        "Processing image with prompt:",
        prompt,
        "ModelId:",
        modelId || "(using default)"
      );

      const description = await processImageToText(image, prompt, modelId);

      return c.json({ text: description });
    } catch (error) {
      console.error("Image-to-text error:", error);
      return c.json(
        {
          error: "Failed to process image",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
