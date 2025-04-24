import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { providerService } from "../../db/providerService";

// Zod schemas for validation
const ProviderModelSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const CreateProviderSchema = z.object({
  providerName: z.string(),
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  availableModels: z.array(ProviderModelSchema).optional(),
  nickName: z.string(),
  modelType: z.enum(["chat", "speech", "image"]),
  default: z.boolean().optional(),
});

const UpdateProviderSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  availableModels: z.array(ProviderModelSchema).optional(),
  nickName: z.string().optional(),
  default: z.boolean().optional(),
});

export const providersConfigRouter = new Hono()
  // Get all providers
  .get("/", async (c) => {
    try {
      const providers = await providerService.getAll();
      return c.json({ providers });
    } catch (error) {
      console.error("Failed to get providers:", error);
      return c.json(
        {
          error: "Failed to get providers",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Get provider by ID
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const provider = await providerService.getById(id);

      if (!provider) {
        return c.json({ error: "Provider not found" }, 404);
      }

      return c.json({ provider });
    } catch (error) {
      console.error(
        `Failed to get provider by ID: ${c.req.param("id")}`,
        error
      );
      return c.json(
        {
          error: "Failed to get provider",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Get providers by type
  .get("/type/:type", async (c) => {
    try {
      const typeParam = c.req.param("type");

      // Validate type parameter
      if (!["chat", "speech", "image"].includes(typeParam)) {
        return c.json(
          { error: "Invalid type. Must be 'chat', 'speech', or 'image'" },
          400
        );
      }

      const type = typeParam as "chat" | "speech" | "image";
      const providers = await providerService.getByType(type);

      return c.json({ providers });
    } catch (error) {
      console.error(
        `Failed to get providers by type: ${c.req.param("type")}`,
        error
      );
      return c.json(
        {
          error: "Failed to get providers by type",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Get provider by name
  .get("/name/:name", async (c) => {
    try {
      const name = c.req.param("name");
      const provider = await providerService.getByName(name);

      if (!provider) {
        return c.json({ error: "Provider not found" }, 404);
      }

      return c.json({ provider });
    } catch (error) {
      console.error(
        `Failed to get provider by name: ${c.req.param("name")}`,
        error
      );
      return c.json(
        {
          error: "Failed to get provider by name",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Create a new provider
  .post("/", zValidator("json", CreateProviderSchema), async (c) => {
    try {
      const providerData = c.req.valid("json");
      const provider = await providerService.create(providerData);

      return c.json({ provider }, 201);
    } catch (error) {
      console.error("Failed to create provider:", error);
      return c.json(
        {
          error: "Failed to create provider",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Update a provider
  .put("/:id", zValidator("json", UpdateProviderSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const updateData = c.req.valid("json");

      const provider = await providerService.update(id, updateData);

      if (!provider) {
        return c.json({ error: "Provider not found" }, 404);
      }

      return c.json({ provider });
    } catch (error) {
      console.error(`Failed to update provider: ${c.req.param("id")}`, error);
      return c.json(
        {
          error: "Failed to update provider",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  })

  // Delete a provider
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const result = await providerService.delete(id);

      return c.json({ success: result });
    } catch (error) {
      console.error(`Failed to delete provider: ${c.req.param("id")}`, error);
      return c.json(
        {
          error: "Failed to delete provider",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
