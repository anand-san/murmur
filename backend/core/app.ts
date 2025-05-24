import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter } from "./src/routes/authRouter";
import { userRouter } from "./src/routes/userRouter";
import { chatRouter } from "./src/routes/chat/chatRouter";
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
    origin: (origin) => {
      console.log("CORS origin:", origin);
      if (origin.includes("localhost")) {
        return origin;
      }

      if (origin.includes("sandilya.dev")) {
        return origin;
      }
    },
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Set-Cookie",
      "X-Requested-With",
    ],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
  })
);

app.use("*", logger());

const apiRoutes = app
  .basePath("/api")
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authRouter)
  .route("/user", userRouter)
  .route("/chat", chatRouter)
  .route("/speech", speechRouter)
  .route("/image", imageRouter);

export default app;
export type ApiRoutes = typeof apiRoutes;
