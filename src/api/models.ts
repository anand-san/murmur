import { api } from "./client";

export async function getAvailableModels() {
  const res = await api.api.models.$get();

  if (!res.ok) {
    let errorMessage = "Failed to load chat messages";
    try {
      const error = await res.json();
      if ("error" in error) {
        errorMessage = error.error || errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.data;
}
