import { useEffect, useState } from "react";
import { getCurrentWindow as tauriWindow } from "@tauri-apps/api/window";
import { ConfigManagerWindow } from "./views/ConfigManager/ConfigManagerWindow";
import AppRouter from "./routes/AppRouter";

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
    return <div className="loading">Loading...</div>;
  }

  switch (windowLabel) {
    case "main":
      return <AppRouter />;
    case "settings":
      return <ConfigManagerWindow />;
    default:
      return <div>Unknown window: {windowLabel}</div>;
  }
};

export default WindowManager;
