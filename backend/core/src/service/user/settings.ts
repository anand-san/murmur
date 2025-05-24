import { eq } from "drizzle-orm";
import { db } from "../../db";
import { userSettings } from "../../db/schema";

export class UserSettingsService {
  static async getUserSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return settings?.settings || {};
  }

  static async updateUserSettings(
    userId: string,
    newSettings: Record<string, any>
  ) {
    await db
      .insert(userSettings)
      .values({ userId, settings: newSettings })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          settings: newSettings,
          updatedAt: new Date(),
        },
      });
  }
}
