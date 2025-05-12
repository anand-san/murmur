import { api } from "../client"; // Assuming 'api' is your Hono RPC client instance

/**
 * Fetches the model registry from the backend API.
 * The registry includes available models and the default model ID.
 * @returns A promise resolving to the model registry data.
 */
export async function getModelRegistry() {
  // The path corresponds to how you've set up your Hono router:
  // .route("/config", modelConfigRouter) in app.ts
  // and modelConfigRouter.get("/model-registry", ...) in modelConfigRouter.ts
  // So the RPC path becomes api.config["model-registry"].$get()
  const res = await api.api.config["model-registry"].$get();

  if (!res.ok) {
    let errorMessage = "Failed to fetch model registry";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      if (errorData.details) {
        errorMessage += `: ${errorData.details}`;
      }
    } catch {
      // Ignore if parsing error data fails, use the generic message
    }
    throw new Error(errorMessage);
  }
  return (await res.json()) as {
    availableModels: {
      id: number;
      image: string | null;
      providerName: string; // User-friendly name
      providerSdkId: string; // SDK identifier
      baseUrl: string | null;
      models: {
        id: string; // model_sdk_id
        name: string;
      }[];
    }[];
    defaultModelId: string | null; // model_sdk_id
  };
}

// Type for creating/updating providers, mirroring backend Zod schema (excluding timestamps)
export interface ProviderData {
  name: string;
  provider_sdk_id: string;
  api_key: string;
  base_url?: string | null;
  image_url?: string | null;
}

export interface Provider {
  id: number;
  name: string;
  provider_sdk_id: string;
  base_url: string | null;
  api_key: string; // Note: Exposing API key, ensure backend handles this securely if needed.
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

export interface ProviderModel {
  id: number;
  provider_id: number;
  name: string;
  model_sdk_id: string;
  is_default: boolean;
  is_enabled: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * Fetches all providers.
 * @returns A promise resolving to an array of providers.
 */
export async function getProviders(): Promise<Provider[]> {
  const res = await api.api.config.providers.$get();
  if (!res.ok) {
    let errorMessage = "Failed to fetch providers";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return (await res.json()) as Provider[];
}

/**
 * Fetches a specific provider by ID.
 * @param id - The ID of the provider.
 * @returns A promise resolving to the provider data or null if not found.
 */
export async function getProviderById(id: number): Promise<Provider | null> {
  const res = await api.api.config.providers[":id"].$get({
    param: { id: id.toString() },
  });
  if (!res.ok) {
    if (res.status === 404) {
      return null; // Or throw a specific "Not Found" error if preferred
    }
    let errorMessage = "Failed to fetch provider";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return (await res.json()) as Provider;
}

/**
 * Creates a new provider.
 * @param data - The provider data.
 * @returns A promise resolving to the created provider data.
 */
export async function createProvider(data: ProviderData) {
  const res = await api.api.config.providers.$post({ json: data });
  if (!res.ok) {
    let errorMessage = "Failed to create provider";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json(); // Assuming backend returns the created provider
}

/**
 * Updates an existing provider.
 * @param id - The ID of the provider to update.
 * @param data - The partial provider data to update.
 * @returns A promise resolving to the updated provider data.
 */
export async function updateProvider(id: number, data: Partial<ProviderData>) {
  const res = await api.api.config.providers[":id"].$put({
    param: { id: id.toString() },
    json: data,
  });
  if (!res.ok) {
    let errorMessage = "Failed to update provider";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json(); // Assuming backend returns the updated provider
}

/**
 * Deletes a provider.
 * @param id - The ID of the provider to delete.
 * @returns A promise resolving to the deletion confirmation.
 */
export async function deleteProvider(id: number) {
  const res = await api.api.config.providers[":id"].$delete({
    param: { id: id.toString() },
  });
  if (!res.ok) {
    let errorMessage = "Failed to delete provider";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json(); // Assuming backend returns a confirmation message
}

// --- Model API Functions ---

// Type for creating/updating models, mirroring backend Zod schema (excluding timestamps)
export interface ModelData {
  name: string;
  provider_id: number;
  model_sdk_id: string;
  is_default?: boolean;
  is_enabled?: boolean;
}

/**
 * Fetches a specific model by ID.
 * @param id - The ID of the model.
 * @returns A promise resolving to the model data or null if not found.
 */
export async function getModelById(id: number): Promise<ProviderModel | null> {
  const res = await api.api.config.models[":id"].$get({
    param: { id: id.toString() },
  });
  if (!res.ok) {
    if (res.status === 404) {
      return null; // Or throw a specific "Not Found" error if preferred
    }
    let errorMessage = "Failed to fetch model";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return (await res.json()) as ProviderModel;
}

/**
 * Creates a new model for a provider.
 * @param data - The model data.
 * @returns A promise resolving to the created model data.
 */
export async function createModel(data: ModelData) {
  const res = await api.api.config.models.$post({ json: data });
  if (!res.ok) {
    let errorMessage = "Failed to create model";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

/**
 * Fetches all models for a specific provider.
 * @param providerId - The ID of the provider.
 * @returns A promise resolving to an array of models.
 */
export async function getModelsByProviderId(providerId: number) {
  const res = await api.api.config.models.provider[":providerId"].$get({
    param: { providerId: providerId.toString() },
  });
  if (!res.ok) {
    let errorMessage = "Failed to fetch models for provider";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json(); // Assuming backend returns array of models
}

/**
 * Updates an existing model.
 * @param id - The ID of the model to update.
 * @param data - The partial model data to update.
 * @returns A promise resolving to the updated model data.
 */
export async function updateModel(id: number, data: Partial<ModelData>) {
  // Note: provider_id is part of ModelData but usually not changed via update.
  // The backend ModelUpdateSchema makes it optional.
  const res = await api.api.config.models[":id"].$put({
    param: { id: id.toString() },
    json: data,
  });
  if (!res.ok) {
    let errorMessage = "Failed to update model";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

/**
 * Deletes a model.
 * @param id - The ID of the model to delete.
 * @returns A promise resolving to the deletion confirmation.
 */
export async function deleteModel(id: number) {
  const res = await api.api.config.models[":id"].$delete({
    param: { id: id.toString() },
  });
  if (!res.ok) {
    let errorMessage = "Failed to delete model";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

/**
 * Sets a model as the global default.
 * @param id - The ID of the model to set as default.
 * @returns A promise resolving to the updated model data.
 */
export async function setDefaultModelApi(id: number) {
  const res = await api.api.config.models[":id"]["set-default"].$post({
    param: { id: id.toString() },
  });
  if (!res.ok) {
    let errorMessage = "Failed to set model as default";
    try {
      const errorData = (await res.json()) as {
        error: string;
        details?: string;
      };
      errorMessage = errorData.error || errorMessage;
      if (errorData.details) errorMessage += `: ${errorData.details}`;
    } catch {
      /* Ignore */
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}
