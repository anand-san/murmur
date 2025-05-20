import { Hono } from "hono";
import { providerConfigRouter } from "./providerConfigRouter";
import { modelConfigRouter } from "./modelConfigRouter";
import { getFormattedModelRegistry } from "../../service/configService/modelRegistry";

export const configRouter = new Hono()
  .route("/models", modelConfigRouter)
  .route("/providers", providerConfigRouter)
  .get("/modelRegistry", async (c) => {
    try {
      const registry = await getFormattedModelRegistry();
      return c.json({
        success: true,
        message: "Model registry fetched successfully",
        data: registry,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch model registry",
          data: error.message,
        },
        500
      );
    }
  });
