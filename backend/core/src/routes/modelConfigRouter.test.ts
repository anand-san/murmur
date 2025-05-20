import { describe, it, expect, vi, beforeEach, Mocked } from "vitest";
import { testClient } from "hono/testing";
import { modelConfigRouter } from "./config/configRouter";
import * as modelConfigService from "../service/configService/modelConfigService";

// Mock the entire modelConfigService
vi.mock("../service/modelConfigService");

const mockedModelConfigService = modelConfigService as Mocked<
  typeof modelConfigService
>;

describe("Model Config Router", () => {
  let client: ReturnType<typeof testClient<typeof modelConfigRouter>>;

  beforeEach(() => {
    vi.resetAllMocks(); // Reset mocks before each test
    // Re-initialize client if needed, or ensure router is fresh if it holds state (Hono usually doesn't for routing)
    client = testClient(modelConfigRouter);
  });

  describe("Provider Endpoints", () => {
    // POST /providers
    describe("POST /providers", () => {
      it("should create a new provider successfully", async () => {
        const providerData = {
          name: "Test Provider",
          provider_sdk_id: "test-sdk",
          api_key: "test-key",
          base_url: "http://localhost/test",
        };
        const createdProvider = {
          id: 1,
          ...providerData,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          image_url: null,
        };

        mockedModelConfigService.createProvider.mockResolvedValue(
          createdProvider as any
        ); // Cast to any if type mismatch with schema

        const res = await client.providers.$post({ json: providerData });

        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(createdProvider);
        expect(mockedModelConfigService.createProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            ...providerData,
            created_at: expect.any(Number),
            updated_at: expect.any(Number),
          })
        );
      });

      it("should return 400 for invalid provider data", async () => {
        const invalidData = { name: "" }; // Missing required fields
        const res = await client.providers.$post({ json: invalidData as any }); // Cast to any for testing invalid shape
        expect(res.status).toBe(400); // Zod validation should fail
        // Optionally, check the error message structure if Hono/zValidator provides a consistent one
      });

      it("should return 500 if service fails to create provider", async () => {
        const providerData = {
          name: "Test Provider",
          provider_sdk_id: "test-sdk",
          api_key: "test-key",
        };
        mockedModelConfigService.createProvider.mockRejectedValue(
          new Error("Database error")
        );

        const res = await client.providers.$post({ json: providerData });

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to create provider",
          details: "Database error",
        });
      });
    });

    // GET /providers
    describe("GET /providers", () => {
      it("should return all providers", async () => {
        const providers = [
          {
            id: 1,
            name: "Provider 1",
            provider_sdk_id: "sdk1",
            api_key: "key1",
            base_url: null,
            image_url: null,
            created_at: 123,
            updated_at: 123,
          },
          {
            id: 2,
            name: "Provider 2",
            provider_sdk_id: "sdk2",
            api_key: "key2",
            base_url: null,
            image_url: null,
            created_at: 456,
            updated_at: 456,
          },
        ];
        mockedModelConfigService.getProviders.mockResolvedValue(
          providers as any
        );

        const res = await client.providers.$get();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(providers);
      });

      it("should return 500 if service fails to fetch providers", async () => {
        mockedModelConfigService.getProviders.mockRejectedValue(
          new Error("Fetch error")
        );
        const res = await client.providers.$get();
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to fetch providers",
          details: "Fetch error",
        });
      });
    });

    // GET /providers/:id
    describe("GET /providers/:id", () => {
      it("should return a provider by ID", async () => {
        const provider = {
          id: 1,
          name: "Test Provider",
          provider_sdk_id: "sdk1",
          api_key: "key1",
          base_url: null,
          image_url: null,
          created_at: 123,
          updated_at: 123,
        };
        mockedModelConfigService.getProviderById.mockResolvedValue(
          provider as any
        );

        const res = await client.providers[":id"].$get({ param: { id: "1" } });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(provider);
        expect(mockedModelConfigService.getProviderById).toHaveBeenCalledWith(
          1
        );
      });

      it("should return 404 if provider not found", async () => {
        mockedModelConfigService.getProviderById.mockResolvedValue(null as any);
        const res = await client.providers[":id"].$get({ param: { id: "99" } });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "Provider not found" });
      });

      it("should return 400 for invalid provider ID", async () => {
        const res = await client.providers[":id"].$get({
          param: { id: "abc" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid provider ID" });
      });

      it("should return 500 if service fails", async () => {
        mockedModelConfigService.getProviderById.mockRejectedValue(
          new Error("DB down")
        );
        const res = await client.providers[":id"].$get({ param: { id: "1" } });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to fetch provider",
          details: "DB down",
        });
      });
    });

    // PUT /providers/:id
    describe("PUT /providers/:id", () => {
      it("should update a provider successfully", async () => {
        const updateData = { name: "Updated Provider Name" };
        const updatedProvider = {
          id: 1,
          name: "Updated Provider Name",
          provider_sdk_id: "sdk1",
          api_key: "key1",
          base_url: null,
          image_url: null,
          created_at: 123,
          updated_at: Math.floor(Date.now() / 1000),
        };
        mockedModelConfigService.updateProvider.mockResolvedValue(
          updatedProvider as any
        );

        const res = await client.providers[":id"].$put({
          param: { id: "1" },
          json: updateData,
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(updatedProvider);
        expect(mockedModelConfigService.updateProvider).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: "Updated Provider Name",
            updated_at: expect.any(Number),
          })
        );
      });

      it("should return 400 for invalid provider ID", async () => {
        const res = await client.providers[":id"].$put({
          param: { id: "abc" },
          json: { name: "test" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid provider ID" });
      });

      it("should return 400 for no update data", async () => {
        const res = await client.providers[":id"].$put({
          param: { id: "1" },
          json: {},
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "No update data provided" });
      });

      it("should return 404 if provider to update not found", async () => {
        mockedModelConfigService.updateProvider.mockResolvedValue(null as any);
        const res = await client.providers[":id"].$put({
          param: { id: "99" },
          json: { name: "test" },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
          error: "Provider not found or no changes made",
        });
      });

      it("should return 500 if service fails to update", async () => {
        mockedModelConfigService.updateProvider.mockRejectedValue(
          new Error("Update failed")
        );
        const res = await client.providers[":id"].$put({
          param: { id: "1" },
          json: { name: "test" },
        });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to update provider",
          details: "Update failed",
        });
      });
    });

    // DELETE /providers/:id
    describe("DELETE /providers/:id", () => {
      it("should delete a provider successfully", async () => {
        const deletedProvider = {
          id: 1,
          name: "Test Provider",
          provider_sdk_id: "sdk1",
          api_key: "key1",
          base_url: null,
          image_url: null,
          created_at: 123,
          updated_at: 123,
        };
        mockedModelConfigService.deleteProvider.mockResolvedValue(
          deletedProvider as any
        );

        const res = await client.providers[":id"].$delete({
          param: { id: "1" },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          message: "Provider deleted successfully",
          provider: deletedProvider,
        });
        expect(mockedModelConfigService.deleteProvider).toHaveBeenCalledWith(1);
      });

      it("should return 404 if provider to delete not found", async () => {
        mockedModelConfigService.deleteProvider.mockResolvedValue(null as any);
        const res = await client.providers[":id"].$delete({
          param: { id: "99" },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "Provider not found" });
      });

      it("should return 400 for invalid provider ID", async () => {
        const res = await client.providers[":id"].$delete({
          param: { id: "abc" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid provider ID" });
      });

      it("should return 500 if service fails to delete", async () => {
        mockedModelConfigService.deleteProvider.mockRejectedValue(
          new Error("Delete error")
        );
        const res = await client.providers[":id"].$delete({
          param: { id: "1" },
        });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to delete provider",
          details: "Delete error",
        });
      });
    });
  });

  describe("Model Endpoints", () => {
    // POST /models
    describe("POST /models", () => {
      it("should create a new model successfully", async () => {
        const modelData = {
          name: "Test Model",
          provider_id: 1,
          model_sdk_id: "model-sdk-id",
          is_default: false,
          is_enabled: true,
        };
        const createdModel = {
          id: 1,
          ...modelData,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        };
        mockedModelConfigService.createModel.mockResolvedValue(
          createdModel as any
        );
        mockedModelConfigService.setDefaultModel.mockResolvedValue(
          undefined as any
        ); // If is_default is true

        const res = await client.models.$post({ json: modelData });

        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(createdModel);
        expect(mockedModelConfigService.createModel).toHaveBeenCalledWith(
          expect.objectContaining({
            ...modelData,
            created_at: expect.any(Number),
            updated_at: expect.any(Number),
          })
        );
        expect(mockedModelConfigService.setDefaultModel).not.toHaveBeenCalled();
      });

      it("should create a new model and set it as default", async () => {
        const modelData = {
          name: "Default Model",
          provider_id: 1,
          model_sdk_id: "default-model-sdk",
          is_default: true, // Set as default
        };
        const createdModel = {
          id: 2,
          ...modelData,
          is_enabled: true, // Default from router
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        };
        mockedModelConfigService.createModel.mockResolvedValue(
          createdModel as any
        );
        mockedModelConfigService.setDefaultModel.mockResolvedValue(
          createdModel as any
        );

        const res = await client.models.$post({ json: modelData });

        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(createdModel);
        expect(mockedModelConfigService.createModel).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Default Model",
            provider_id: 1,
            model_sdk_id: "default-model-sdk",
            is_default: true,
            is_enabled: true, // Router sets default if undefined
            created_at: expect.any(Number),
            updated_at: expect.any(Number),
          })
        );
        expect(mockedModelConfigService.setDefaultModel).toHaveBeenCalledWith(
          createdModel.id
        );
      });

      it("should return 400 for invalid model data", async () => {
        const invalidData = { name: "" }; // Missing required fields
        const res = await client.models.$post({ json: invalidData as any });
        expect(res.status).toBe(400);
      });

      it("should return 500 if service fails to create model", async () => {
        const modelData = {
          name: "Test Model",
          provider_id: 1,
          model_sdk_id: "model-sdk-id",
        };
        mockedModelConfigService.createModel.mockRejectedValue(
          new Error("DB error on model")
        );
        const res = await client.models.$post({ json: modelData });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to create model",
          details: "DB error on model",
        });
      });
    });

    // GET /models/provider/:providerId
    describe("GET /models/provider/:providerId", () => {
      it("should return models by provider ID", async () => {
        const models = [
          { id: 1, name: "Model A", provider_id: 1, model_sdk_id: "sdkA" },
        ];
        mockedModelConfigService.getModelsByProviderId.mockResolvedValue(
          models as any
        );
        const res = await client.models.provider[":providerId"].$get({
          param: { providerId: "1" },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(models);
        expect(
          mockedModelConfigService.getModelsByProviderId
        ).toHaveBeenCalledWith(1);
      });

      it("should return 400 for invalid provider ID", async () => {
        const res = await client.models.provider[":providerId"].$get({
          param: { providerId: "abc" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid provider ID" });
      });

      it("should return 500 if service fails", async () => {
        mockedModelConfigService.getModelsByProviderId.mockRejectedValue(
          new Error("Fetch models error")
        );
        const res = await client.models.provider[":providerId"].$get({
          param: { providerId: "1" },
        });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to fetch models for provider",
          details: "Fetch models error",
        });
      });
    });

    // GET /models/:id
    describe("GET /models/:id", () => {
      it("should return a model by ID", async () => {
        const model = {
          id: 1,
          name: "Model A",
          provider_id: 1,
          model_sdk_id: "sdkA",
        };
        mockedModelConfigService.getModelById.mockResolvedValue(model as any);
        const res = await client.models[":id"].$get({ param: { id: "1" } });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(model);
        expect(mockedModelConfigService.getModelById).toHaveBeenCalledWith(1);
      });

      it("should return 404 if model not found", async () => {
        mockedModelConfigService.getModelById.mockResolvedValue(null as any);
        const res = await client.models[":id"].$get({ param: { id: "99" } });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "Model not found" });
      });

      it("should return 400 for invalid model ID", async () => {
        const res = await client.models[":id"].$get({ param: { id: "abc" } });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid model ID" });
      });

      it("should return 500 if service fails", async () => {
        mockedModelConfigService.getModelById.mockRejectedValue(
          new Error("DB error")
        );
        const res = await client.models[":id"].$get({ param: { id: "1" } });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to fetch model",
          details: "DB error",
        });
      });
    });

    // PUT /models/:id
    describe("PUT /models/:id", () => {
      it("should update a model successfully", async () => {
        const updateData = { name: "Updated Model Name", is_enabled: false };
        const updatedModel = {
          id: 1,
          name: "Updated Model Name",
          provider_id: 1,
          model_sdk_id: "sdkA",
          is_default: false,
          is_enabled: false,
          updated_at: Math.floor(Date.now() / 1000),
        };
        mockedModelConfigService.updateModel.mockResolvedValue(
          updatedModel as any
        );
        mockedModelConfigService.setDefaultModel.mockResolvedValue(
          undefined as any
        );

        const res = await client.models[":id"].$put({
          param: { id: "1" },
          json: updateData,
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(updatedModel);
        expect(mockedModelConfigService.updateModel).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: "Updated Model Name",
            is_enabled: false,
            updated_at: expect.any(Number),
          })
        );
        expect(mockedModelConfigService.setDefaultModel).not.toHaveBeenCalled();
      });

      it("should update a model and set it as default", async () => {
        const updateData = { is_default: true };
        const modelAfterUpdate = {
          // Model state after service.updateModel
          id: 1,
          name: "Model A",
          provider_id: 1,
          model_sdk_id: "sdkA",
          is_default: true,
          is_enabled: true,
          updated_at: Math.floor(Date.now() / 1000),
        };
        mockedModelConfigService.updateModel.mockResolvedValue(
          modelAfterUpdate as any
        );
        // setDefaultModel might return the model again or just confirm
        mockedModelConfigService.setDefaultModel.mockResolvedValue(
          modelAfterUpdate as any
        );

        const res = await client.models[":id"].$put({
          param: { id: "1" },
          json: updateData,
        });

        expect(res.status).toBe(200);
        // The final response is from updateModel, setDefaultModel's return is not directly returned by this route handler
        expect(await res.json()).toEqual(modelAfterUpdate);
        expect(mockedModelConfigService.updateModel).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            is_default: true,
            updated_at: expect.any(Number),
          })
        );
        expect(mockedModelConfigService.setDefaultModel).toHaveBeenCalledWith(
          1
        );
      });

      it("should return 400 for invalid model ID", async () => {
        const res = await client.models[":id"].$put({
          param: { id: "abc" },
          json: { name: "test" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid model ID" });
      });

      it("should return 400 for no update data", async () => {
        const res = await client.models[":id"].$put({
          param: { id: "1" },
          json: {},
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "No update data provided" });
      });

      it("should return 404 if model to update not found", async () => {
        mockedModelConfigService.updateModel.mockResolvedValue(null as any);
        const res = await client.models[":id"].$put({
          param: { id: "99" },
          json: { name: "test" },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
          error: "Model not found or no changes made",
        });
      });

      it("should return 500 if service fails to update", async () => {
        mockedModelConfigService.updateModel.mockRejectedValue(
          new Error("Model update error")
        );
        const res = await client.models[":id"].$put({
          param: { id: "1" },
          json: { name: "test" },
        });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to update model",
          details: "Model update error",
        });
      });
    });

    // DELETE /models/:id
    describe("DELETE /models/:id", () => {
      it("should delete a model successfully", async () => {
        const deletedModel = { id: 1, name: "Test Model" };
        mockedModelConfigService.deleteModel.mockResolvedValue(
          deletedModel as any
        );
        const res = await client.models[":id"].$delete({ param: { id: "1" } });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          message: "Model deleted successfully",
          model: deletedModel,
        });
        expect(mockedModelConfigService.deleteModel).toHaveBeenCalledWith(1);
      });

      it("should return 404 if model to delete not found", async () => {
        mockedModelConfigService.deleteModel.mockResolvedValue(null as any);
        const res = await client.models[":id"].$delete({ param: { id: "99" } });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "Model not found" });
      });

      it("should return 400 for invalid model ID", async () => {
        const res = await client.models[":id"].$delete({
          param: { id: "abc" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid model ID" });
      });

      it("should return 500 if service fails to delete", async () => {
        mockedModelConfigService.deleteModel.mockRejectedValue(
          new Error("Model delete error")
        );
        const res = await client.models[":id"].$delete({ param: { id: "1" } });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to delete model",
          details: "Model delete error",
        });
      });
    });

    // POST /models/:id/set-default
    describe("POST /models/:id/set-default", () => {
      it("should set a model as default successfully", async () => {
        const updatedModel = { id: 1, name: "Default Model", is_default: true };
        mockedModelConfigService.setDefaultModel.mockResolvedValue(
          updatedModel as any
        );
        const res = await client.models[":id"]["set-default"].$post({
          param: { id: "1" },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          message: "Model set as default successfully",
          model: updatedModel,
        });
        expect(mockedModelConfigService.setDefaultModel).toHaveBeenCalledWith(
          1
        );
      });

      it("should return 404 if model to set default not found", async () => {
        mockedModelConfigService.setDefaultModel.mockRejectedValue(
          new Error("Model with ID 99 not found") // Service throws specific error
        );
        const res = await client.models[":id"]["set-default"].$post({
          param: { id: "99" },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: "Model not found" });
      });

      it("should return 400 for invalid model ID", async () => {
        const res = await client.models[":id"]["set-default"].$post({
          param: { id: "abc" },
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid model ID" });
      });

      it("should return 500 if service fails for other reasons", async () => {
        mockedModelConfigService.setDefaultModel.mockRejectedValue(
          new Error("Some other DB error")
        );
        const res = await client.models[":id"]["set-default"].$post({
          param: { id: "1" },
        });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          error: "Failed to set model as default",
          details: "Some other DB error",
        });
      });
    });
  });

  // GET /model-registry
  describe("GET /model-registry", () => {
    it("should return the formatted model registry", async () => {
      const registry = { provider1: [{ id: 1, name: "ModelA" }] };
      mockedModelConfigService.getFormattedModelRegistry.mockResolvedValue(
        registry as any
      );
      const res = await client["model-registry"].$get();
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(registry);
    });

    it("should return 500 if service fails to fetch registry", async () => {
      mockedModelConfigService.getFormattedModelRegistry.mockRejectedValue(
        new Error("Registry fetch error")
      );
      const res = await client["model-registry"].$get();
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: "Failed to fetch model registry",
        details: "Registry fetch error",
      });
    });
  });
});
