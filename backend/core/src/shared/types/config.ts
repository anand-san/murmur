import { z } from "zod";

export const ALLOWED_PROVIDERS = [
  "openai",
  "anthropic",
  "groq",
  "mistral",
  "deepseek",
  "google",
] as const;

export const ALLOWED_MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-3-5-sonnet", "claude-3-5-haiku"],
  groq: ["llama-3-8b-8192", "llama-3-70b-8192"],
  mistral: ["mistral-large-latest", "mistral-small-latest"],
  deepseek: ["deepseek-coder", "deepseek-coder-plus"],
  google: ["gemini-1.5-pro", "gemini-1.5-flash"],
} as const;

export const ModelCreateSchema = z.object({
  name: z.string().min(1),
  provider_id: z.enum(ALLOWED_PROVIDERS),
  model_id: z.string().min(1),
  is_default: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
});

export const ModelUpdateSchema = ModelCreateSchema.pick({
  name: true,
  is_default: true,
  is_enabled: true,
});

export const ProviderCreateSchema = z.object({
  name: z.string().min(1),
  provider_id: z.enum(ALLOWED_PROVIDERS),
  api_key: z.string().min(1),
  base_url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export const ProviderUpdateSchema = ProviderCreateSchema.pick({
  name: true,
  api_key: true,
  base_url: true,
  image_url: true,
});
