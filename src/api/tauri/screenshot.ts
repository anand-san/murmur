import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn, listen, once } from "@tauri-apps/api/event";

// Status type for screenshot progress updates
export interface ScreenshotStatus {
  status: string; // "processing", "idle", "error"
  progress?: number;
  error?: string;
}

// Status callback type
export type ScreenshotStatusCallback = (status: ScreenshotStatus) => void;

// Event constants
const EVENT_SCREENSHOT_STATUS = "screenshot:status";
const EVENT_SCREENSHOT_RESULT = "screenshot:result";
const EVENT_SCREENSHOT_ERROR = "screenshot:error";

/**
 * Captures the primary screen using the backend command.
 *
 * The backend processes screenshot capture asynchronously and sends events
 * for status updates, the result, and any errors.
 *
 * @param onStatusUpdate Optional callback for receiving real-time status updates
 * @returns A Promise that resolves with a File object containing the screenshot,
 *          or rejects with an error message if the capture fails.
 */
export async function captureScreenshot(
  onStatusUpdate?: ScreenshotStatusCallback
): Promise<string> {
  console.log("Starting screenshot capture...");

  // Set up status event listener if a callback was provided
  let statusUnlisten: (() => void) | undefined;

  if (onStatusUpdate) {
    try {
      statusUnlisten = await listen<ScreenshotStatus>(
        EVENT_SCREENSHOT_STATUS,
        (event) => {
          onStatusUpdate(event.payload);
        }
      );
    } catch (err) {
      console.error("Failed to set up screenshot status listener:", err);
    }
  }

  try {
    // Create a promise that will be resolved when we receive the screenshot
    // or rejected if we receive an error
    const resultPromise = new Promise<string>((resolve, reject) => {
      // Set up one-time result listeners - these will automatically be removed after triggered once
      let resultUnlisten: UnlistenFn | null = null;
      let errorUnlisten: UnlistenFn | null = null;

      const setupListeners = async () => {
        try {
          // Listen for the successful result
          resultUnlisten = await once<string>(
            EVENT_SCREENSHOT_RESULT,
            (event) => {
              console.log("Screenshot captured successfully (Base64 received)");
              resolve(event.payload);
              // Clean up error listener since we got a successful result
              if (errorUnlisten) errorUnlisten();
            }
          );

          // Listen for errors
          errorUnlisten = await once<string>(
            EVENT_SCREENSHOT_ERROR,
            (event) => {
              console.error("Screenshot capture failed:", event.payload);
              reject(new Error(event.payload));
              // Clean up result listener since we got an error
              if (resultUnlisten) resultUnlisten();
            }
          );
        } catch (err) {
          console.error("Failed to set up event listeners:", err);
          reject(new Error("Failed to set up screenshot event listeners"));
        }
      };

      // Set up the listeners
      setupListeners();
    });

    // Invoke the command to start the screenshot process
    // This returns immediately while processing continues in the background
    await invoke("capture_screenshot");

    // Wait for either the result or an error
    return await resultPromise;
  } finally {
    // Clean up the status event listener if it exists
    if (statusUnlisten) {
      statusUnlisten();
    }
  }
}
