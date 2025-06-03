import { ModelsProvider } from "./types";

// Models are now loaded dynamically from the backend API
// This is kept as a fallback for critical offline scenarios
export const FALLBACK_MODELS_REGISTRY: ModelsProvider = {
  providers: {
    google: {
      displayName: "Google",
      image: "/images/providers/google.png",
      models: [
        {
          id: "google:gemini-2.5-flash-preview-05-20",
          name: "Gemini 2.5 Flash",
        },
      ],
    },
  },
  defaultModelId: "google:gemini-2.5-flash-preview-05-20",
};

export const DEFAULT_MODEL_ID = "google:gemini-2.5-flash-preview-05-20";

export const API_BASE =
  import.meta.env.VITE_BACKEND_ENDPOINT || "http://localhost:5555";
