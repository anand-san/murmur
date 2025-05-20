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
