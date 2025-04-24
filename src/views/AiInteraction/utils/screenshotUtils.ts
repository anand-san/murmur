import {
  ScreenshotStatusCallback,
  captureScreenshot,
} from "../../../api/tauri/screenshot";
import { API_BASE } from "./constants";

/**
 * Processes an image using the backend vision API
 *
 * @param base64Image The base64-encoded image data (including the data URL prefix)
 * @param prompt Optional text prompt to send along with the image
 * @param modelId Optional model ID to use (default is llama-3.2-11b-vision-preview)
 * @returns A promise that resolves with the text description of the image
 */
export async function processImageWithVision(
  base64Image: string,
  prompt: string = "This is a screenshot of a user's screen, We need to analyze what they are doing and extract all the text and images from the screen in order to support them on their question.",
  modelId?: string
): Promise<string> {
  try {
    // Send the base64 image to our backend vision API
    const apiUrl = API_BASE + "/vision";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64Image}`,
        prompt,
        modelId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vision API request failed:", response.status, errorText);
      throw new Error(
        `Vision API request failed: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Vision API response received");
    return result.text;
  } catch (error) {
    console.error("Error processing image with vision:", error);
    throw error;
  }
}

/**
 * Captures a screenshot and processes it with the vision API in one step
 *
 * @param prompt Optional text prompt to send along with the image
 * @param modelId Optional model ID to use
 * @param onStatusUpdate Optional callback for receiving screenshot capture status updates
 * @returns A promise that resolves with the text description of the screenshot
 */
export async function captureAndAnalyzeScreenshot(
  prompt: string = "What's in this image?",
  modelId?: string,
  onStatusUpdate?: ScreenshotStatusCallback
): Promise<string> {
  try {
    // Capture the screenshot
    const screenshot = await captureScreenshot(onStatusUpdate);

    // Process the screenshot with vision API
    return await processImageWithVision(screenshot, prompt, modelId);
  } catch (error) {
    console.error("Error capturing and analyzing screenshot:", error);
    throw error;
  }
}

export const handleAnalyzeScreen = async () => {
  try {
    const screenshot = await captureScreenshot();
    if (!screenshot) {
      console.error("Failed to capture screenshot");
      // TODO: Show user feedback
      return;
    }
    // Show loading state? Maybe append a temporary message?
    const result = await processImageWithVision(screenshot); // Assuming this returns text
    if (!result) {
      console.error("Failed to process image");
      // TODO: Show user feedback
      return;
    }
    // TODO: Decide how to use the 'result' (e.g., display it, append it?)
    console.log("Screen Analysis Result:", result);
  } catch (error) {
    console.error("Error analyzing screen:", error);
    // TODO: Show user feedback
  }
};
