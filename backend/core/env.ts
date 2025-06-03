import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5555"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  BACKEND_URL: z.string().default("http://localhost:5555"),
  BETTER_AUTH_SECRET: z.string(),
  RESEND_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  TTS_API_URL: z.string().optional(),
  TTS_API_KEY: z.string().optional(),
  TTS_MODEL: z.string().optional(),
  TTS_VOICE: z.string().optional(),
  STT_MODEL: z.string().optional(),
  STT_API_URL: z.string().optional(),
  STT_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  DATABASE_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);

export default env;
