import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import env from "./env";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./auth-schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
