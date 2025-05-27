import { ModelProvider } from "./types";

export const availableModelsRegistry: ModelProvider[] = [
  {
    image: "/images/providers/groq.png",
    providerName: "Groq",
    models: [
      {
        id: "groq:meta-llama/llama-4-scout-17b-16e-instruct",
        name: "Llama 4 Scout 17b",
      },
      { id: "qwen-qwq-32b", name: "Qwen 32b" },
      { id: "groq:deepseek-r1-distill-qwen-32b", name: "Deepseek r1 32b Qwen" },
      {
        id: "groq:deepseek-r1-distill-llama-70b",
        name: "Deepseek r1 32b Llama",
      },
      { id: "groq:llama-3.3-70b-versatile", name: "Llama 3.3 70b" },
    ],
  },
  {
    image: "/images/providers/anthropic.png",
    providerName: "Anthropic",
    models: [
      { id: "anthropic:claude-opus-4-20250514", name: "Claude 4 Opus" },
      { id: "anthropic:claude-sonnet-4-20250514", name: "Claude 4 Sonnet" },
      { id: "anthropic:claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet" },
      { id: "anthropic:claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet" },
      { id: "anthropic:claude-3-7-haiku-latest", name: "Claude 3.7 Haiku" },
    ],
  },
  {
    image: "/images/providers/openai.png",
    providerName: "OpenAI",
    models: [
      { id: "openai:gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "openai:gpt-4o", name: "GPT-4o" },
    ],
  },
  {
    image: "/images/providers/deepseek.png",
    providerName: "DeepSeek",
    models: [
      { id: "deepseek:deepseek-chat", name: "DeepSeek Chat" },
      { id: "deepseek:deepseek-reasoner", name: "DeepSeek Reasoner" },
    ],
  },
  {
    image: "/images/providers/google.png",
    providerName: "Google",
    models: [
      { id: "google:gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro" },
      { id: "google:gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash" },
    ],
  },
  {
    image: "/images/providers/mistral.png",
    providerName: "Mistral",
    models: [
      { id: "mistral:mistral-large-latest", name: "Mistral Large" },
      { id: "mistral:mistral-medium-latest	", name: "Mistral Medium 25.05" },
      { id: "mistral:mistral-saba-latest", name: "Mistral Saba" },
    ],
  },
];

export const DEFAULT_MODEL_ID = "google:gemini-2.5-flash-preview-05-20";

export const API_BASE =
  import.meta.env.VITE_BACKEND_ENDPOINT || "http://localhost:5555";
