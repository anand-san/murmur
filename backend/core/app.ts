import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRouter } from "./src/routes/chatRouter";
import { speechRouter } from "./src/routes/speechRouter";
import { imageRouter } from "./src/routes/imageRouter";

const app = new Hono();

app.onError((err: unknown, ctx: Context) => {
  console.error("Error occurred:", err);
  return ctx.json({ error: "Something went horribly wrong" }, 500);
});

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", logger());

const apiRoutes = app
  .basePath("/api")
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/chat", chatRouter)
  .route("/speech", speechRouter)
  .route("/image", imageRouter);

export default app;
export type ApiRoutes = typeof apiRoutes;
