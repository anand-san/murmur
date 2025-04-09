import { useEffect, useState } from "react";
import { getCurrentWindow as tauriWindow } from "@tauri-apps/api/window";
import App from "./views/Main/App";
import RecorderWindow from "./views/Recorder/RecorderWindow";
import AiInteractionWindow from "./views/AiInteraction/AiInteractionWindow"; // Import the new component

const WindowManager = () => {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    const getWindowLabel = async () => {
      try {
        const label = tauriWindow().label;
        console.log("Window label:", label);
        setWindowLabel(label);
      } catch (error) {
        console.error("Error getting window label:", error);
      }
    };

    getWindowLabel();
  }, []);

  if (windowLabel === null) {
    // Still loading
    return <div className="loading">Loading...</div>;
  }

  // Render the appropriate component based on the window label
  switch (windowLabel) {
    case "main":
      return (
        <>
          <div
            className="absolute bg-background top-0 h-7 w-full z-50"
            data-tauri-drag-region
          />
          <div className="h-screen w-52 bg-gray-800/50"></div>
          <div className="h-screen grow bg-gray-700/60">
            <App />
          </div>
        </>
      );
    case "recorder":
      return (
        <>
          <RecorderWindow />
        </>
      );
    case "ai_interaction": // Add case for the new window
      return (
        <>
          <div className="min-h-[250px] grow bg-background/50 rounded-md">
            <div
              className="absolute top-0 h-7 w-full z-50"
              data-tauri-drag-region
            />
            <AiInteractionWindow />
          </div>
        </>
      );
    default:
      return <div>Unknown window: {windowLabel}</div>;
  }
};

export default WindowManager;
