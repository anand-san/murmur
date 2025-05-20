import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { encrypt } from "../../utils/crypto";
import { z } from "zod";
import {
  createProvider,
  getProviders,
  getProviderBySdkId,
  updateProvider,
  deleteProvider,
} from "../../service/configService/providerConfigService";
import {
  ProviderCreateSchema,
  ProviderUpdateSchema,
} from "../../shared/types/config";

export const providerConfigRouter = new Hono()
  .post("/", zValidator("json", ProviderCreateSchema), async (c) => {
    const data = c.req.valid("json");
    try {
      const { encryptedData: encryptedApiKey, iv } = encrypt(data.api_key);

      const newProvider = await createProvider({
        ...data,
        api_key: encryptedApiKey,
        iv,
      });

      return c.json(
        {
          success: true,
          message: "Provider created successfully",
          data: newProvider,
        },
        201
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to create provider",
          data: error.message,
        },
        500
      );
    }
  })
  .get("/", async (c) => {
    try {
      const allProviders = await getProviders();
      return c.json(
        {
          success: true,
          message: "Providers fetched successfully",
          data: allProviders,
        },
        200
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch providers",
          data: error.message,
        },
        500
      );
    }
  })
  .get("/:provider_id", async (c) => {
    const provider_id = c.req.param("provider_id");
    if (!provider_id) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    try {
      const provider = await getProviderBySdkId(provider_id);
      if (!provider) {
        return c.json({ error: "Provider not found" }, 404);
      }
      return c.json(
        {
          success: true,
          message: "Provider fetched successfully",
          data: provider,
        },
        200
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch provider",
          data: error.message,
        },
        500
      );
    }
  })
  .put("/:provider_id", zValidator("json", ProviderUpdateSchema), async (c) => {
    const provider_id = c.req.param("provider_id");
    if (!provider_id) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    const data = c.req.valid("json");
    try {
      if (Object.keys(data).length === 0) {
        return c.json({ error: "No update data provided" }, 400);
      }
      const updatedProvider = await updateProvider(provider_id, data);
      if (!updatedProvider) {
        return c.json({ error: "Provider not found or no changes made" }, 404);
      }
      return c.json(
        {
          success: true,
          message: "Provider updated successfully",
          data: updatedProvider,
        },
        200
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to update provider",
          data: error.message,
        },
        500
      );
    }
  })
  .delete("/:provider_id", async (c) => {
    const provider_id = c.req.param("provider_id");
    if (!provider_id) {
      return c.json({ error: "Invalid provider ID" }, 400);
    }
    try {
      const deletedProvider = await deleteProvider(provider_id);
      if (!deletedProvider) {
        return c.json({ error: "Provider not found" }, 404);
      }
      return c.json(
        {
          success: true,
          message: "Provider deleted successfully",
          data: deletedProvider,
        },
        200
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          message: "Failed to delete provider",
          data: error.message,
        },
        500
      );
    }
  });
