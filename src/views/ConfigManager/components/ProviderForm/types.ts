import {
  type Provider,
  type ProviderModel,
} from "../../../../api/config/providers";

// Form data type
export interface FormData {
  providerName: string;
  nickName: string;
  apiKey: string;
  baseUrl?: string;
  models: string;
  isDefault: boolean;
}

// Common props for all step components
export interface StepProps {
  formMethods: any; // We'll use any here to avoid React Hook Form typing complexities
  onNext?: () => void;
  onPrevious?: () => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  provider?: Provider;
}

// Provider options by model type
export const PROVIDER_OPTIONS = {
  chat: [
    { label: "OpenAI", value: "openai" },
    { label: "Anthropic", value: "anthropic" },
    { label: "Google", value: "google" },
    { label: "Mistral", value: "mistral" },
    { label: "Groq", value: "groq" },
    { label: "Ollama", value: "ollama" },
  ],
  speech: [
    { label: "OpenAI Compatible", value: "openai" },
    { label: "Custom", value: "Custom" },
  ],
  image: [{ label: "Groq", value: "groq" }],
};

// Parse models from text to array format
export const parseModels = (modelsText: string): ProviderModel[] => {
  return modelsText
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [label, value] = line.split(":").map((part) => part.trim());
      return { label: label || value, value: value || label };
    });
};
