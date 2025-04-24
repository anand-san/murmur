import { invoke } from "@tauri-apps/api/core";

/**
 * Invokes the backend to perform clipboard paste operations with the provided text
 *
 * This function calls the Rust backend command that handles:
 * 1. Saving the current clipboard content
 * 2. Setting the new text to clipboard
 * 3. Simulating CMD+V paste on macOS
 * 4. Restoring the original clipboard content
 * 5. Playing a sound notification
 *
 * @param text The text to paste
 * @returns Promise that resolves when operation is complete
 */
export const performClipboardPaste = async (text: string): Promise<void> => {
  try {
    await invoke("perform_clipboard_paste", { text });
  } catch (error) {
    console.error("Clipboard paste operation failed:", error);
    throw error;
  }
};
