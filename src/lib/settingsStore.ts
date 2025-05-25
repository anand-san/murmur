import { LazyStore } from "@tauri-apps/plugin-store";

export interface AppSettings {
  use_local_mode?: boolean;
  backend_url?: string;
}

const SETTINGS_FILE = "settings.json";
const settingsStore = new LazyStore(SETTINGS_FILE);

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_BACKEND_ENDPOINT || "http://localhost:5555";

export async function getAppSettings(): Promise<AppSettings> {
  console.log(`[${SETTINGS_FILE}] Attempting to get app settings...`);
  try {
    const rawUseLocalMode = await settingsStore.get<boolean>("use_local_mode");
    console.log(
      `[${SETTINGS_FILE}] Raw 'use_local_mode' from store:`,
      rawUseLocalMode
    );

    const rawBackendUrl = await settingsStore.get<string>("backend_url");
    console.log(
      `[${SETTINGS_FILE}] Raw 'backend_url' from store:`,
      rawBackendUrl
    );

    const settings = {
      use_local_mode: rawUseLocalMode === null ? false : rawUseLocalMode,
      backend_url: rawBackendUrl === null ? DEFAULT_BACKEND_URL : rawBackendUrl,
    };
    console.log(`[${SETTINGS_FILE}] Parsed settings:`, settings);
    return settings;
  } catch (error) {
    console.error(`[${SETTINGS_FILE}] Error getting app settings:`, error);
    const defaultSettings = {
      use_local_mode: false,
      backend_url: DEFAULT_BACKEND_URL,
    };
    console.log(
      `[${SETTINGS_FILE}] Returning default settings due to error:`,
      defaultSettings
    );
    return defaultSettings;
  }
}

export async function updateBackendUrl(newUrl: string): Promise<void> {
  console.log(
    `[${SETTINGS_FILE}] Attempting to update backend_url to:`,
    newUrl
  );
  try {
    await settingsStore.set("backend_url", newUrl);
    console.log(
      `[${SETTINGS_FILE}] 'backend_url' set in memory. Attempting to save...`
    );
    await settingsStore.save();
    console.log(
      `[${SETTINGS_FILE}] Store saved. Backend URL updated to:`,
      newUrl
    );
    const reReadValue = await settingsStore.get("backend_url");
    console.log(
      `[${SETTINGS_FILE}] Value for 'backend_url' after save & re-read:`,
      reReadValue
    );
  } catch (error) {
    console.error(`[${SETTINGS_FILE}] Error updating backend URL:`, error);
  }
}

export async function updateUseLocalMode(enable: boolean): Promise<void> {
  console.log(
    `[${SETTINGS_FILE}] Attempting to update use_local_mode to:`,
    enable
  );
  try {
    await settingsStore.set("use_local_mode", enable);
    console.log(
      `[${SETTINGS_FILE}] 'use_local_mode' set in memory. Attempting to save...`
    );
    await settingsStore.save();
    console.log(
      `[${SETTINGS_FILE}] Store saved. Use local mode set to:`,
      enable
    );
    const reReadValue = await settingsStore.get("use_local_mode");
    console.log(
      `[${SETTINGS_FILE}] Value for 'use_local_mode' after save & re-read:`,
      reReadValue
    );
  } catch (error) {
    console.error(`[${SETTINGS_FILE}] Error updating use_local_mode:`, error);
  }
}
