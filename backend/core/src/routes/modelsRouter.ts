import { Hono } from "hono";
import { modelsService } from "../service/modelsService";
import { authMiddleware } from "../middleware/authMiddleware";

const modelsRouter = new Hono()
  .use("/*", authMiddleware)
  .get("/", async (c) => {
    try {
      const models = await modelsService.getAvailableModels();
      return c.json({
        data: models,
      });
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return c.json({ error: "Failed to fetch available models" }, 500);
    }
  });

export { modelsRouter };
