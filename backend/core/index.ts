import app from "./app";
import { z } from "zod";

const ServeEnv = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3000")
    .transform(Number),
});
const ProcessEnv = ServeEnv.parse(process.env);

const server = Bun.serve({
  port: ProcessEnv.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  // Set timeout to 60 seconds to accommodate OpenAI API processing
  idleTimeout: 150,
});

// eslint-disable-next-line no-console -- Retain server running status
console.log("server running", server.port);
