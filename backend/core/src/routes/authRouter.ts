import { Hono } from "hono";
import { auth } from "../auth";

export const authRouter = new Hono();

authRouter.all("/*", (c) => {
  // Check if origin header is null or undefined and set a default in that case
  let req = c.req.raw;
  if (!req.headers.get("origin")) {
    req.headers.set("origin", "tauri://localhost");
  }

  return auth.handler(req);
});
