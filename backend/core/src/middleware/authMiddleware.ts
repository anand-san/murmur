import { Context, Next } from "hono";
import { auth } from "../auth";

export async function authMiddleware(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      console.log("No valid session found", c.req.raw.headers);
      return c.json({ error: "Unauthorized" }, 401);
    }

    console.log("Valid session found for user:", session.user.email);

    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
}

export function getCurrentUser(c: Context) {
  return c.get("user");
}

export function getCurrentSession(c: Context) {
  return c.get("session");
}
