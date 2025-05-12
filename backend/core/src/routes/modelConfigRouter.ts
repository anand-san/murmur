import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as modelConfigService from "../service/modelConfigService";
import { providers, providerModels } from "../db/schema"; // For Zod schema inference

// Zod Schemas for Validation
const ProviderCreateSchema = z.object({
  name: z.string().min(1),
  provider_sdk_id: z.string().min(1),
  api_key: z.string().min(1),
  base_url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  // created_at and updated_at will be handled by the service/db
});

const ProviderUpdateSchema = ProviderCreateSchema.partial();

const ModelCreateSchema = z.object({
  name: z.string().min(1),
  provider_id: z.number().int().positive(),
  model_sdk_id: z.string().min(1),
  is_default: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  // created_at and updated_at will be handled by the service/db
});

const ModelUpdateSchema = ModelCreateSchema.partial().extend({
  // Ensure provider_id is not updatable through this schema,
  // as changing a model's provider is usually a more complex operation (delete and recreate).
  // If provider_id needs to be updatable, it can be added here.
  // For now, we assume it's fixed once created.
  provider_id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Provider ID is generally not changed after creation."),
});

export const modelConfigRouter = new Hono()
  .post("/providers", zValidator("json", ProviderCreateSchema), async (c) => {
    const data = c.req.valid("json");
    try {
      const newProvider = await modelConfigService.createProvider({
        ...data,
        // Timestamps should be set by the database or service if not auto-generated
        // For now, assuming they are handled by Drizzle's default or will be added
        created_at: Math.floor(Date.now() / 1000), // Unix timestamp
        updated_at: Math.floor(Date.now() / 1000), // Unix timestamp
      });
      return c.json(newProvider, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create provider", details: error.message },
        500
      );
    }
  })
  .get("/providers", async (c) => {
    try {
      const allProviders = await modelConfigService.getProviders();
      return c.json(allProviders);
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch providers", details: error.message },
        500
      );
    }
  })
  .get("/providers/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    try {
      const provider = await modelConfigService.getProviderById(id);
      if (!provider) {
        return c.json({ error: "Provider not found" }, 404);
      }
      return c.json(provider);
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch provider", details: error.message },
        500
      );
    }
  })
  .put(
    "/providers/:id",
    zValidator("json", ProviderUpdateSchema),
    async (c) => {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        return c.json({ error: "Invalid provider ID" }, 400);
      }
      const data = c.req.valid("json");
      try {
        // Ensure there's at least one field to update
        if (Object.keys(data).length === 0) {
          return c.json({ error: "No update data provided" }, 400);
        }
        const updatedProvider = await modelConfigService.updateProvider(id, {
          ...data,
          updated_at: Math.floor(Date.now() / 1000), // Update timestamp
        });
        if (!updatedProvider) {
          return c.json(
            { error: "Provider not found or no changes made" },
            404
          );
        }
        return c.json(updatedProvider);
      } catch (error: any) {
        return c.json(
          { error: "Failed to update provider", details: error.message },
          500
        );
      }
    }
  )
  .delete("/providers/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    try {
      // Note: This assumes that if a provider is deleted,
      // related models should also be handled (e.g., cascade delete in DB or prevent deletion if models exist).
      // The current service.deleteProvider does not handle this explicitly.
      // For a robust solution, ensure foreign key constraints are set up for cascading deletes
      // or add logic to delete/disassociate models first.
      const deletedProvider = await modelConfigService.deleteProvider(id);
      if (!deletedProvider) {
        return c.json({ error: "Provider not found" }, 404);
      }
      return c.json({
        message: "Provider deleted successfully",
        provider: deletedProvider,
      });
    } catch (error: any) {
      // Catching potential errors, e.g., foreign key violation if models are not handled
      return c.json(
        { error: "Failed to delete provider", details: error.message },
        500
      );
    }
  })
  .post("/models", zValidator("json", ModelCreateSchema), async (c) => {
    const data = c.req.valid("json");
    try {
      const newModel = await modelConfigService.createModel({
        ...data,
        // Timestamps and default values for is_default/is_enabled are handled by DB/service
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        is_default: data.is_default === undefined ? false : data.is_default, // Explicitly set default if not provided
        is_enabled: data.is_enabled === undefined ? true : data.is_enabled, // Explicitly set default if not provided
      });
      // If is_default was true, ensure it's the only default
      if (newModel.is_default) {
        await modelConfigService.setDefaultModel(newModel.id);
      }
      return c.json(newModel, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create model", details: error.message },
        500
      );
    }
  })
  .get("/models/provider/:providerId", async (c) => {
    const providerId = parseInt(c.req.param("providerId"));
    if (isNaN(providerId)) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    try {
      const models = await modelConfigService.getModelsByProviderId(providerId);
      return c.json(models);
    } catch (error: any) {
      return c.json(
        {
          error: "Failed to fetch models for provider",
          details: error.message,
        },
        500
      );
    }
  })
  .get("/models/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid model ID" }, 400);
    }
    try {
      const model = await modelConfigService.getModelById(id);
      if (!model) {
        return c.json({ error: "Model not found" }, 404);
      }
      return c.json(model);
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch model", details: error.message },
        500
      );
    }
  })
  .put("/models/:id", zValidator("json", ModelUpdateSchema), async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid model ID" }, 400);
    }
    const data = c.req.valid("json");
    try {
      if (Object.keys(data).length === 0) {
        return c.json({ error: "No update data provided" }, 400);
      }

      // Prevent changing provider_id if it's in the payload and not allowed
      if (data.provider_id !== undefined) {
        // If you want to strictly prevent updating provider_id, you can either:
        // 1. Remove provider_id from ModelUpdateSchema (already done by making it optional and described)
        // 2. Add a check here and return an error if data.provider_id is present.
        // For now, we'll assume the schema's optional nature is enough,
        // and the service layer would handle it if it were to change.
        // delete data.provider_id; // Or handle as an error
      }

      const updatedModel = await modelConfigService.updateModel(id, {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      });

      if (!updatedModel) {
        return c.json({ error: "Model not found or no changes made" }, 404);
      }

      // If is_default was set to true in the update, ensure it's the only default
      if (data.is_default === true && updatedModel.is_default) {
        // Check updatedModel to be sure
        await modelConfigService.setDefaultModel(updatedModel.id);
      }
      // Note: Handling unsetting a default is implicitly managed by `setDefaultModel`
      // when another model is set as default. If a model is just updated to `is_default: false`
      // without another being set, it simply becomes not the default.

      return c.json(updatedModel);
    } catch (error: any) {
      return c.json(
        { error: "Failed to update model", details: error.message },
        500
      );
    }
  })
  .delete("/models/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid model ID" }, 400);
    }
    try {
      const deletedModel = await modelConfigService.deleteModel(id);
      if (!deletedModel) {
        return c.json({ error: "Model not found" }, 404);
      }
      return c.json({
        message: "Model deleted successfully",
        model: deletedModel,
      });
    } catch (error: any) {
      return c.json(
        { error: "Failed to delete model", details: error.message },
        500
      );
    }
  })
  .post("/models/:id/set-default", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid model ID" }, 400);
    }
    try {
      const updatedModel = await modelConfigService.setDefaultModel(id);
      // setDefaultModel should throw an error if the model isn't found,
      // which will be caught by the catch block.
      return c.json({
        message: "Model set as default successfully",
        model: updatedModel,
      });
    } catch (error: any) {
      // Check if the error is due to "Model not found" from the service layer
      if (error.message && error.message.includes("not found")) {
        return c.json({ error: "Model not found" }, 404);
      }
      return c.json(
        { error: "Failed to set model as default", details: error.message },
        500
      );
    }
  })
  .get("/model-registry", async (c) => {
    try {
      const registry = await modelConfigService.getFormattedModelRegistry();
      return c.json(registry);
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch model registry", details: error.message },
        500
      );
    }
  });
