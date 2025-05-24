import { Hono } from "hono";
import { auth } from "../auth";

export const authRouter = new Hono();

authRouter.all("/*", (c) => {
  return auth.handler(c.req.raw);
});
