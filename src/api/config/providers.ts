import { queryOptions } from "@tanstack/react-query";
import { api } from "../client";
import {
  type Provider,
  type ProviderModel,
  type CreateProviderInput,
  type UpdateProviderInput,
} from "../../../backend/core/src/db/providerService";

// Re-export types for easier access
export type {
  Provider,
  ProviderModel,
  CreateProviderInput,
  UpdateProviderInput,
};

export async function getAllProviders() {
  const res = await api.api.config.providers.$get();

  if (!res.ok) {
    let errorMessage = "Failed to get providers";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export const getAllProvidersQueryOptions = () =>
  queryOptions({
    queryKey: ["providers"],
    queryFn: () => getAllProviders(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export async function getProviderById(id: string) {
  const res = await api.api.config.providers[":id"].$get({
    param: { id },
  });

  if (!res.ok) {
    let errorMessage = "Failed to get provider";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export const getProviderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["provider", id],
    queryFn: () => getProviderById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export async function getProvidersByType(type: "chat" | "speech" | "image") {
  const res = await api.api.config.providers.type[":type"].$get({
    param: { type },
  });

  if (!res.ok) {
    let errorMessage = "Failed to get providers by type";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export const getProvidersByTypeQueryOptions = (
  type: "chat" | "speech" | "image"
) =>
  queryOptions({
    queryKey: ["providers", "type", type],
    queryFn: () => getProvidersByType(type),
    enabled: !!type,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export async function getProviderByName(name: string) {
  const res = await api.api.config.providers.name[":name"].$get({
    param: { name },
  });

  if (!res.ok) {
    let errorMessage = "Failed to get provider by name";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export const getProviderByNameQueryOptions = (name: string) =>
  queryOptions({
    queryKey: ["provider", "name", name],
    queryFn: () => getProviderByName(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  });

export async function createProvider(providerData: CreateProviderInput) {
  const res = await api.api.config.providers.$post({
    json: providerData,
  });

  if (!res.ok) {
    let errorMessage = "Failed to create provider";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function updateProvider({
  id,
  data,
}: {
  id: string;
  data: UpdateProviderInput;
}) {
  const res = await api.api.config.providers[":id"].$put({
    param: { id },
    json: data,
  });

  if (!res.ok) {
    let errorMessage = "Failed to update provider";

    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function deleteProvider(id: string) {
  const res = await api.api.config.providers[":id"].$delete({
    param: { id },
  });

  if (!res.ok) {
    let errorMessage = "Failed to delete provider";

    throw new Error(errorMessage);
  }
  return await res.json();
}
