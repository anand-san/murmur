import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, getCurrentUser } from "../middleware/authMiddleware";
import { UserSettingsService } from "../service/user/settings";

const UpdateSettingsSchema = z.object({
  settings: z.record(z.any()),
});

export const userRouter = new Hono()
  .use("/*", authMiddleware)

  .get("/profile", async (c) => {
    const user = getCurrentUser(c);
    return c.json({ user });
  })

  .get("/settings", async (c) => {
    const user = getCurrentUser(c);
    try {
      const settings = await UserSettingsService.getUserSettings(user.id);
      return c.json({ settings });
    } catch (error) {
      console.error("Error getting user settings:", error);
      return c.json({ error: "Failed to get user settings" }, 500);
    }
  })

  .put("/settings", zValidator("json", UpdateSettingsSchema), async (c) => {
    const user = getCurrentUser(c);
    const { settings } = c.req.valid("json");

    try {
      await UserSettingsService.updateUserSettings(user.id, settings);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error updating user settings:", error);
      return c.json({ error: "Failed to update user settings" }, 500);
    }
  });
