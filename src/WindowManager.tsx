import { useEffect, useState } from "react";
import { getCurrentWindow as tauriWindow } from "@tauri-apps/api/window";
import App from "./views/Main/App";
import RecorderWindow from "./views/Recorder/RecorderWindow";

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
      return <App />;
    case "recorder":
      return <RecorderWindow />;
    default:
      return <div>Unknown window: {windowLabel}</div>;
  }
};

export default WindowManager;
