import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  createModel,
  setDefaultModel,
  getModelsByProviderId,
  getModelById,
  updateModel,
  deleteModel,
} from "../../service/configService/modelConfigService";
import { getProviderBySdkId } from "../../service/configService/providerConfigService";
import {
  ModelCreateSchema,
  ModelUpdateSchema,
} from "../../shared/types/config";

export const modelConfigRouter = new Hono()
  .post("/", zValidator("json", ModelCreateSchema), async (c) => {
    const data = c.req.valid("json");
    try {
      const provider = await getProviderBySdkId(data.provider_id);
      if (!provider) {
        return c.json(
          {
            success: false,
            message: "Provider not found",
            data: null,
          },
          404
        );
      }
      const model = await getModelById(data.model_id);
      if (model) {
        return c.json(
          {
            success: false,
            message: "Model already exists",
            data: null,
          },
          400
        );
      }

      const newModel = await createModel({
        ...data,
        is_default: data.is_default === undefined ? false : data.is_default,
        is_enabled: data.is_enabled === undefined ? true : data.is_enabled,
      });

      if (newModel.is_default) {
        await setDefaultModel(newModel.id);
      }
      return c.json(
        {
          success: true,
          message: "Model created successfully",
          data: newModel,
        },
        201
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to create model",
          data: error.message,
        },
        500
      );
    }
  })
  .get("/provider/:providerId", async (c) => {
    const providerId = c.req.param("providerId");
    if (!providerId) {
      throw new Error("Invalid provider ID");
    }
    try {
      const models = await getModelsByProviderId(providerId);
      return c.json({
        success: true,
        message: "Models fetched successfully",
        data: models,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch models for provider",
          data: error.message,
        },
        500
      );
    }
  })
  .get("/:model_id", async (c) => {
    const model_id = c.req.param("model_id");
    if (!model_id) {
      throw new Error("Invalid model ID");
    }
    try {
      const model = await getModelById(model_id);
      if (!model) {
        return c.json(
          {
            success: false,
            message: "Model not found",
            data: null,
          },
          404
        );
      }

      return c.json({
        success: true,
        message: "Model fetched successfully",
        data: model,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch model",
          data: error.message,
        },
        500
      );
    }
  })

  .put("/:model_id", zValidator("json", ModelUpdateSchema), async (c) => {
    const model_id = c.req.param("model_id");
    if (!model_id) {
      throw new Error("Invalid model ID");
    }
    const data = c.req.valid("json");
    try {
      if (Object.keys(data).length === 0) {
        throw new Error("No update data provided");
      }

      const updatedModel = await updateModel(model_id, {
        ...data,
      });

      if (!updatedModel) {
        throw new Error("Model not found or no changes made");
      }

      if (data.is_default === true && updatedModel.is_default) {
        await setDefaultModel(updatedModel.id);
      }

      return c.json(
        {
          success: true,
          message: "Model updated successfully",
          data: updatedModel,
        },
        200
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to update model",
          data: error.message,
        },
        500
      );
    }
  })

  .delete("/:model_id", async (c) => {
    const model_id = c.req.param("model_id");
    if (!model_id) {
      throw new Error("Invalid model ID");
    }
    try {
      const deletedModel = await deleteModel(model_id);
      if (!deletedModel) {
        throw new Error("Model not found");
      }
      return c.json({
        success: true,
        message: "Model deleted successfully",
        data: deletedModel,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to delete model",
          data: error.message,
        },
        500
      );
    }
  })
  .post("/:model_id/set-default", async (c) => {
    const model_id = c.req.param("model_id");
    if (!model_id) {
      throw new Error("Invalid model ID");
    }
    try {
      const updatedModel = await setDefaultModel(model_id);

      return c.json({
        success: true,
        message: "Model set as default successfully",
        data: updatedModel,
      });
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.message && error.message.includes("not found")) {
        errorMessage = "Model not found";
      }
      return c.json(
        {
          success: false,
          message: "Failed to set model as default",
          data: errorMessage,
        },
        500
      );
    }
  });
