import { useEffect, useState } from "react";
import { getCurrentWindow as tauriWindow } from "@tauri-apps/api/window";
import AiInteractionWindow from "./views/AiInteraction/AiInteractionWindow";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ConfigManagerWindow } from "./views/ConfigManager/ConfigManagerWindow";

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
          <div className="h-screen w-screen grow bg-background/50">
            <div
              className="absolute top-0 h-7 w-full z-50"
              data-tauri-drag-region
            />
            <Routes>
              <Route path="/" element={<AiInteractionWindow />} />
              <Route path="/settings" element={<ConfigManagerWindow />} />
            </Routes>
          </div>
        </>
      );
    default:
      return <div>Unknown window: {windowLabel}</div>;
  }
};

export default WindowManager;
